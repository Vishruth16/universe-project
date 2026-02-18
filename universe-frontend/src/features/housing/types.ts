export interface HousingImage {
  id: number;
  image: string;
}

export interface HousingListing {
  id: number;
  posted_by: number;
  posted_by_username: string;
  title: string;
  description: string;
  housing_type: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  latitude: number | null;
  longitude: number | null;
  distance_to_campus: number | null;
  rent_price: string;
  bedrooms: number;
  bathrooms: number;
  sq_ft: number | null;
  lease_type: string;
  available_from: string | null;
  available_to: string | null;
  furnished: boolean;
  pets_allowed: boolean;
  parking: boolean;
  laundry: boolean;
  wifi_included: boolean;
  ac: boolean;
  utilities_included: boolean;
  amenities: string;
  is_available: boolean;
  posted_date: string;
  updated_date: string;
  images: HousingImage[];
}

export interface HousingInquiry {
  id: number;
  listing: number;
  sender: number;
  receiver: number;
  sender_username: string;
  receiver_username: string;
  message: string;
  timestamp: string;
  is_read: boolean;
}

export interface HousingFilters {
  search?: string;
  housing_type?: string;
  min_price?: number;
  max_price?: number;
  bedrooms?: number;
  bathrooms?: number;
  max_distance?: number;
  furnished?: boolean;
  pets_allowed?: boolean;
  parking?: boolean;
  laundry?: boolean;
  wifi_included?: boolean;
  ac?: boolean;
  utilities_included?: boolean;
  is_available?: boolean;
  my_listings?: boolean;
}
