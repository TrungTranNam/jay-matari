import type { OrderStatus, PayStatus } from '@prisma/client';

// Shapes of the JSON snapshots stored on Order (prices frozen at purchase time).
export type OrderItem = { sku: string; name: string; price: number; img: string; size: string; color: string; qty: number };
export type OrderAddress = { name: string; phone: string; line: string; city: string; state: string; pin: string; landmark?: string | null };

export const STATUS_LABEL: Record<OrderStatus, string> = {
  PLACED: 'Placed', CONFIRMED: 'Confirmed', PACKED: 'Packed', SHIPPED: 'Shipped', DELIVERED: 'Delivered', CANCELLED: 'Cancelled',
};
export const FLOW: OrderStatus[] = ['PLACED', 'CONFIRMED', 'PACKED', 'SHIPPED', 'DELIVERED'];
export const CANCELLABLE: OrderStatus[] = ['PLACED', 'CONFIRMED'];

export const PAY_LABEL: Record<string, string> = {
  cod: 'Cash on delivery', upi: 'UPI', razorpay: 'Online (card, netbanking, wallet)',
};

export const PAY_STATUS_LABEL: Record<PayStatus, string> = {
  PENDING: 'Awaiting payment', AWAITING_CHECK: 'Verifying payment', PAID: 'Paid', FAILED: 'Payment failed', REFUNDED: 'Refunded',
};

// online orders the customer can still pay for (from checkout or My orders)
export const needsPayment = (o: { status: OrderStatus; payment: string; paymentStatus: PayStatus }) =>
  o.status === 'PLACED' && o.payment !== 'cod' && (o.paymentStatus === 'PENDING' || o.paymentStatus === 'FAILED');

export const statusTone = (s: OrderStatus) => (s === 'DELIVERED' ? 'ok' : s === 'CANCELLED' ? 'bad' : 'info');
