export const statusOptions = [
  'Order Created',
  'Order Placed',
  'Pickup Scheduled',
  'Washing',
  'Drying',
  'Folding',
  'Ready for Pick Up',
  'Out for Delivery',
  'Delivered',
  'Success',
  'Partial Complete',
  'Canceled',
];

export function getStatusColor(status: string): string {
  switch (status) {
    case 'Delivered':
    case 'Success':
      return 'bg-green-500';
    case 'Partial Complete':
      return 'bg-orange-400';
    case 'Out for Delivery':
    case 'Ready for Pick Up':
      return 'bg-blue-500';
    case 'Washing':
    case 'Drying':
    case 'Folding':
      return 'bg-yellow-500';
    case 'Pickup Scheduled':
    case 'Order Placed':
      return 'bg-orange-500';
    case 'Order Created':
      return 'bg-gray-500';
    case 'Canceled':
      return 'bg-red-500';
    default:
      return 'bg-gray-500';
  }
}

export function getPaymentStatusColor(isPaid: boolean): string {
  return isPaid ? 'bg-green-500' : 'bg-red-500';
}

export interface PaymentBadgeInfo {
  text: string;
  color: string;
  clickable: boolean;
}

export function getPaymentBadgeInfo(
  isPaid: boolean,
  isPartiallyPaid: boolean
): PaymentBadgeInfo {
  if (isPaid) {
    return { text: 'Paid', color: 'bg-green-500', clickable: false };
  } else if (isPartiallyPaid) {
    return { text: 'Balance', color: 'bg-orange-500', clickable: true };
  } else {
    return { text: 'Unpaid', color: 'bg-red-500', clickable: true };
  }
}
