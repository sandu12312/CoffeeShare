// User related types
export interface UserProfile {
  uid?: string;
  displayName: string;
  email: string;
  photoURL?: string;
  role: UserRole;
  subscription?: Subscription;
  createdAt?: Date | number;
  updatedAt?: Date | number;
  phoneNumber?: string;
  address?: string;
  settings?: UserSettings;
  stats?: UserStats;
}

export type UserRole = "user" | "coffeePartner" | "admin";

export interface UserSettings {
  language: string;
  notifications: {
    email: boolean;
    push: boolean;
    marketing: boolean;
  };
  theme: "light" | "dark" | "system";
  privacy: {
    shareLocation: boolean;
    shareActivityData: boolean;
  };
}

export interface UserStats {
  totalCoffees: number;
  totalPoints: number;
  favoriteCafes: string[];
  badgesEarned: string[];
  lastActivityDate?: Date | number;
}

// Subscription related types
export interface Subscription {
  id: string;
  name: string;
  description?: string;
  price: number;
  duration: number; // in days
  startDate: Date | number;
  endDate: Date | number;
  status: "active" | "expired" | "pending" | "cancelled";
  features: string[];
  type: "basic" | "premium" | "gold";
  paymentMethod?: string;
  autoRenew: boolean;
}

// Activity related types
export type ActivityType =
  | "redeem"
  | "purchase"
  | "visit"
  | "rating"
  | "referral"
  | "subscription";

export interface ActivityLog {
  id: string;
  userId: string;
  type: ActivityType;
  timestamp: Date | number;
  details: {
    cafeId?: string;
    cafeName?: string;
    productId?: string;
    productName?: string;
    amount?: number;
    points?: number;
    message?: string;
    location?: {
      latitude: number;
      longitude: number;
    };
  };
}

// Notification related types
export interface UserNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  timestamp: Date | number;
  read: boolean;
  type: "system" | "promotion" | "reward" | "activity";
  linkTo?: string;
  imageUrl?: string;
}

// Cafe related types
export interface Cafe {
  id: string;
  name: string;
  description?: string;
  address: string;
  location: {
    latitude: number;
    longitude: number;
  };
  photos: string[];
  openingHours: OpeningHours;
  contactInfo: {
    phone?: string;
    email?: string;
    website?: string;
    socialMedia?: {
      facebook?: string;
      instagram?: string;
      twitter?: string;
    };
  };
  rating: number;
  reviewCount: number;
  ownerId: string;
  products: string[];
  amenities: string[];
  tags: string[];
  createdAt: Date | number;
  updatedAt: Date | number;
}

export interface OpeningHours {
  monday: DayHours;
  tuesday: DayHours;
  wednesday: DayHours;
  thursday: DayHours;
  friday: DayHours;
  saturday: DayHours;
  sunday: DayHours;
}

export interface DayHours {
  open: boolean;
  openTime?: string;
  closeTime?: string;
}

// Product related types
export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  categoryId: string;
  cafeId: string;
  image?: string;
  available: boolean;
  featured: boolean;
  ingredients?: string[];
  allergens?: string[];
  nutritionInfo?: {
    calories?: number;
    sugar?: number;
    fat?: number;
    protein?: number;
  };
  createdAt: Date | number;
  updatedAt: Date | number;
}

// QR Code related types
export interface QRCodeData {
  userId: string;
  cafeId: string;
  timestamp: string;
  productId?: string;
  totp?: string;
}

// Partner request related types
export interface PartnershipRequest {
  id: string;
  businessName: string;
  contactName: string;
  email: string;
  phone?: string;
  address?: string;
  message?: string;
  status: "pending" | "approved" | "rejected";
  createdAt: Date | number;
  updatedAt?: Date | number;
  reviewedBy?: string;
  reviewNotes?: string;
}

// App setting types
export interface AppSettings {
  maintenance: {
    enabled: boolean;
    message: string;
  };
  versions: {
    ios: string;
    android: string;
    forceUpdate: boolean;
  };
  features: {
    googleAuth: boolean;
    appleAuth: boolean;
    referralProgram: boolean;
  };
  subscriptionPlans: SubscriptionPlan[];
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number; // in days
  features: string[];
  type: "basic" | "premium" | "gold";
  isPopular: boolean;
  isHidden: boolean;
}

// Report types
export interface Report {
  id: string;
  cafeId: string;
  period: "daily" | "weekly" | "monthly" | "yearly";
  startDate: Date | number;
  endDate: Date | number;
  data: {
    redeemed: number;
    newCustomers: number;
    revenue?: number;
    topProducts?: {
      productId: string;
      productName: string;
      count: number;
    }[];
    peakHours?: {
      hour: number;
      count: number;
    }[];
  };
  createdAt: Date | number;
}
