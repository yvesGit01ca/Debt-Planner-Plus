// Minimal stub for expo-notifications. Only the named exports referenced by the
// module under test need to exist; the scheduling math doesn't invoke them.
export const AndroidImportance = { DEFAULT: 3 };
export const SchedulableTriggerInputTypes = { DATE: "date" };

export async function setNotificationHandler(): Promise<void> {}
export async function setNotificationChannelAsync(): Promise<void> {}
export async function getPermissionsAsync(): Promise<{ granted: boolean }> {
  return { granted: false };
}
export async function requestPermissionsAsync(): Promise<{ granted: boolean }> {
  return { granted: false };
}
export async function cancelAllScheduledNotificationsAsync(): Promise<void> {}
export async function scheduleNotificationAsync(): Promise<string> {
  return "stub-id";
}
