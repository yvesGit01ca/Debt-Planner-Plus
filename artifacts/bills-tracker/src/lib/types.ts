export type Currency = 'EUR €' | 'USD $' | 'GBP £' | 'GHS';

export type Category = 
  | 'Housing' 
  | 'Streaming' 
  | 'Utilities' 
  | 'Insurance' 
  | 'Phone' 
  | 'Transport' 
  | 'Subscription' 
  | 'Loan' 
  | 'Other';

export interface Bill {
  id: string;
  name: string;
  amount: number;
  currency: Currency;
  category: Category;
  dayOfMonth: number; // 1-31
}

export const SEED_BILLS: Bill[] = [
  { id: '1', name: 'Rent', amount: 850, currency: 'EUR €', dayOfMonth: 1, category: 'Housing' },
  { id: '2', name: 'Netflix', amount: 17.99, currency: 'EUR €', dayOfMonth: 5, category: 'Streaming' },
  { id: '3', name: 'Electricity', amount: 65, currency: 'EUR €', dayOfMonth: 10, category: 'Utilities' },
  { id: '4', name: 'Spotify', amount: 10.99, currency: 'EUR €', dayOfMonth: 12, category: 'Streaming' },
  { id: '5', name: 'Phone', amount: 19.99, currency: 'EUR €', dayOfMonth: 20, category: 'Phone' },
  { id: '6', name: 'Health insurance', amount: 120, currency: 'EUR €', dayOfMonth: 25, category: 'Insurance' }
];
