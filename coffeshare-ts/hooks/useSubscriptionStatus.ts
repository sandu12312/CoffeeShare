import { useState, useEffect } from "react";
import {
  SubscriptionService,
  UserSubscription,
} from "../services/subscriptionService";

export interface SubscriptionStatus {
  subscription: UserSubscription | null;
  isActive: boolean;
  beansLeft: number;
  beansTotal: number;
  subscriptionName: string;
  expiresAt: Date | null;
  loading: boolean;
  error: string | null;
}

export const useSubscriptionStatus = (
  userId: string | undefined
): SubscriptionStatus => {
  const [subscription, setSubscription] = useState<UserSubscription | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      setSubscription(null);
      return;
    }

    setLoading(true);
    setError(null);

    // Subscribe to real-time subscription updates
    const unsubscribe = SubscriptionService.subscribeToUserSubscription(
      userId,
      (sub) => {
        setSubscription(sub);
        setLoading(false);
        setError(null);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [userId]);

  // Calculate derived values
  const isActive =
    subscription?.status === "active" && (subscription?.creditsLeft ?? 0) > 0;
  const beansLeft = subscription?.creditsLeft ?? 0;
  const beansTotal = subscription?.creditsTotal ?? 0;
  const subscriptionName = subscription?.subscriptionName ?? "No Subscription";

  // Calculate expiry date (assuming 30 days from activation)
  const expiresAt = subscription?.activatedAt
    ? (() => {
        const activatedDate = subscription.activatedAt.toDate
          ? subscription.activatedAt.toDate()
          : new Date(subscription.activatedAt);
        const expiry = new Date(activatedDate);
        expiry.setDate(expiry.getDate() + 30);
        return expiry;
      })()
    : null;

  return {
    subscription,
    isActive,
    beansLeft,
    beansTotal,
    subscriptionName,
    expiresAt,
    loading,
    error,
  };
};
