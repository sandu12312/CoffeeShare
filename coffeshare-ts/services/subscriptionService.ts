import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  addDoc,
  onSnapshot,
  Unsubscribe,
} from "firebase/firestore";
import { db } from "../config/firebase";

export interface SubscriptionPlan {
  id?: string;
  name: string;
  credits: number; // Number of beans/credits
  price: number; // Price in RON
  description?: string;
  createdAt?: any;
  updatedAt?: any;
  isActive?: boolean;
  popular?: boolean;
  tag?: string; // e.g., "Most Popular", "Best Value"
}

export interface UserSubscription {
  id?: string;
  userId: string;
  subscriptionId: string; // Reference to SubscriptionPlan
  subscriptionName: string; // Denormalized for easy display
  creditsTotal: number; // Initial credits
  creditsLeft: number; // Remaining credits
  price: number; // Price paid
  activatedAt: any;
  expiresAt?: any; // For future use with expiration dates
  status: "active" | "expired" | "cancelled";
  lastUpdated?: any;
}

export class SubscriptionService {
  // === ADMIN FUNCTIONS ===

  // Create a new subscription plan
  static async createSubscriptionPlan(
    plan: Omit<SubscriptionPlan, "id">
  ): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, "subscriptionPlans"), {
        ...plan,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isActive: true,
      });

      console.log("Subscription plan created with ID:", docRef.id);
      return docRef.id;
    } catch (error) {
      console.error("Error creating subscription plan:", error);
      throw error;
    }
  }

  // Update an existing subscription plan
  static async updateSubscriptionPlan(
    planId: string,
    updates: Partial<SubscriptionPlan>
  ): Promise<void> {
    try {
      const planRef = doc(db, "subscriptionPlans", planId);
      await updateDoc(planRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });

      console.log("Subscription plan updated:", planId);
    } catch (error) {
      console.error("Error updating subscription plan:", error);
      throw error;
    }
  }

  // Delete a subscription plan (soft delete by setting isActive to false)
  static async deleteSubscriptionPlan(planId: string): Promise<void> {
    try {
      const planRef = doc(db, "subscriptionPlans", planId);
      await updateDoc(planRef, {
        isActive: false,
        updatedAt: serverTimestamp(),
      });

      console.log("Subscription plan deactivated:", planId);
    } catch (error) {
      console.error("Error deleting subscription plan:", error);
      throw error;
    }
  }

  // Get all subscription plans (admin view)
  static async getAllSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    try {
      const q = query(collection(db, "subscriptionPlans"));

      const querySnapshot = await getDocs(q);
      const plans: SubscriptionPlan[] = [];

      querySnapshot.forEach((doc) => {
        plans.push({
          id: doc.id,
          ...doc.data(),
        } as SubscriptionPlan);
      });

      // Sort by createdAt in memory (newest first)
      plans.sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() || a.createdAt?.seconds || 0;
        const bTime = b.createdAt?.toMillis?.() || b.createdAt?.seconds || 0;
        return bTime - aTime;
      });

      return plans;
    } catch (error) {
      console.error("Error fetching all subscription plans:", error);
      throw error;
    }
  }

  // === USER FUNCTIONS ===

  // Get active subscription plans for users
  static async getActiveSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    try {
      const q = query(
        collection(db, "subscriptionPlans"),
        where("isActive", "==", true)
      );

      const querySnapshot = await getDocs(q);
      const plans: SubscriptionPlan[] = [];

      querySnapshot.forEach((doc) => {
        plans.push({
          id: doc.id,
          ...doc.data(),
        } as SubscriptionPlan);
      });

      // Sort in memory instead of in the query
      plans.sort((a, b) => (a.price || 0) - (b.price || 0));

      return plans;
    } catch (error) {
      console.error("Error fetching active subscription plans:", error);
      throw error;
    }
  }

  // Subscribe to active plans (real-time updates)
  static subscribeToActivePlans(
    callback: (plans: SubscriptionPlan[]) => void
  ): Unsubscribe {
    const q = query(
      collection(db, "subscriptionPlans"),
      where("isActive", "==", true)
    );

    return onSnapshot(q, (snapshot) => {
      const plans: SubscriptionPlan[] = [];
      snapshot.forEach((doc) => {
        plans.push({
          id: doc.id,
          ...doc.data(),
        } as SubscriptionPlan);
      });

      // Sort in memory instead of in the query
      plans.sort((a, b) => (a.price || 0) - (b.price || 0));

      callback(plans);
    });
  }

  // Create a user subscription
  static async createUserSubscription(
    userId: string,
    planId: string
  ): Promise<string> {
    try {
      // First, get the plan details
      const planDoc = await getDoc(doc(db, "subscriptionPlans", planId));
      if (!planDoc.exists()) {
        throw new Error("Subscription plan not found");
      }

      const planData = planDoc.data() as SubscriptionPlan;

      // Check if user already has an active subscription
      const existingSubscription = await this.getUserActiveSubscription(userId);
      if (existingSubscription) {
        // Cancel the existing subscription
        await this.cancelUserSubscription(existingSubscription.id!);
      }

      // Create new subscription
      const subscriptionData: Omit<UserSubscription, "id"> = {
        userId,
        subscriptionId: planId,
        subscriptionName: planData.name,
        creditsTotal: planData.credits,
        creditsLeft: planData.credits,
        price: planData.price,
        activatedAt: serverTimestamp(),
        status: "active",
        lastUpdated: serverTimestamp(),
      };

      const docRef = await addDoc(
        collection(db, "userSubscriptions"),
        subscriptionData
      );

      console.log("User subscription created:", docRef.id);
      return docRef.id;
    } catch (error) {
      console.error("Error creating user subscription:", error);
      throw error;
    }
  }

  // Get user's active subscription
  static async getUserActiveSubscription(
    userId: string
  ): Promise<UserSubscription | null> {
    try {
      const q = query(
        collection(db, "userSubscriptions"),
        where("userId", "==", userId),
        where("status", "==", "active")
      );

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return null;
      }

      const doc = querySnapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data(),
      } as UserSubscription;
    } catch (error) {
      console.error("Error fetching user subscription:", error);
      throw error;
    }
  }

  // Subscribe to user's active subscription (real-time)
  static subscribeToUserSubscription(
    userId: string,
    callback: (subscription: UserSubscription | null) => void
  ): Unsubscribe {
    const q = query(
      collection(db, "userSubscriptions"),
      where("userId", "==", userId),
      where("status", "==", "active")
    );

    return onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        callback(null);
      } else {
        const doc = snapshot.docs[0];
        callback({
          id: doc.id,
          ...doc.data(),
        } as UserSubscription);
      }
    });
  }

  // Use credits from user subscription
  static async useCredits(
    subscriptionId: string,
    creditsToUse: number
  ): Promise<void> {
    try {
      const subRef = doc(db, "userSubscriptions", subscriptionId);
      const subDoc = await getDoc(subRef);

      if (!subDoc.exists()) {
        throw new Error("Subscription not found");
      }

      const currentData = subDoc.data() as UserSubscription;

      if (currentData.creditsLeft < creditsToUse) {
        throw new Error("Insufficient credits");
      }

      await updateDoc(subRef, {
        creditsLeft: currentData.creditsLeft - creditsToUse,
        lastUpdated: serverTimestamp(),
      });

      console.log(
        `Used ${creditsToUse} credits from subscription ${subscriptionId}`
      );
    } catch (error) {
      console.error("Error using credits:", error);
      throw error;
    }
  }

  // Cancel user subscription
  static async cancelUserSubscription(subscriptionId: string): Promise<void> {
    try {
      const subRef = doc(db, "userSubscriptions", subscriptionId);
      await updateDoc(subRef, {
        status: "cancelled",
        lastUpdated: serverTimestamp(),
      });

      console.log("User subscription cancelled:", subscriptionId);
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      throw error;
    }
  }

  // Get user's subscription history
  static async getUserSubscriptionHistory(
    userId: string
  ): Promise<UserSubscription[]> {
    try {
      const q = query(
        collection(db, "userSubscriptions"),
        where("userId", "==", userId)
      );

      const querySnapshot = await getDocs(q);
      const subscriptions: UserSubscription[] = [];

      querySnapshot.forEach((doc) => {
        subscriptions.push({
          id: doc.id,
          ...doc.data(),
        } as UserSubscription);
      });

      // Sort by activatedAt in memory (newest first)
      subscriptions.sort((a, b) => {
        const aTime =
          a.activatedAt?.toMillis?.() || a.activatedAt?.seconds || 0;
        const bTime =
          b.activatedAt?.toMillis?.() || b.activatedAt?.seconds || 0;
        return bTime - aTime;
      });

      return subscriptions;
    } catch (error) {
      console.error("Error fetching subscription history:", error);
      throw error;
    }
  }

  // Update user credits directly
  static async updateUserCredits(
    userId: string,
    newCreditsAmount: number
  ): Promise<boolean> {
    try {
      const activeSubscription = await this.getUserActiveSubscription(userId);

      if (!activeSubscription) {
        console.error("No active subscription found for user:", userId);
        return false;
      }

      const subRef = doc(db, "userSubscriptions", activeSubscription.id!);
      await updateDoc(subRef, {
        creditsLeft: newCreditsAmount,
        lastUpdated: serverTimestamp(),
      });

      console.log(`Updated user ${userId} credits to ${newCreditsAmount}`);
      return true;
    } catch (error) {
      console.error("Error updating user credits:", error);
      return false;
    }
  }

  // Log user activity
  static async logUserActivity(
    userId: string,
    activityType: string,
    activityData: any
  ): Promise<void> {
    try {
      await addDoc(collection(db, "userActivities"), {
        userId,
        type: activityType,
        data: activityData,
        timestamp: serverTimestamp(),
      });

      console.log(`Logged activity for user ${userId}: ${activityType}`);
    } catch (error) {
      console.error("Error logging user activity:", error);
      // Don't throw error for logging failures
    }
  }
}
