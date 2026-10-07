import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Product {
  id: string;
  name: string;
  meta: string;
  priceLabel: string;
  unitPrice: number;
  unit: string;
  supplier: string;
  stockLabel: string;
  status: string;
  low: boolean;
  cat: string;
  image?: number | null;
}

export interface ExpenseEntry {
  id: string;
  label: string;
  amount: number;
}

export interface LedgerEntry {
  id: string;
  name: string;
  amount: number;
  note: string;
  status: string;
  pill: string;
  due?: string;
  /** ISO timestamp of when the product was credited. */
  date: string;
  productName?: string;
  qty?: number;
}

export function formatCreditDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const SEED_IMAGES: Record<string, number> = {
  ligo: require('../assets/prod-ligo.jpg'),
  rice: require('../assets/prod-rice.jpg'),
  coke: require('../assets/prod-coke.jpg'),
  kopiko: require('../assets/prod-kopiko.jpg'),
  naturespring: require('../assets/prod-naturespring.jpg'),
};

const NAME_IMAGES: { match: string; image: number }[] = [
  { match: 'ligo', image: require('../assets/prod-ligo.jpg') },
  { match: 'kohaku', image: require('../assets/prod-rice.jpg') },
  { match: 'jasmine', image: require('../assets/prod-rice.jpg') },
  { match: 'rice', image: require('../assets/prod-rice.jpg') },
  { match: 'nature', image: require('../assets/prod-naturespring.jpg') },
  { match: 'kopiko', image: require('../assets/prod-kopiko.jpg') },
  { match: 'coca', image: require('../assets/prod-coke.jpg') },
  { match: 'coke', image: require('../assets/prod-coke.jpg') },
];

function imageFor(p: Product): number | null {
  if (p.id in SEED_IMAGES) return SEED_IMAGES[p.id];
  const name = p.name.toLowerCase();
  return NAME_IMAGES.find((m) => name.includes(m.match))?.image ?? null;
}

function withImages(list: Product[]): Product[] {
  // Asset IDs from require() are only valid within one Metro bundle, so never
  // trust persisted numbers: always re-resolve by id or product name.
  return list.map((p) => ({ ...p, image: imageFor(p) }));
}

const SEED_PRODUCTS: Product[] = [
  { id: 'ligo', name: 'Ligo Sardines', meta: 'Canned goods · 155 g', priceLabel: '₱25.00 / can', unitPrice: 25, unit: 'can', supplier: 'Mila Wholesale · delivery Mon', stockLabel: '6 cans', status: 'Low stock', low: true, cat: 'Canned', image: require('../assets/prod-ligo.jpg') },
  { id: 'rice', name: 'Regular milled rice', meta: 'Rice · sold by kilogram', priceLabel: '₱55.00 / kg', unitPrice: 55, unit: 'kg', supplier: 'Reyes Rice Supply · reorder 25 kg', stockLabel: '8 kg', status: 'Low stock', low: true, cat: 'Rice', image: require('../assets/prod-rice.jpg') },
  { id: 'coke', name: 'Coca-Cola', meta: 'Beverages · 250 ml', priceLabel: '₱20.00 / bottle', unitPrice: 20, unit: 'bottle', supplier: 'Coke Distributor · next visit Tue', stockLabel: '24 bottles', status: 'In stock', low: false, cat: 'Drinks', image: require('../assets/prod-coke.jpg') },
  { id: 'kopiko', name: 'Kopiko Brown', meta: 'Beverages · coffee sachet', priceLabel: '₱4.00 / sachet', unitPrice: 4, unit: 'sachet', supplier: 'Mila Wholesale · reorder 1 pack', stockLabel: '4 sachets', status: 'Low stock', low: true, cat: 'Drinks', image: require('../assets/prod-kopiko.jpg') },
];

const SEED_LEDGER: LedgerEntry[] = [
  { id: '1', name: 'Maria Santos', amount: 450, note: 'Ligo Sardines · 6 pcs', status: 'Overdue', pill: 'Overdue', date: '2026-09-28T09:00:00+08:00', productName: 'Ligo Sardines', qty: 6 },
  { id: '2', name: 'Juan Dela Cruz', amount: 280, note: 'Regular milled rice · 4 kg', status: 'Overdue', pill: 'Overdue', date: '2026-09-30T10:30:00+08:00', productName: 'Regular milled rice', qty: 4 },
  { id: '3', name: 'Ana Reyes', amount: 120, note: 'Coca-Cola · 6 bottles', status: 'Due Oct 5', pill: 'Due Oct 5', due: 'Oct 5', date: '2026-10-02T14:00:00+08:00', productName: 'Coca-Cola', qty: 6 },
  { id: '4', name: 'Ben Cruz', amount: 150, note: 'Kopiko Brown · 20 sachets', status: 'Due Oct 7', pill: 'Due Oct 7', due: 'Oct 7', date: '2026-10-04T11:15:00+08:00', productName: 'Kopiko Brown', qty: 20 },
];

interface Store {
  products: Product[];
  ledger: LedgerEntry[];
  loaded: boolean;
  addProduct: (p: { name: string; category: string; price: number; qty: number }) => void;
  addLedgerEntry: (e: { name: string; productName: string; unitPrice: number; qty: number; due?: string }) => void;
  updateLedgerEntry: (id: string, patch: { due?: string }) => void;
  removeLedgerEntry: (id: string) => void;
  recordPayment: (id: string, amount: number) => void;
  recordCustomerPayment: (name: string, amount: number) => void;
  expenses: ExpenseEntry[];
  addExpense: (label: string, amount: number) => void;
  updateProductPrice: (id: string, price: number) => void;
}

const StoreContext = createContext<Store | null>(null);

const PRODUCTS_KEY = '@tindahan/products';
const LEDGER_KEY = '@tindahan/ledger';
const EXPENSES_KEY = '@tindahan/expenses';

const SEED_EXPENSES: ExpenseEntry[] = [
  { id: 'e1', label: 'Electricity', amount: 60 },
  { id: 'e2', label: 'Water', amount: 20 },
  { id: 'e3', label: 'Rent', amount: 80 },
  { id: 'e4', label: 'Mobile data', amount: 20 },
];

export function StoreProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>(SEED_PRODUCTS);
  const [ledger, setLedger] = useState<LedgerEntry[]>(SEED_LEDGER);
  const [expenses, setExpenses] = useState<ExpenseEntry[]>(SEED_EXPENSES);
  const [loaded, setLoaded] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
      try {
        const [p, l, e] = await Promise.all([
          AsyncStorage.getItem(PRODUCTS_KEY),
          AsyncStorage.getItem(LEDGER_KEY),
          AsyncStorage.getItem(EXPENSES_KEY),
        ]);
        if (p) setProducts(withImages(JSON.parse(p)));
        if (l) {
          // Backfill the credited date for entries saved before dates existed.
          const fallback = new Date().toISOString();
          setLedger(
            (JSON.parse(l) as LedgerEntry[]).map((e) => ({ ...e, date: e.date ?? fallback })),
          );
        }
        if (e) setExpenses(JSON.parse(e));
      } catch {
        // corrupted storage: keep seeds
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (loaded) AsyncStorage.setItem(PRODUCTS_KEY, JSON.stringify(products)).catch(() => {});
  }, [products, loaded]);

  useEffect(() => {
    if (loaded) AsyncStorage.setItem(LEDGER_KEY, JSON.stringify(ledger)).catch(() => {});
  }, [ledger, loaded]);

  useEffect(() => {
    if (loaded) AsyncStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses)).catch(() => {});
  }, [expenses, loaded]);

  const addProduct = useCallback((p: { name: string; category: string; price: number; qty: number }) => {
    setProducts((prev) => [
      ...prev,
      {
        id: `p${Date.now()}`,
        name: p.name,
        meta: `${p.category} · new item`,
        priceLabel: `₱${p.price.toFixed(2)}`,
        unitPrice: p.price,
        unit: 'pc',
        supplier: 'Local entry',
        stockLabel: `${p.qty} pcs`,
        status: 'In stock',
        low: false,
        cat: p.category,
      },
    ]);
  }, []);

  const addLedgerEntry = useCallback(
    (e: { name: string; productName: string; unitPrice: number; qty: number; due?: string }) => {
      const amount = e.unitPrice * e.qty;
      const label = `${e.productName} · ${e.qty} pcs`;
      const trimmedDue = e.due?.trim();
      setLedger((prev) => [
        ...prev,
        {
          id: `l${Date.now()}`,
          name: e.name,
          amount,
          note: label,
          status: 'Current',
          pill: 'Current',
          due: trimmedDue ? trimmedDue : undefined,
          date: new Date().toISOString(),
          productName: e.productName,
          qty: e.qty,
        },
      ]);
    },
    [],
  );

  const updateLedgerEntry = useCallback((id: string, patch: { due?: string }) => {
    setLedger((prev) =>
      prev.map((e) => (e.id === id ? { ...e, due: patch.due?.trim() ? patch.due.trim() : undefined } : e)),
    );
  }, []);

  const removeLedgerEntry = useCallback((id: string) => {
    setLedger((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const recordPayment = useCallback((id: string, amount: number) => {
    setLedger((prev) =>
      prev
        .map((e) => (e.id === id ? { ...e, amount: Math.max(0, e.amount - amount) } : e))
        .filter((e) => e.amount > 0),
    );
  }, []);

  const recordCustomerPayment = useCallback((name: string, amount: number) => {
    // Oldest credit first so the remaining balance always reflects recent debt.
    setLedger((prev) => {
      let left = amount;
      const target = prev
        .filter((e) => e.name === name)
        .sort((a, b) => a.date.localeCompare(b.date));
      const paidIds = new Map<string, number>();
      for (const e of target) {
        if (left <= 0) break;
        const take = Math.min(e.amount, left);
        paidIds.set(e.id, take);
        left -= take;
      }
      return prev
        .map((e) => {
          const take = paidIds.get(e.id);
          return take ? { ...e, amount: Math.max(0, e.amount - take) } : e;
        })
        .filter((e) => e.amount > 0);
    });
  }, []);

  const addExpense = useCallback((label: string, amount: number) => {
    setExpenses((prev) => [...prev, { id: `e${Date.now()}`, label, amount }]);
  }, []);

  const updateProductPrice = useCallback((id: string, price: number) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, unitPrice: price, priceLabel: `₱${price.toFixed(2)}${p.unit ? ` / ${p.unit}` : ''}` }
          : p,
      ),
    );
  }, []);

  const value = useMemo(
    () => ({ products, ledger, loaded, addProduct, addLedgerEntry, updateLedgerEntry, removeLedgerEntry, recordPayment, recordCustomerPayment, expenses, addExpense, updateProductPrice }),
    [products, ledger, loaded, addProduct, addLedgerEntry, updateLedgerEntry, removeLedgerEntry, recordPayment, recordCustomerPayment, expenses, addExpense, updateProductPrice],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}
