// src/features/marketplace/types.ts
export interface MarketplaceItem {
    id: number;
    seller: number;
    seller_username: string;
    title: string;
    description: string;
    price: number;
    item_type: string;
    condition: string;
    location: string;
    item_pickup_deadline: string | null;
    is_sold: boolean;
    posted_date: string;
    images?: ItemImage[];
  }
  
  export interface ItemImage {
    id: number;
    image: string;
  }
  
  export interface MarketplaceMessage {
    id: number;
    item: number;
    sender: number;
    receiver: number;
    sender_username: string;
    receiver_username: string;
    content: string;
    timestamp: string;
    is_read: boolean;
  }
  
  export interface MarketplaceFilters {
    search?: string;
    item_type?: string;
    min_price?: number;
    max_price?: number;
    is_sold?: boolean;
    my_items?: boolean;
  }