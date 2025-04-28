import { Link } from "expo-router";
import { Firestore, Timestamp } from "firebase/firestore";
import { Icon } from "phosphor-react-native";
import React, { ReactNode } from "react";
import {
  ActivityIndicator,
  ActivityIndicatorProps,
  ImageStyle,
  PressableProps,
  TextInput,
  TextInputProps,
  TextProps,
  TextStyle,
  TouchableOpacityProps,
  ViewStyle,
} from "react-native";

export type ScreenWrapperProps = {
  style?: ViewStyle;
  children: React.ReactNode;
  bg?: any;
};
export type ModalWrapperProps = {
  style?: ViewStyle;
  children: React.ReactNode;
  bg?: string;
};
export type accountOptionType = {
  title: string;
  icon: React.ReactNode;
  bgColor: string;
  routeName?: any;
};

export type TypoProps = {
  size?: number;
  color?: string;
  fontWeight?: TextStyle["fontWeight"];
  children: any | null;
  style?: TextStyle;
  textProps?: TextProps;
};

export type IconComponent = React.ComponentType<{
  height?: number;
  width?: number;
  strokeWidth?: number;
  color?: string;
  fill?: string;
}>;

export type IconProps = {
  name: string;
  color?: string;
  size?: number;
  strokeWidth?: number;
  fill?: string;
};

export type HeaderProps = {
  title?: string;
  style?: ViewStyle;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
};

export type BackButtonProps = {
  style?: ViewStyle;
  iconSize?: number;
};

export type TransactionType = {
  id?: string;
  type: string;
  amount: number;
  category?: string;
  date: Date | Timestamp | string;
  description?: string;
  image?: any;
  uid?: string;
  walletId: string;
};

export type CategoryType = {
  label: string;
  value: string;
  icon: Icon;
  bgColor: string;
};
export type ExpenseCategoriesType = {
  [key: string]: CategoryType;
};

export type TransactionListType = {
  data: TransactionType[];
  title?: string;
  loading?: boolean;
  emptyListMessage?: string;
};

export type TransactionItemProps = {
  item: TransactionType;
  index: number;
  handleClick: Function;
};

export interface InputProps extends TextInputProps {
  icon?: React.ReactNode;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  inputRef?: React.RefObject<TextInput>;
  //   label?: string;
  //   error?: string;
}

export interface CustomButtonProps extends TouchableOpacityProps {
  style?: ViewStyle;
  onPress?: () => void;
  loading?: boolean;
  children: React.ReactNode;
}

export type ImageUploadProps = {
  file?: any;
  onSelect: (file: any) => void;
  onClear: () => void;
  containerStyle?: ViewStyle;
  imageStyle?: ViewStyle;
  placeholder?: string;
};

export type UserType = {
  uid?: string;
  email?: string | null;
  name: string | null;
  image?: any;
} | null;

export type UserDataType = {
  name: string;
  image?: any;
};

export type AuthContextType = {
  user: UserType;
  setUser: Function;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; msg?: string }>;
  register: (
    email: string,
    password: string,
    name: string
  ) => Promise<{ success: boolean; msg?: string }>;
  updateUserData: (userId: string) => Promise<void>;
};

export type ResponseType = {
  success: boolean;
  data?: any;
  msg?: string;
};

export type WalletType = {
  id?: string;
  name: string;
  amount?: number;
  totalIncome?: number;
  totalExpenses?: number;
  image: any;
  uid?: string;
  created?: Date;
};

// User Profile Types
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  phoneNumber?: string;
  createdAt: any;
  updatedAt: any;

  // User preferences
  preferences?: {
    favoriteProducts: string[];
    favoriteCafes: string[];
    preferredPaymentMethod?: string;
    darkMode?: boolean;
    notificationsEnabled?: boolean;
    allowLocationServices?: boolean;
  };

  // User role - determines access level
  role: "user" | "partner" | "admin";

  // Subscription related data
  subscription?: SubscriptionData;

  // User stats
  stats?: UserStats;
}

// Subscription data
export interface SubscriptionData {
  type: "Student Pack" | "Elite" | "Premium" | "None";
  startDate: any;
  expiryDate: any;
  isActive: boolean;
  dailyLimit: number;
  remainingToday: number;
  lastReset: any; // Timestamp of last daily reset
  paymentInfo?: {
    paymentMethod: string;
    lastFour?: string;
    billingAddress?: Address;
    autoRenew: boolean;
  };
  price?: number;
  currency?: string;
}

// User statistics
export interface UserStats {
  totalCoffees: number;
  weeklyCount: number;
  monthlyCount: number;
  streak: number; // consecutive days
  lastVisit: any;
  favoriteCafe?: {
    id: string;
    name: string;
    visitCount: number;
  };
  favoriteProduct?: {
    id: string;
    name: string;
    orderCount: number;
  };
}

// Address type
export interface Address {
  street: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
}

// Activity log entry
export interface ActivityLog {
  id: string;
  userId: string;
  timestamp: any;
  type: ActivityType;
  cafeId?: string;
  cafeName?: string;
  productId?: string;
  productName?: string;
  subscriptionType?: string;
  amount?: number;
  currency?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  deviceInfo?: {
    platform: string;
    deviceModel?: string;
    appVersion: string;
  };
  status: "completed" | "cancelled" | "failed";
  notes?: string;
}

// Types of activities to track
export enum ActivityType {
  LOGIN = "login",
  LOGOUT = "logout",
  REGISTRATION = "registration",
  SUBSCRIPTION_PURCHASE = "subscription_purchase",
  SUBSCRIPTION_RENEWAL = "subscription_renewal",
  SUBSCRIPTION_CANCEL = "subscription_cancel",
  SUBSCRIPTION_CHANGE = "subscription_change",
  COFFEE_REDEMPTION = "coffee_redemption",
  PROFILE_UPDATE = "profile_update",
  PASSWORD_RESET = "password_reset",
  CAFE_FAVORITE = "cafe_favorite",
  CAFE_UNFAVORITE = "cafe_unfavorite",
  REVIEW_SUBMIT = "review_submit",
  PAYMENT_METHOD_UPDATE = "payment_method_update",
  REFERRAL_SENT = "referral_sent",
  REFERRAL_COMPLETED = "referral_completed",
}

// Coffee Shop/Partner Profile
export interface CafeProfile {
  id: string;
  name: string;
  description: string;
  address: Address;
  location: {
    latitude: number;
    longitude: number;
  };
  contactInfo: {
    email: string;
    phone: string;
    website?: string;
  };
  businessHours: {
    [key: string]: {
      // 'monday', 'tuesday', etc.
      open: string; // '08:00'
      close: string; // '18:00'
      isClosed: boolean;
    };
  };
  photos: string[];
  logoUrl: string;
  rating: number;
  acceptedSubscriptions: ("Student Pack" | "Elite" | "Premium")[];
  products: CafeProduct[];
  amenities: string[]; // ['WiFi', 'Outdoor Seating', etc.]
  createdAt: any;
  updatedAt: any;
}

// Coffee Products
export interface CafeProduct {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  currency: string;
  imageUrl?: string;
  availableForSubscriptions: {
    "Student Pack": boolean;
    Elite: boolean;
    Premium: boolean;
  };
  isAvailable: boolean;
  nutritionalInfo?: {
    calories?: number;
    caffeine?: number;
    dairy?: boolean;
    vegan?: boolean;
    glutenFree?: boolean;
  };
}

// QR Code Data
export interface QRCodeData {
  userId: string;
  cafeId: string;
  timestamp: any;
  validUntil: any; // Time when QR code expires (usually a few minutes after generation)
  productId?: string;
  subscriptionType: string;
  isUsed: boolean;
  redemptionTimestamp?: any;
  uniqueCode: string; // Unique identifier for this QR code
}

// Reviews
export interface CafeReview {
  id: string;
  userId: string;
  userDisplayName: string;
  cafeId: string;
  rating: number; // 1-5
  comment?: string;
  timestamp: any;
  productId?: string;
  serviceRating?: number;
  atmosphereRating?: number;
  valueRating?: number;
  photos?: string[];
  likes: number;
  replies?: {
    userId: string;
    userDisplayName: string;
    isOwner: boolean;
    comment: string;
    timestamp: any;
  }[];
}

// Notification
export interface UserNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: "subscription" | "promo" | "system" | "activity" | "social";
  timestamp: any;
  isRead: boolean;
  actionUrl?: string; // Deep link to relevant screen
  imageUrl?: string;
  expiresAt?: any;
}
