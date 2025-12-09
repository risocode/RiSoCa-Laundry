
export const RKR_ORDERS_KEY = 'rkr-orders';
export const RKR_RATES_KEY = 'rkr-rates';
export const RKR_EXPENSES_KEY = 'rkr-expenses';

/**
 * Generates a sequential RKR order ID based on existing orders.
 * @param orders - An array of existing orders.
 * @returns The next sequential order ID (e.g., RKR001).
 */
export const generateOrderId = (orders: { id: string }[]) => {
  try {
    if (!orders || orders.length === 0) {
      return 'RKR000';
    }

    const latestOrderNumber = orders
      .map(o => parseInt(o.id.replace('RKR', ''), 10))
      .filter(n => !isNaN(n))
      .sort((a, b) => b - a)[0];
    
    const nextOrderNumber = isFinite(latestOrderNumber) ? latestOrderNumber + 1 : 0;
    
    return `RKR${String(nextOrderNumber).padStart(3, '0')}`;
  } catch (error) {
    console.error("Failed to generate order ID:", error);
    // Fallback to a random-like ID if parsing fails
    const timestamp = new Date().getTime();
    return `RKR-ERR${String(timestamp).slice(-4)}`;
  }
};
