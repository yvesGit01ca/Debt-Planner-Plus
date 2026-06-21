import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import type { Bill } from "@/types/bill";
import type { Debt, FinancialProfile } from "@/types/debt";

import { effectiveDayInMonth, formatCurrency, isDebtActiveInMonth } from "./calculations";

// iOS caps pending scheduled notifications around 64; stay safely under it.
const MAX_SCHEDULED = 60;

let handlerConfigured = false;

// Registers how notifications are presented while the app is foregrounded, plus
// the Android channel. Safe to call multiple times; only runs once.
export async function configureNotifications(): Promise<void> {
  if (Platform.OS === "web" || handlerConfigured) return;
  handlerConfigured = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("payment-reminders", {
      name: "Payment reminders",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
}

// Requests OS notification permission, returning whether it is granted.
export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (current.canAskAgain === false) return false;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

// Item identity carried in each scheduled notification so a tap can deep-link to
// the matching debt/bill screen. Kept minimal and serializable.
export interface ReminderData {
  itemId: string;
  itemType: "debt" | "bill";
}

interface Reminder {
  title: string;
  amount: number;
  currency: string;
  triggerDate: Date;
  itemId: string;
  itemType: "debt" | "bill";
}

// Finds the next upcoming due-day occurrence whose reminder (due − lead) is still
// in the future. For debts, `isActiveInMonth` restricts to the active term.
// Exported for unit testing; local notification delivery can't be exercised on web.
export function nextReminderTrigger(
  day: number,
  leadMs: number,
  now: Date,
  hour: number,
  minute: number,
  isActiveInMonth?: (month: number, year: number) => boolean,
): Date | null {
  for (let i = 0; i < 13; i++) {
    let m = now.getMonth() + i;
    let y = now.getFullYear();
    while (m > 11) {
      m -= 12;
      y++;
    }
    if (isActiveInMonth && !isActiveInMonth(m, y)) continue;
    const effDay = effectiveDayInMonth(day, y, m);
    const dueDate = new Date(y, m, effDay, hour, minute, 0, 0);
    const trigger = new Date(dueDate.getTime() - leadMs);
    if (trigger.getTime() > now.getTime() + 1000) return trigger;
  }
  return null;
}

// Serializes reschedule runs. scheduleReminders is invoked from several places
// (data/preference changes, app foreground) that can overlap; without
// serialization a "cancel-all" from one run could land after another run has
// already scheduled, producing duplicate or stale reminders. We chain every run
// onto a single queue and stamp each with a monotonic token so superseded runs
// abort before (and during) scheduling.
let scheduleQueue: Promise<void> = Promise.resolve();
let latestToken = 0;

// Cancels all existing reminders and (if enabled) schedules one per upcoming
// debt and bill. Runs are serialized and the latest call wins.
export function scheduleReminders(
  debts: Debt[],
  bills: Bill[],
  profile: FinancialProfile,
): Promise<void> {
  if (Platform.OS === "web") return Promise.resolve();
  const token = ++latestToken;
  scheduleQueue = scheduleQueue
    .catch(() => {})
    .then(() => runSchedule(debts, bills, profile, token));
  return scheduleQueue;
}

async function runSchedule(
  debts: Debt[],
  bills: Bill[],
  profile: FinancialProfile,
  token: number,
): Promise<void> {
  // A newer run has superseded this one — skip entirely.
  if (token !== latestToken) return;
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!profile.notificationsEnabled) return;

  const leadHours = profile.notificationLeadHours >= 48 ? 48 : 24;
  const leadMs = leadHours * 3600 * 1000;
  const now = new Date();
  const whenText = leadHours >= 48 ? "in 2 days" : "tomorrow";
  const hour = Number.isFinite(profile.notificationHour)
    ? Math.min(23, Math.max(0, Math.round(profile.notificationHour)))
    : 9;
  const minute = Number.isFinite(profile.notificationMinute)
    ? Math.min(59, Math.max(0, Math.round(profile.notificationMinute)))
    : 0;

  const reminders: Reminder[] = [];

  for (const d of debts) {
    if (d.monthlyPayment <= 0) continue;
    const trigger = nextReminderTrigger(d.dueDay, leadMs, now, hour, minute, (m, y) =>
      isDebtActiveInMonth(d.startMonth, d.startYear, d.totalMonths, m, y),
    );
    if (trigger) {
      reminders.push({
        title: d.name,
        amount: d.monthlyPayment,
        currency: d.currency,
        triggerDate: trigger,
        itemId: d.id,
        itemType: "debt",
      });
    }
  }

  for (const b of bills) {
    if (b.amount <= 0) continue;
    const trigger = nextReminderTrigger(b.dayOfMonth, leadMs, now, hour, minute);
    if (trigger) {
      reminders.push({
        title: b.name,
        amount: b.amount,
        currency: b.currency,
        triggerDate: trigger,
        itemId: b.id,
        itemType: "bill",
      });
    }
  }

  reminders.sort((a, b) => a.triggerDate.getTime() - b.triggerDate.getTime());

  for (const r of reminders.slice(0, MAX_SCHEDULED)) {
    // A newer run superseded this one mid-loop — stop adding stale reminders.
    if (token !== latestToken) return;
    await Notifications.scheduleNotificationAsync({
      content: {
        title: r.title,
        body: `${formatCurrency(r.amount, r.currency)} is due ${whenText}`,
        sound: true,
        data: { itemId: r.itemId, itemType: r.itemType } satisfies ReminderData,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: r.triggerDate,
      },
    });
  }
}

export async function cancelAllReminders(): Promise<void> {
  if (Platform.OS === "web") return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// Maps a notification's data payload to the edit screen for the matching debt or
// bill. Returns null for payloads that lack a valid item id/type (e.g. legacy
// reminders scheduled before deep-linking existed), so callers can ignore them.
export function reminderRouteFromData(
  data: unknown,
): { pathname: "/add-debt" | "/add-bill"; params: { editId: string } } | null {
  if (!data || typeof data !== "object") return null;
  const { itemId, itemType } = data as Partial<ReminderData>;
  if (typeof itemId !== "string" || itemId.length === 0) return null;
  if (itemType === "debt") {
    return { pathname: "/add-debt", params: { editId: itemId } };
  }
  if (itemType === "bill") {
    return { pathname: "/add-bill", params: { editId: itemId } };
  }
  return null;
}
