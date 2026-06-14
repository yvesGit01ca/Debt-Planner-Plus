import { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useBills } from '@/hooks/use-bills';
import { useTheme } from '@/hooks/use-theme';
import { CURRENCIES, CATEGORIES, MAX_BILLS, MAX_NAME_LENGTH } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from '@/components/ui/sheet';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { cn, getCategoryColor, formatCurrency, getOrdinalSuffix, effectiveDayInMonth, validateBillInput, type BillFieldErrors } from '@/lib/utils';
import { Plus, List, Trash2, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Wallet, Sun, Moon } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, startOfWeek, endOfWeek } from 'date-fns';

const EMPTY_FORM = { name: '', amount: '', currency: 'EUR €', category: 'Housing', day: '1' };

export default function Home() {
  const { bills, addBill, deleteBill, isLoaded } = useBills();
  const { theme, toggleTheme } = useTheme();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isListOpen, setIsListOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [errors, setErrors] = useState<BillFieldErrors>({});

  if (!isLoaded) return <HomeSkeleton />;

  const setField = (key: keyof typeof form, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key === 'day' ? 'day' : key]: undefined }));
  };

  const resetForm = () => {
    setForm({ ...EMPTY_FORM });
    setErrors({});
  };

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToday = () => setCurrentDate(new Date());

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (bills.length >= MAX_BILLS) {
      toast.error(`You can track up to ${MAX_BILLS} bills.`);
      return;
    }

    const result = validateBillInput(form);
    if (!result.valid) {
      setErrors(result.errors);
      return;
    }

    const added = addBill(result.value);
    if (!added.ok) {
      toast.error(added.error);
      return;
    }

    toast.success(`${added.bill.name} added`, {
      description: `${formatCurrency(added.bill.amount, added.bill.currency)} · due ${getOrdinalSuffix(added.bill.dayOfMonth)} every month`,
    });
    resetForm();
    setIsAddOpen(false);
  };

  const handleDelete = (id: string) => {
    const target = bills.find((b) => b.id === id);
    const removed = deleteBill(id);
    if (removed && target) {
      toast.success(`${target.name} deleted`);
    } else if (!removed) {
      toast.error('Could not delete the bill. Please try again.');
    }
  };

  // Calendar logic
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarDays = eachDayOfInterval({ start: startOfWeek(monthStart), end: endOfWeek(monthEnd) });

  // Summary metrics
  const primaryCurrency = bills[0]?.currency || 'EUR €';
  const monthlyTotal = bills.reduce((acc, b) => acc + b.amount, 0);

  const todayNum = new Date().getDate();
  const isCurrentMonthThisMonth = isSameMonth(currentDate, new Date());

  let stillDue = 0;
  if (isCurrentMonthThisMonth) {
    const today = new Date();
    stillDue = bills
      .filter((b) => effectiveDayInMonth(b.dayOfMonth, today.getFullYear(), today.getMonth()) >= todayNum)
      .reduce((acc, b) => acc + b.amount, 0);
  } else if (currentDate > new Date()) {
    stillDue = monthlyTotal;
  }

  const categoryBreakdown = Object.entries(
    bills.reduce<Record<string, number>>((acc, b) => {
      acc[b.category] = (acc[b.category] || 0) + b.amount;
      return acc;
    }, {})
  ).sort((a, b) => b[1] - a[1]);

  const selectedDayBills = selectedDate
    ? bills.filter(
        (b) => effectiveDayInMonth(b.dayOfMonth, selectedDate.getFullYear(), selectedDate.getMonth()) === selectedDate.getDate()
      )
    : [];
  const selectedDayTotal = selectedDayBills.reduce((acc, b) => acc + b.amount, 0);

  const atLimit = bills.length >= MAX_BILLS;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-6 md:space-y-8">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="grid place-items-center w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/30">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Debt Planner</h1>
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{formatCurrency(monthlyTotal, primaryCurrency)}</span>
                {' '}across {bills.length} {bills.length === 1 ? 'bill' : 'bills'} this month
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={toggleTheme}
              className="shrink-0 rounded-full"
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>

            <Sheet open={isListOpen} onOpenChange={setIsListOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="shrink-0 rounded-full" aria-label="Manage all bills" title="Manage bills">
                  <List className="w-4 h-4" />
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-md">
                <SheetHeader>
                  <SheetTitle>All bills</SheetTitle>
                  <SheetDescription>
                    {bills.length} of {MAX_BILLS} bills · {formatCurrency(monthlyTotal, primaryCurrency)} / month
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-6 space-y-3 overflow-y-auto pb-6">
                  {bills.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No bills added yet.</p>
                  ) : (
                    bills.map((bill, i) => {
                      const color = getCategoryColor(bill.category);
                      return (
                        <motion.div
                          key={bill.id}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.25, delay: i * 0.03 }}
                          className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:border-primary/40 transition-colors"
                        >
                          <span className={cn('w-2.5 h-2.5 rounded-full shrink-0', color.dot)} />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold truncate">{bill.name}</span>
                              <span className={cn('text-[10px] uppercase tracking-wide font-medium px-1.5 py-0.5 rounded-md', color.badge)}>
                                {bill.category}
                              </span>
                            </div>
                            <div className="text-sm text-muted-foreground">Due {getOrdinalSuffix(bill.dayOfMonth)} every month</div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="font-semibold tabular-nums">{formatCurrency(bill.amount, bill.currency)}</div>
                          </div>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10" aria-label={`Delete ${bill.name}`}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete {bill.name}?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently remove this bill from your planner. This can't be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(bill.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </motion.div>
                      );
                    })
                  )}
                </div>
              </SheetContent>
            </Sheet>

            <Dialog open={isAddOpen} onOpenChange={(open) => { setIsAddOpen(open); if (!open) resetForm(); }}>
              <DialogTrigger asChild>
                <Button className="gap-2 rounded-full shadow-lg shadow-primary/25">
                  <Plus className="w-4 h-4" />
                  Add bill
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add a new bill</DialogTitle>
                  <DialogDescription>Track a recurring monthly payment on your calendar.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddSubmit} className="space-y-4 mt-2" noValidate>
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={form.name}
                      maxLength={MAX_NAME_LENGTH}
                      onChange={(e) => setField('name', e.target.value)}
                      placeholder="e.g. Rent"
                      aria-invalid={!!errors.name}
                      className={cn(errors.name && 'border-destructive focus-visible:ring-destructive')}
                    />
                    {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="amount">Amount</Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        min="0"
                        inputMode="decimal"
                        value={form.amount}
                        maxLength={12}
                        onChange={(e) => setField('amount', e.target.value)}
                        placeholder="0.00"
                        aria-invalid={!!errors.amount}
                        className={cn(errors.amount && 'border-destructive focus-visible:ring-destructive')}
                      />
                      {errors.amount && <p className="text-xs text-destructive">{errors.amount}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="currency">Currency</Label>
                      <Select value={form.currency} onValueChange={(v) => setField('currency', v)}>
                        <SelectTrigger id="currency" aria-label="Currency"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="day">Day of month</Label>
                      <Input
                        id="day"
                        type="number"
                        min="1"
                        max="31"
                        step="1"
                        value={form.day}
                        onChange={(e) => setField('day', e.target.value)}
                        aria-invalid={!!errors.day}
                        className={cn(errors.day && 'border-destructive focus-visible:ring-destructive')}
                      />
                      {errors.day && <p className="text-xs text-destructive">{errors.day}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="category">Category</Label>
                      <Select value={form.category} onValueChange={(v) => setField('category', v)}>
                        <SelectTrigger id="category" aria-label="Category"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map((c) => (
                            <SelectItem key={c} value={c}>
                              <span className="flex items-center gap-2">
                                <span className={cn('w-2 h-2 rounded-full', getCategoryColor(c).dot)} />
                                {c}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {atLimit && (
                    <p className="text-xs text-destructive">You've reached the {MAX_BILLS}-bill limit. Delete a bill to add more.</p>
                  )}

                  <Button type="submit" className="w-full" disabled={atLimit}>Save bill</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </motion.header>

        {/* Summary bar */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05, ease: 'easeOut' }}
          className="rounded-2xl border border-border bg-card p-5 md:p-6"
        >
          <div className="grid grid-cols-2 md:grid-cols-3 gap-5 md:gap-6">
            <SummaryStat label="Total bills" value={String(bills.length)} />
            <SummaryStat label="Monthly cost" value={formatCurrency(monthlyTotal, primaryCurrency)} highlight />
            <SummaryStat label="Still due this month" value={formatCurrency(stillDue, primaryCurrency)} />
          </div>

          {categoryBreakdown.length > 0 && (
            <div className="mt-5 pt-5 border-t border-border">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-3">By category</p>
              <div className="flex flex-wrap gap-2">
                {categoryBreakdown.map(([category, amount]) => {
                  const color = getCategoryColor(category as any);
                  return (
                    <span key={category} className={cn('inline-flex items-center gap-2 text-xs font-medium pl-2 pr-2.5 py-1.5 rounded-full', color.badge)}>
                      <span className={cn('w-2 h-2 rounded-full', color.dot)} />
                      {category}
                      <span className="opacity-70">·</span>
                      <span className="tabular-nums">{formatCurrency(amount, primaryCurrency)}</span>
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </motion.section>

        {/* Calendar controls */}
        <div className="flex items-center justify-between gap-2 rounded-2xl border border-border bg-card p-2">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={prevMonth} className="rounded-full" aria-label="Previous month"><ChevronLeft className="w-4 h-4" /></Button>
            <Button variant="ghost" size="icon" onClick={nextMonth} className="rounded-full" aria-label="Next month"><ChevronRight className="w-4 h-4" /></Button>
            <span className="font-semibold text-base md:text-lg ml-2 min-w-[120px] md:min-w-[150px]">
              {format(currentDate, 'MMMM yyyy')}
            </span>
          </div>
          <Button variant="outline" size="sm" onClick={goToday} className="gap-2 rounded-full" aria-label="Jump to current month">
            <CalendarIcon className="w-4 h-4" />
            Today
          </Button>
        </div>

        {/* Calendar grid */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease: 'easeOut' }}
          className="rounded-2xl border border-border bg-card overflow-hidden"
        >
          <div className="grid grid-cols-7 border-b border-border bg-muted/40">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="p-2 md:p-3 text-[11px] md:text-sm font-semibold text-muted-foreground text-center border-r border-border last:border-r-0">
                <span className="hidden sm:inline">{day}</span>
                <span className="sm:hidden">{day[0]}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 auto-rows-fr">
            {calendarDays.map((date) => {
              const isCurrentMonth = isSameMonth(date, currentDate);
              const isToday = isSameDay(date, new Date());
              const dayBills = bills.filter(
                (b) => effectiveDayInMonth(b.dayOfMonth, date.getFullYear(), date.getMonth()) === date.getDate()
              );

              return (
                <div
                  key={date.toString()}
                  role="button"
                  tabIndex={0}
                  aria-label={`${format(date, 'EEEE, MMMM d')}, ${dayBills.length} ${dayBills.length === 1 ? 'bill' : 'bills'} due`}
                  onClick={() => setSelectedDate(date)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedDate(date); } }}
                  className={cn(
                    'group min-h-[80px] sm:min-h-[110px] md:min-h-[120px] p-1.5 md:p-2 border-r border-b border-border last:border-r-0 cursor-pointer outline-none transition-colors',
                    'hover:bg-accent/40 focus-visible:bg-accent/40 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
                    isCurrentMonth ? 'bg-card' : 'bg-muted/30 text-muted-foreground'
                  )}
                >
                  <div className="flex justify-end mb-1">
                    <span className={cn(
                      'w-7 h-7 flex items-center justify-center text-xs md:text-sm rounded-full transition-colors',
                      isToday
                        ? 'bg-gradient-to-br from-indigo-500 to-violet-600 text-white font-semibold shadow-md shadow-indigo-500/30'
                        : isCurrentMonth ? 'text-foreground group-hover:bg-background/60' : 'text-muted-foreground'
                    )}>
                      {date.getDate()}
                    </span>
                  </div>

                  <div className="space-y-1">
                    {dayBills.slice(0, 2).map((bill) => {
                      const color = getCategoryColor(bill.category);
                      return (
                        <Tooltip key={bill.id}>
                          <TooltipTrigger asChild>
                            <div className={cn(
                              'flex items-center gap-1 text-[10px] md:text-xs px-1.5 py-1 rounded-md truncate cursor-default transition-transform hover:scale-[1.03]',
                              isCurrentMonth ? color.chip : 'bg-muted text-muted-foreground opacity-60'
                            )}>
                              <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', color.dot)} />
                              <span className="truncate font-medium">{bill.name}</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            <div className="space-y-0.5">
                              <p className="font-semibold">{bill.name}</p>
                              <p className="text-xs text-muted-foreground">{formatCurrency(bill.amount, bill.currency)} · {bill.category}</p>
                              <p className="text-xs text-muted-foreground">Due {getOrdinalSuffix(bill.dayOfMonth)} every month</p>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                    {dayBills.length > 2 && (
                      <div className="text-[10px] md:text-xs px-1.5 text-muted-foreground font-medium">
                        +{dayBills.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Day detail dialog */}
        <Dialog open={selectedDate !== null} onOpenChange={(open) => { if (!open) setSelectedDate(null); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedDate ? format(selectedDate, 'EEEE, MMMM d') : ''}</DialogTitle>
              <DialogDescription>
                {selectedDayBills.length === 0
                  ? 'Nothing scheduled.'
                  : `${selectedDayBills.length} ${selectedDayBills.length === 1 ? 'bill' : 'bills'} due`}
              </DialogDescription>
            </DialogHeader>

            {selectedDayBills.length === 0 ? (
              <p className="text-muted-foreground text-sm py-6 text-center">No bills due on this day.</p>
            ) : (
              <div className="mt-1 space-y-3">
                {selectedDayBills.map((bill) => {
                  const color = getCategoryColor(bill.category);
                  return (
                    <div key={bill.id} className="flex items-center justify-between gap-3 p-3 rounded-xl border border-border bg-card">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className={cn('w-2.5 h-2.5 rounded-full shrink-0', color.dot)} />
                        <div className="min-w-0">
                          <div className="font-semibold truncate">{bill.name}</div>
                          <div className="text-sm text-muted-foreground">{formatCurrency(bill.amount, bill.currency)} · {bill.category}</div>
                          <div className="text-xs text-muted-foreground">Due {getOrdinalSuffix(bill.dayOfMonth)} every month</div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(bill.id)}
                        className="shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        aria-label={`Delete ${bill.name}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  );
                })}

                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <span className="text-sm text-muted-foreground">Total due this day</span>
                  <span className="text-lg font-semibold tabular-nums">{formatCurrency(selectedDayTotal, selectedDayBills[0]?.currency || 'EUR €')}</span>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

function SummaryStat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex flex-col justify-center">
      <p className="text-xs md:text-sm text-muted-foreground mb-1">{label}</p>
      <p className={cn('text-2xl md:text-3xl font-bold tracking-tight tabular-nums', highlight && 'text-primary')}>{value}</p>
    </div>
  );
}

function HomeSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-6 md:space-y-8">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Skeleton className="w-12 h-12 rounded-2xl" />
            <div className="space-y-2">
              <Skeleton className="h-7 w-40" />
              <Skeleton className="h-4 w-52" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="w-10 h-10 rounded-full" />
            <Skeleton className="w-10 h-10 rounded-full" />
            <Skeleton className="w-28 h-10 rounded-full" />
          </div>
        </div>
        <Skeleton className="h-36 w-full rounded-2xl" />
        <Skeleton className="h-14 w-full rounded-2xl" />
        <Skeleton className="h-[520px] w-full rounded-2xl" />
      </div>
    </div>
  );
}
