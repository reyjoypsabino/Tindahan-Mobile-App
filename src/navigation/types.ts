export interface CartItem {
  id: number;
  name: string;
  price: number;
  qty: number;
}

export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  Signup: undefined;
  Main: undefined;
};

export type POSStackParamList = {
  POSHome: { saleId?: number } | undefined;
  Payment: { total?: number; cart?: CartItem[] } | undefined;
};

export type InventoryStackParamList = {
  InventoryHome: undefined;
  AddStock: undefined;
  StockExpiryEditor: { name?: string } | undefined;
  EditProduct: { id: number };
};

export type UtangStackParamList = {
  UtangHome: undefined;
  CreditPaymentModal: { id?: string; name?: string; amount?: number } | undefined;
  AddUtang: { name?: string } | undefined;
  UtangCustomer: { name: string };
};

export type MoreStackParamList = {
  MoreHome: undefined;
  RestockList: undefined;
  ExpiryTracker: undefined;
  PricingCalculator: undefined;
  Expenses: undefined;
  Reports: undefined;
  StockExpiryEditor: { name?: string } | undefined;
};
