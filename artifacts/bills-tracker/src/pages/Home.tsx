import { useState } from 'react';
import { useBills } from '@/hooks/use-bills';
import { Bill } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { getBillColor, formatCurrency, getOrdinalSuffix, effectiveDayInMonth } from '@/lib/utils';
import { Plus, List, Trash2, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, startOfWeek, endOfWeek } from 'date-fns';

export default function Home() {
  const { bills, addBill, deleteBill, isLoaded } = useBills();
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isListOpen, setIsListOpen] = useState(false);

  const [newName, setNewName] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newCurrency, setNewCurrency] = useState('EUR €');
  const [newCategory, setNewCategory] = useState('Housing');
  const [newDay, setNewDay] = useState('1');

  if (!isLoaded) return null;

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToday = () => setCurrentDate(new Date());

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const day = parseInt(newDay, 10);
    if (day < 1 || day > 31) return;
    if (!newName || !newAmount) return;

    addBill({
      id: Math.random().toString(36).substring(7),
      name: newName,
      amount: parseFloat(newAmount),
      currency: newCurrency as any,
      category: newCategory as any,
      dayOfMonth: day,
    });
    
    setIsAddOpen(false);
    setNewName('');
    setNewAmount('');
    setNewDay('1');
  };

  // Calendar logic
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  // Summary Metrics
  const monthlyTotal = bills.reduce((acc, b) => acc + b.amount, 0);
  
  const todayNum = new Date().getDate();
  const isCurrentMonthThisMonth = isSameMonth(currentDate, new Date());
  
  let stillDue = 0;
  if (isCurrentMonthThisMonth) {
    const today = new Date();
    stillDue = bills
      .filter(b => effectiveDayInMonth(b.dayOfMonth, today.getFullYear(), today.getMonth()) >= todayNum)
      .reduce((acc, b) => acc + b.amount, 0);
  } else if (currentDate > new Date()) {
    stillDue = monthlyTotal;
  }
  
  const daysInCurrentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const dailyAverage = monthlyTotal / daysInCurrentMonth;

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-medium tracking-tight text-foreground">Bills</h1>
          <p className="text-muted-foreground">Your recurring monthly expenses.</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Sheet open={isListOpen} onOpenChange={setIsListOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0" title="Manage bills">
                <List className="w-4 h-4" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>All bills</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-4">
                {bills.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No bills added yet.</p>
                ) : (
                  bills.map(bill => (
                    <div key={bill.id} className="flex items-center justify-between p-3 border rounded-md bg-card">
                      <div>
                        <div className="font-medium">{bill.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {formatCurrency(bill.amount, bill.currency)} • Due {getOrdinalSuffix(bill.dayOfMonth)}
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => deleteBill(bill.id)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </SheetContent>
          </Sheet>

          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Add bill
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add a new bill</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddSubmit} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" required value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Rent" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount</Label>
                    <Input id="amount" type="number" step="0.01" required value={newAmount} onChange={e => setNewAmount(e.target.value)} placeholder="0.00" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Select value={newCurrency} onValueChange={setNewCurrency}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EUR €">EUR €</SelectItem>
                        <SelectItem value="USD $">USD $</SelectItem>
                        <SelectItem value="GBP £">GBP £</SelectItem>
                        <SelectItem value="GHS">GHS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="day">Day of month</Label>
                    <Input id="day" type="number" min="1" max="31" required value={newDay} onChange={e => setNewDay(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select value={newCategory} onValueChange={setNewCategory}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Housing">Housing</SelectItem>
                        <SelectItem value="Streaming">Streaming</SelectItem>
                        <SelectItem value="Utilities">Utilities</SelectItem>
                        <SelectItem value="Insurance">Insurance</SelectItem>
                        <SelectItem value="Phone">Phone</SelectItem>
                        <SelectItem value="Transport">Transport</SelectItem>
                        <SelectItem value="Subscription">Subscription</SelectItem>
                        <SelectItem value="Loan">Loan</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button type="submit" className="w-full">Save bill</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* Calendar Controls */}
      <div className="flex items-center justify-between bg-card border rounded-lg p-2">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={prevMonth}><ChevronLeft className="w-4 h-4" /></Button>
          <Button variant="ghost" size="icon" onClick={nextMonth}><ChevronRight className="w-4 h-4" /></Button>
          <span className="font-medium text-lg ml-2 min-w-[140px]">
            {format(currentDate, 'MMMM yyyy')}
          </span>
        </div>
        <Button variant="outline" size="sm" onClick={goToday} className="gap-2">
          <CalendarIcon className="w-4 h-4" />
          Today
        </Button>
      </div>

      {/* Calendar Grid */}
      <div className="border rounded-lg bg-card overflow-hidden">
        {/* Days of week header */}
        <div className="grid grid-cols-7 border-b bg-muted/30">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-3 text-sm font-medium text-muted-foreground text-center border-r last:border-r-0">
              {day}
            </div>
          ))}
        </div>
        
        {/* Days grid */}
        <div className="grid grid-cols-7 auto-rows-fr">
          {calendarDays.map((date, i) => {
            const isCurrentMonth = isSameMonth(date, currentDate);
            const isToday = isSameDay(date, new Date());
            const dayBills = bills.filter(
              b => effectiveDayInMonth(b.dayOfMonth, date.getFullYear(), date.getMonth()) === date.getDate()
            );
            
            return (
              <div 
                key={date.toString()} 
                className={`min-h-[120px] p-2 border-r border-b last:border-r-0 hover:bg-muted/10 transition-colors ${
                  isCurrentMonth ? 'bg-card' : 'bg-muted/30 text-muted-foreground'
                }`}
              >
                <div className="flex justify-end mb-1">
                  <span className={`w-7 h-7 flex items-center justify-center text-sm rounded-full ${isToday ? 'bg-blue-500 text-white font-medium' : isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {date.getDate()}
                  </span>
                </div>
                
                <div className="space-y-1">
                  {dayBills.slice(0, 2).map((bill, index) => {
                    const color = getBillColor(bill.id);
                    return (
                      <Tooltip key={bill.id}>
                        <TooltipTrigger asChild>
                          <div 
                            className={`text-xs px-2 py-1 rounded truncate cursor-default transition-transform hover:scale-[1.02] ${
                              isCurrentMonth ? `${color.bg} ${color.text}` : 'bg-muted text-muted-foreground opacity-60'
                            }`}
                            style={{ animationDelay: `${(i * 0.02) + (index * 0.05)}s` }}
                          >
                            <span className="font-medium mr-1">{formatCurrency(bill.amount, bill.currency)}</span>
                            {bill.name}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          <div className="space-y-1">
                            <p className="font-medium">{bill.name}</p>
                            <p className="text-sm text-muted-foreground">{formatCurrency(bill.amount, bill.currency)} • {bill.category}</p>
                            <p className="text-sm text-muted-foreground">Due {getOrdinalSuffix(bill.dayOfMonth)} every month</p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                  {dayBills.length > 2 && (
                    <div className={`text-xs px-2 py-0.5 ${isCurrentMonth ? 'text-muted-foreground' : 'text-muted-foreground opacity-60'}`}>
                      +{dayBills.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border rounded-lg p-6 flex flex-col justify-center">
          <p className="text-sm text-muted-foreground mb-1">Monthly total</p>
          <p className="text-3xl font-medium">{formatCurrency(monthlyTotal, bills[0]?.currency || 'EUR €')}</p>
        </div>
        <div className="bg-card border rounded-lg p-6 flex flex-col justify-center">
          <p className="text-sm text-muted-foreground mb-1">Still due this month</p>
          <p className="text-3xl font-medium">{formatCurrency(stillDue, bills[0]?.currency || 'EUR €')}</p>
        </div>
        <div className="bg-card border rounded-lg p-6 flex flex-col justify-center">
          <p className="text-sm text-muted-foreground mb-1">Daily average</p>
          <p className="text-3xl font-medium">{formatCurrency(dailyAverage, bills[0]?.currency || 'EUR €')}</p>
        </div>
      </div>

    </div>
  );
}
