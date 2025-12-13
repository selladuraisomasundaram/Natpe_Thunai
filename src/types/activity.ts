export interface MarketTransactionItem {
  id: string;
  itemName: string;
  sellerName: string;
  buyerName: string;
  amount: number;
  date: string;
  status: 'completed' | 'pending' | 'cancelled';
}

export interface FoodOrderItem {
  id: string;
  restaurantName: string;
  items: string[];
  totalAmount: number;
  date: string;
  status: 'delivered' | 'preparing' | 'cancelled';
}