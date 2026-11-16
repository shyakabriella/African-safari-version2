export type BookingPaymentStatus =
  | "unpaid"
  | "pending"
  | "paid"
  | "failed";

export interface BookingSummary {
  id: number;
  reference: string;
  status: string;
  paymentStatus: BookingPaymentStatus;
  currency: string;
  total: string;
}
