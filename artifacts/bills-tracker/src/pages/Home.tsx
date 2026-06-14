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
import { List, Trash2, ChevronLeft, ChevronRight, Sun, Moon } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, startOfWeek, endOfWeek } from 'date-fns';

const EMPTY_FORM = { name: '', amount: '', currency: 'EUR €', category: 'Housing', day: '1' };

const LABEL = 'text-[0.6875rem] font-medium tracking-[0.08em] uppercase text-muted-foreground';

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
    setErrors((e) => ({ ...e, [key]: undefined }));
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

  const selectedDayBills = selectedDate
    ? bills.filter(
        (b) => effectiveDayInMonth(b.dayOfMonth, selectedDate.getFullYear(), selectedDate.getMonth()) === selectedDate.getDate()
      )
    : [];
  const selectedDayTotal = selectedDayBills.reduce((acc, b) => acc + b.amount, 0);

  const atLimit = bills.length >= MAX_BILLS;
  const billWord = (n: number) => `${n} ${n === 1 ? 'bill' : 'bills'}`;

  return (
    <div className="min-h-screen bg-background">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="max-w-3xl mx-auto px-5 py-8 md:py-10"
      >
        {/* Header */}
        <header className="space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-lg font-semibold tracking-[-0.02em] text-foreground leading-tight">Debt Planner</h1>
              <p className="text-[0.8125rem] text-muted-foreground mt-0.5">
                {billWord(bills.length)} · {formatCurrency(monthlyTotal, primaryCurrency)}/mo
              </p>
            </div>

            <div className="flex items-center gap-1 -mr-2">
              <Sheet open={isListOpen} onOpenChange={setIsListOpen}>
                <SheetTrigger asChild>
                  <button
                    className="p-2 rounded-md text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Manage all bills"
                  >
                    <List className="w-4 h-4" />
                  </button>
                </SheetTrigger>
                <BillListSheet
                  bills={bills}
                  total={formatCurrency(monthlyTotal, primaryCurrency)}
                  onDelete={handleDelete}
                />
              </Sheet>

              <button
                onClick={toggleTheme}
                className="p-2 rounded-md text-muted-foreground hover:text-foreground transition-colors"
                aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Add bill */}
          <Dialog open={isAddOpen} onOpenChange={(open) => { setIsAddOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="w-full h-10 rounded-lg font-medium">Add a bill</Button>
            </DialogTrigger>
            <AddBillDialog
              form={form}
              errors={errors}
              atLimit={atLimit}
              onField={setField}
              onSubmit={handleAddSubmit}
            />
          </Dialog>
        </header>

        {/* Stats */}
        <section className="grid grid-cols-2 gap-4 mt-8">
          <div>
            <p className={LABEL}>Bills</p>
            <p className="text-[2rem] font-bold tracking-[-0.04em] tabular-nums leading-none mt-1.5">{bills.length}</p>
          </div>
          <div className="text-right">
            <p className={LABEL}>This month</p>
            <p className="text-[2rem] font-bold tracking-[-0.04em] tabular-nums leading-none mt-1.5">
              {formatCurrency(monthlyTotal, primaryCurrency)}
            </p>
          </div>
        </section>
        <p className="text-[0.8125rem] text-muted-foreground mt-3">
          {formatCurrency(stillDue, primaryCurrency)} still due
        </p>

        {/* Month navigation */}
        <div className="flex items-center justify-between mt-10">
          <div className="flex items-center gap-1">
            <button onClick={prevMonth} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors" aria-label="Previous month">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-semibold tracking-[-0.01em] min-w-[120px] text-center">{format(currentDate, 'MMMM yyyy')}</span>
            <button onClick={nextMonth} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors" aria-label="Next month">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <button onClick={goToday} className="text-xs text-muted-foreground hover:text-foreground transition-colors" aria-label="Jump to current month">
            Today
          </button>
        </div>

        {/* Calendar */}
        <div className="mt-4">
          <div className="grid grid-cols-7 mb-1">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
              <div key={i} className="text-center text-[0.6875rem] font-medium tracking-[0.08em] uppercase text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((date) => {
              const isCurrentMonth = isSameMonth(date, currentDate);
              const isToday = isSameDay(date, new Date());
              const isSelected = selectedDate ? isSameDay(date, selectedDate) : false;
              const dayBills = bills.filter(
                (b) => effectiveDayInMonth(b.dayOfMonth, date.getFullYear(), date.getMonth()) === date.getDate()
              );

              return (
                <button
                  key={date.toString()}
                  type="button"
                  aria-label={`${format(date, 'EEEE, MMMM d')}, ${billWord(dayBills.length)} due`}
                  onClick={() => setSelectedDate(date)}
                  className={cn(
                    'group min-h-[52px] sm:min-h-[68px] p-1.5 rounded-lg text-left transition-colors outline-none flex flex-col',
                    'hover:bg-accent focus-visible:bg-accent focus-visible:ring-1 focus-visible:ring-ring',
                    isSelected && 'ring-1 ring-foreground/20 bg-accent/60',
                    !isCurrentMonth && 'opacity-40'
                  )}
                >
                  <div className="flex justify-start mb-1">
                    <span className={cn(
                      'inline-flex items-center justify-center text-[0.8125rem] font-medium tabular-nums w-6 h-6 rounded-full',
                      isToday ? 'bg-primary text-primary-foreground' : 'text-foreground'
                    )}>
                      {date.getDate()}
                    </span>
                  </div>

                  <div className="space-y-0.5 min-w-0">
                    {dayBills.slice(0, 2).map((bill) => {
                      const color = getCategoryColor(bill.category);
                      return (
                        <Tooltip key={bill.id}>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-1.5 min-w-0 cursor-default">
                              <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', color.dot)} />
                              <span className="truncate text-[0.6875rem] text-foreground/80 leading-tight">{bill.name}</span>
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
                      <div className="text-[0.6875rem] text-muted-foreground pl-3 leading-tight">+{dayBills.length - 2}</div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* Day detail */}
      <Sheet open={selectedDate !== null} onOpenChange={(open) => { if (!open) setSelectedDate(null); }}>
        <SheetContent side="right" className="w-full sm:max-w-sm">
          <SheetHeader>
            <SheetTitle className="text-lg font-semibold tracking-[-0.02em]">
              {selectedDate ? format(selectedDate, 'MMMM d') : ''}
            </SheetTitle>
            <SheetDescription className="sr-only">Bills due on the selected day.</SheetDescription>
          </SheetHeader>

          {selectedDayBills.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-16">No bills on this day</p>
          ) : (
            <div className="mt-4">
              <div className="divide-y divide-border">
                {selectedDayBills.map((bill) => (
                  <BillRow key={bill.id} bill={bill} onDelete={handleDelete} />
                ))}
              </div>
              <div className="flex items-center justify-between pt-4 mt-2 border-t border-border">
                <span className="text-[0.8125rem] text-muted-foreground">Total</span>
                <span className="text-sm font-semibold tabular-nums">{formatCurrency(selectedDayTotal, selectedDayBills[0]?.currency || 'EUR €')}</span>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function BillRow({ bill, onDelete }: { bill: import('@/lib/types').Bill; onDelete: (id: string) => void }) {
  const color = getCategoryColor(bill.category);
  return (
    <div className="group flex items-center gap-3 py-3 transition-colors">
      <span className={cn('w-2 h-2 rounded-full shrink-0', color.dot)} />
      <div className="min-w-0 flex-1">
        <div className="text-sm text-foreground truncate">{bill.name}</div>
        <div className="text-[0.75rem] text-muted-foreground">due the {getOrdinalSuffix(bill.dayOfMonth)}</div>
      </div>
      <span className="text-sm font-semibold tabular-nums shrink-0">{formatCurrency(bill.amount, bill.currency)}</span>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <button
            className="shrink-0 p-1 rounded-md text-muted-foreground opacity-0 group-hover:opacity-100 focus:opacity-100 hover:text-destructive transition-opacity"
            aria-label={`Delete ${bill.name}`}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {bill.name}?</AlertDialogTitle>
            <AlertDialogDescription>This removes the bill from your planner. This can't be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => onDelete(bill.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function BillListSheet({ bills, total, onDelete }: { bills: import('@/lib/types').Bill[]; total: string; onDelete: (id: string) => void }) {
  return (
    <SheetContent side="right" className="w-full sm:max-w-sm">
      <SheetHeader>
        <SheetTitle className="flex items-center gap-2 text-lg font-semibold tracking-[-0.02em]">
          All bills
          <span className="text-sm font-normal text-muted-foreground tabular-nums">{bills.length}</span>
        </SheetTitle>
        <SheetDescription className="text-[0.8125rem]">{total} per month</SheetDescription>
      </SheetHeader>
      <div className="mt-4 overflow-y-auto pb-6">
        {bills.length === 0 ? (
          <p className="text-sm text-muted-foreground py-16 text-center">No bills added yet</p>
        ) : (
          <div className="divide-y divide-border">
            {bills.map((bill) => (
              <BillRow key={bill.id} bill={bill} onDelete={onDelete} />
            ))}
          </div>
        )}
      </div>
    </SheetContent>
  );
}

type AddBillDialogProps = {
  form: typeof EMPTY_FORM;
  errors: BillFieldErrors;
  atLimit: boolean;
  onField: (key: keyof typeof EMPTY_FORM, value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
};

function AddBillDialog({ form, errors, atLimit, onField, onSubmit }: AddBillDialogProps) {
  const inputBase = 'h-10 bg-input border-border';
  return (
    <DialogContent className="sm:max-w-[420px]">
      <DialogHeader>
        <DialogTitle className="text-lg font-semibold tracking-[-0.02em]">New bill</DialogTitle>
        <DialogDescription className="sr-only">Add a recurring monthly bill.</DialogDescription>
      </DialogHeader>
      <form onSubmit={onSubmit} className="space-y-5 mt-2" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="name" className={LABEL}>Name</Label>
          <Input
            id="name"
            value={form.name}
            maxLength={MAX_NAME_LENGTH}
            onChange={(e) => onField('name', e.target.value)}
            placeholder="Rent"
            aria-invalid={!!errors.name}
            className={cn(inputBase, errors.name && 'border-destructive focus-visible:ring-destructive')}
          />
          {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2 space-y-1.5">
            <Label htmlFor="amount" className={LABEL}>Amount</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              inputMode="decimal"
              value={form.amount}
              maxLength={12}
              onChange={(e) => onField('amount', e.target.value)}
              placeholder="0.00"
              aria-invalid={!!errors.amount}
              className={cn(inputBase, errors.amount && 'border-destructive focus-visible:ring-destructive')}
            />
            {errors.amount && <p className="text-xs text-destructive">{errors.amount}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="currency" className={LABEL}>Currency</Label>
            <Select value={form.currency} onValueChange={(v) => onField('currency', v)}>
              <SelectTrigger id="currency" aria-label="Currency" className={cn(inputBase, 'w-full')}><SelectValue /></SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="day" className={LABEL}>Day of month</Label>
            <Input
              id="day"
              type="number"
              min="1"
              max="31"
              step="1"
              value={form.day}
              onChange={(e) => onField('day', e.target.value)}
              placeholder="1–31"
              aria-invalid={!!errors.day}
              className={cn(inputBase, errors.day && 'border-destructive focus-visible:ring-destructive')}
            />
            {errors.day && <p className="text-xs text-destructive">{errors.day}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="category" className={LABEL}>Category</Label>
            <Select value={form.category} onValueChange={(v) => onField('category', v)}>
              <SelectTrigger id="category" aria-label="Category" className={cn(inputBase, 'w-full')}><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    <span className="flex items-center gap-2">
                      <span className={cn('w-1.5 h-1.5 rounded-full', getCategoryColor(c).dot)} />
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

        <Button type="submit" className="w-full h-11 rounded-lg font-medium" disabled={atLimit}>Save bill</Button>
      </form>
    </DialogContent>
  );
}

function HomeSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-5 py-8 md:py-10">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-44" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-8 w-8 rounded-md" />
          </div>
        </div>
        <Skeleton className="h-10 w-full rounded-lg mt-5" />
        <div className="grid grid-cols-2 gap-4 mt-8">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
        <Skeleton className="h-[360px] w-full rounded-lg mt-10" />
      </div>
    </div>
  );
}
