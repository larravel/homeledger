export type BillStatus = "paid" | "unpaid" | "overdue";

export type BillCategory =
  | "utility"
  | "rent"
  | "subscription"
  | "loan"
  | "insurance";

export type Frequency = "monthly" | "quarterly";

export interface Bill {
  id: string;
  name: string;
  provider: string;
  amount: number;
  dueDate: string; // YYYY-MM-DD
  status: BillStatus;
  category: BillCategory;

  // Recurring
  isRecurring?: boolean;
  frequency?: Frequency;
  recurringGroupId?: string; // groups recurring bills
}

export interface Payment {
  id: string;
  billId: string;
  paymentDate: string; // YYYY-MM-DD
  amountPaid: number;
  lateFee: number;
}

export interface UtilityUsage {
  id: string;
  billId: string;     // which utility bill (Electricity/Water)
  month: string;      // YYYY-MM
  value: number;      // usage amount
  unit: string;       // kWh, m³, etc.
  createdAt: string;  // YYYY-MM-DD
}