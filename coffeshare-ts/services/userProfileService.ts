import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  addDoc,
  serverTimestamp,
  getDocs,
  increment,
  Timestamp,
  DocumentReference,
  writeBatch,
} from "firebase/firestore";
import { getAuth, updateProfile } from "firebase/auth";
import { Platform } from "react-native";
import { v4 as uuidv4 } from "uuid";
import Constants from "expo-constants";
import { getDeviceInfo } from "../utils/expoGoUtils";
import { app } from "../config/firebase";

import {
  UserProfile,
  ActivityLog,
  ActivityType,
  SubscriptionData,
  UserStats,
  QRCodeData,
  UserNotification,
} from "../types";

// Initialize Firestore and Auth using the imported app
const db = getFirestore(app);
const auth = getAuth(app);

/**
 * User Profile Service
 * Handles all operations related to user profiles, activities, and subscriptions
 */
class UserProfileService {
  /**
   * Get current user profile
   */
  async getCurrentUserProfile(): Promise<UserProfile | null> {
    const user = auth.currentUser;
    if (!user) return null;

    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        return userDoc.data() as UserProfile;
      }
      return null;
    } catch (error) {
      console.error("Error fetching user profile:", error);
      throw error;
    }
  }

  /**
   * Get user profile by ID
   */
  async getUserProfileById(userId: string): Promise<UserProfile | null> {
    try {
      const userDoc = await getDoc(doc(db, "users", userId));
      if (userDoc.exists()) {
        return userDoc.data() as UserProfile;
      }
      return null;
    } catch (error) {
      console.error(`Error fetching user profile for ID ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Create a new user profile
   */
  async createUserProfile(data: Partial<UserProfile>): Promise<UserProfile> {
    const user = auth.currentUser;
    if (!user) throw new Error("No authenticated user found");

    const now = serverTimestamp();
    const userRef = doc(db, "users", user.uid);

    // Create basic profile structure
    const newProfile: UserProfile = {
      uid: user.uid,
      email: user.email || "",
      displayName: user.displayName || data.displayName || "",
      // Only include photoURL and phoneNumber if they have values
      ...(user.photoURL ? { photoURL: user.photoURL } : {}),
      ...(data.photoURL ? { photoURL: data.photoURL } : {}),
      ...(user.phoneNumber ? { phoneNumber: user.phoneNumber } : {}),
      ...(data.phoneNumber ? { phoneNumber: data.phoneNumber } : {}),
      createdAt: now,
      updatedAt: now,
      role: data.role || "user",
      preferences: {
        favoriteProducts: [],
        favoriteCafes: [],
        darkMode: false,
        notificationsEnabled: true,
        allowLocationServices: true,
        ...data.preferences,
      },
      stats: {
        totalCoffees: 0,
        weeklyCount: 0,
        monthlyCount: 0,
        streak: 0,
        lastVisit: null,
        ...data.stats,
      },
      subscription: {
        type: "None",
        startDate: null,
        expiryDate: null,
        isActive: false,
        dailyLimit: 0,
        remainingToday: 0,
        lastReset: null,
        paymentInfo: {
          paymentMethod: "",
          autoRenew: false,
          ...data.subscription?.paymentInfo,
        },
        ...data.subscription,
      },
    };

    try {
      // Create the user document
      await setDoc(userRef, newProfile);

      // Log the registration activity
      await this.logActivity({
        type: ActivityType.REGISTRATION,
        status: "completed",
      });

      return newProfile;
    } catch (error) {
      console.error("Error creating user profile:", error);
      throw error;
    }
  }

  /**
   * Update user profile
   */
  async updateUserProfile(data: Partial<UserProfile>): Promise<UserProfile> {
    const user = auth.currentUser;
    if (!user) throw new Error("No authenticated user found");

    try {
      const userRef = doc(db, "users", user.uid);

      // Update the profile
      await updateDoc(userRef, {
        ...data,
        updatedAt: serverTimestamp(),
      });

      // If displayName is being updated, also update the Auth profile
      if (data.displayName) {
        await updateProfile(user, {
          displayName: data.displayName,
        });
      }

      // If photoURL is being updated, also update the Auth profile
      if (data.photoURL) {
        await updateProfile(user, {
          photoURL: data.photoURL,
        });
      }

      // Log the profile update
      await this.logActivity({
        type: ActivityType.PROFILE_UPDATE,
        status: "completed",
      });

      // Return the updated profile
      const updatedProfile = await this.getCurrentUserProfile();
      return updatedProfile as UserProfile;
    } catch (error) {
      console.error("Error updating user profile:", error);
      throw error;
    }
  }

  /**
   * Update user subscription
   */
  async updateSubscription(
    subscriptionData: Partial<SubscriptionData>
  ): Promise<UserProfile> {
    const user = auth.currentUser;
    if (!user) throw new Error("No authenticated user found");

    try {
      const userRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        throw new Error("User profile not found");
      }

      const userData = userDoc.data() as UserProfile;
      const currentSubscription = userData.subscription || {
        type: "None",
        startDate: null,
        expiryDate: null,
        isActive: false,
        dailyLimit: 0,
        remainingToday: 0,
        lastReset: null,
        paymentInfo: {
          paymentMethod: "",
          autoRenew: false,
        },
      };

      // Determine if this is a new subscription or an update
      const isNewSubscription =
        currentSubscription.type === "None" ||
        (subscriptionData.type &&
          subscriptionData.type !== currentSubscription.type);

      // Update the subscription
      const updatedSubscription = {
        ...currentSubscription,
        ...subscriptionData,
        updatedAt: serverTimestamp(),
      };

      // Set the daily limit based on subscription type
      if (subscriptionData.type) {
        switch (subscriptionData.type) {
          case "Student Pack":
            updatedSubscription.dailyLimit = 2;
            break;
          case "Elite":
            updatedSubscription.dailyLimit = 3;
            break;
          case "Premium":
            updatedSubscription.dailyLimit = 999; // Unlimited
            break;
          default:
            updatedSubscription.dailyLimit = 0;
        }

        // Reset the remaining count if it's a new subscription
        if (
          isNewSubscription ||
          subscriptionData.remainingToday === undefined
        ) {
          updatedSubscription.remainingToday = updatedSubscription.dailyLimit;
          updatedSubscription.lastReset = serverTimestamp();
        }
      }

      // Update the database
      await updateDoc(userRef, {
        subscription: updatedSubscription,
        updatedAt: serverTimestamp(),
      });

      // Log the subscription update
      let activityType = ActivityType.SUBSCRIPTION_CHANGE;
      if (isNewSubscription) {
        activityType = ActivityType.SUBSCRIPTION_PURCHASE;
      } else if (subscriptionData.expiryDate) {
        activityType = ActivityType.SUBSCRIPTION_RENEWAL;
      }

      await this.logActivity({
        type: activityType,
        status: "completed",
        subscriptionType: updatedSubscription.type,
        amount: updatedSubscription.price,
        currency: updatedSubscription.currency,
      });

      // Return the updated profile
      const updatedProfile = await this.getCurrentUserProfile();
      return updatedProfile as UserProfile;
    } catch (error) {
      console.error("Error updating subscription:", error);
      throw error;
    }
  }

  /**
   * Reset daily coffee count
   * This should be called at the start of a new day
   */
  async resetDailyCoffeeCount(): Promise<void> {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const userRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) return;

      const userData = userDoc.data() as UserProfile;
      if (!userData.subscription || !userData.subscription.isActive) return;

      const lastReset = userData.subscription.lastReset;
      const now = new Date();

      // If lastReset is null or it's a new day, reset the count
      if (!lastReset || isNewDay(lastReset.toDate(), now)) {
        await updateDoc(userRef, {
          "subscription.remainingToday": userData.subscription.dailyLimit,
          "subscription.lastReset": serverTimestamp(),
        });
      }
    } catch (error) {
      console.error("Error resetting daily coffee count:", error);
    }
  }

  /**
   * Check if user can redeem a coffee
   */
  async canRedeemCoffee(): Promise<{ canRedeem: boolean; reason?: string }> {
    const user = auth.currentUser;
    if (!user) return { canRedeem: false, reason: "Not logged in" };

    try {
      const userProfile = await this.getCurrentUserProfile();

      if (!userProfile) {
        return { canRedeem: false, reason: "Profile not found" };
      }

      const subscription = userProfile.subscription;

      if (!subscription) {
        return { canRedeem: false, reason: "No subscription found" };
      }

      if (!subscription.isActive) {
        return { canRedeem: false, reason: "Subscription not active" };
      }

      const now = new Date();
      const expiry = subscription.expiryDate?.toDate();

      if (expiry && now > expiry) {
        return { canRedeem: false, reason: "Subscription expired" };
      }

      // Auto-reset daily count if needed
      const lastReset = subscription.lastReset?.toDate();
      if (!lastReset || isNewDay(lastReset, now)) {
        await this.resetDailyCoffeeCount();
        return { canRedeem: true };
      }

      if (subscription.remainingToday <= 0) {
        return { canRedeem: false, reason: "Daily limit reached" };
      }

      return { canRedeem: true };
    } catch (error) {
      console.error("Error checking redemption eligibility:", error);
      return { canRedeem: false, reason: "Error checking eligibility" };
    }
  }

  /**
   * Generate a QR code for coffee redemption
   */
  async generateQRCode(
    cafeId: string,
    productId?: string
  ): Promise<QRCodeData> {
    const user = auth.currentUser;
    if (!user) throw new Error("No authenticated user found");

    const canRedeem = await this.canRedeemCoffee();
    if (!canRedeem.canRedeem) {
      throw new Error(canRedeem.reason || "Cannot redeem coffee");
    }

    try {
      const userProfile = await this.getCurrentUserProfile();
      if (!userProfile || !userProfile.subscription) {
        throw new Error("User profile or subscription not found");
      }

      // Create QR code data
      const qrData: QRCodeData = {
        userId: user.uid,
        cafeId: cafeId,
        productId: productId,
        timestamp: serverTimestamp(),
        validUntil: new Date(new Date().getTime() + 5 * 60000), // Valid for 5 minutes
        subscriptionType: userProfile.subscription.type,
        isUsed: false,
        uniqueCode: uuidv4(),
      };

      // Save QR code to database
      const qrRef = await addDoc(collection(db, "qrCodes"), qrData);

      return {
        ...qrData,
        id: qrRef.id,
      } as QRCodeData;
    } catch (error) {
      console.error("Error generating QR code:", error);
      throw error;
    }
  }

  /**
   * Redeem a coffee (decrease daily count, update stats)
   * This is called after a QR code is scanned by a coffee shop
   */
  async redeemCoffee(
    cafeId: string,
    cafeName: string,
    productId?: string,
    productName?: string
  ): Promise<void> {
    const user = auth.currentUser;
    if (!user) throw new Error("No authenticated user found");

    try {
      const batch = writeBatch(db);
      const userRef = doc(db, "users", user.uid);

      const userDoc = await getDoc(userRef);
      if (!userDoc.exists()) {
        throw new Error("User profile not found");
      }

      const userData = userDoc.data() as UserProfile;
      if (!userData.subscription || !userData.subscription.isActive) {
        throw new Error("No active subscription");
      }

      // Update subscription (decrease remaining count)
      batch.update(userRef, {
        "subscription.remainingToday": increment(-1),
        updatedAt: serverTimestamp(),
      });

      // Update user stats
      batch.update(userRef, {
        "stats.totalCoffees": increment(1),
        "stats.weeklyCount": increment(1),
        "stats.monthlyCount": increment(1),
        "stats.lastVisit": serverTimestamp(),
      });

      // Update cafe visit count if it's already the favorite
      if (userData.stats?.favoriteCafe?.id === cafeId) {
        batch.update(userRef, {
          "stats.favoriteCafe.visitCount": increment(1),
        });
      }
      // Check if this cafe should become the new favorite
      else if (userData.stats?.favoriteCafe) {
        const currentFavVisits = userData.stats.favoriteCafe.visitCount;

        // Find this cafe's visits in user's history
        const cafeLogs = await getDocs(
          query(
            collection(db, "activityLogs"),
            where("userId", "==", user.uid),
            where("cafeId", "==", cafeId),
            where("type", "==", ActivityType.COFFEE_REDEMPTION)
          )
        );

        const cafeVisits = cafeLogs.docs.length + 1; // Including this visit

        // If this cafe has more visits, make it the new favorite
        if (cafeVisits > (currentFavVisits || 0)) {
          batch.update(userRef, {
            "stats.favoriteCafe": {
              id: cafeId,
              name: cafeName,
              visitCount: cafeVisits,
            },
          });
        }
      }
      // If no favorite exists yet, set this as favorite
      else {
        batch.update(userRef, {
          "stats.favoriteCafe": {
            id: cafeId,
            name: cafeName,
            visitCount: 1,
          },
        });
      }

      // Update product stats similarly if product is specified
      if (productId && productName) {
        // Similar logic to cafe favorite, but for products
        // Implement as needed
      }

      // Calculate streak
      const lastVisitDate = userData.stats?.lastVisit?.toDate();
      const now = new Date();

      if (lastVisitDate) {
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);

        if (isSameDay(lastVisitDate, yesterday)) {
          // Consecutive day, increase streak
          batch.update(userRef, {
            "stats.streak": increment(1),
          });
        } else if (!isSameDay(lastVisitDate, now)) {
          // Not consecutive and not today, reset streak to 1
          batch.update(userRef, {
            "stats.streak": 1,
          });
        }
        // If same day, streak stays the same
      } else {
        // First visit, set streak to 1
        batch.update(userRef, {
          "stats.streak": 1,
        });
      }

      // Commit all updates
      await batch.commit();

      // Log the activity
      await this.logActivity({
        type: ActivityType.COFFEE_REDEMPTION,
        status: "completed",
        cafeId,
        cafeName,
        productId,
        productName,
      });

      // Create a notification
      await this.createNotification({
        title: "Coffee Redeemed!",
        message: `You just enjoyed a coffee at ${cafeName}. ${
          userData.subscription.remainingToday - 1 > 0
            ? `You have ${
                userData.subscription.remainingToday - 1
              } coffees left today.`
            : "You have reached your daily limit."
        }`,
        type: "activity",
      });
    } catch (error) {
      console.error("Error redeeming coffee:", error);
      throw error;
    }
  }

  /**
   * Log user activity
   */
  async logActivity(data: Partial<ActivityLog>): Promise<string> {
    const user = auth.currentUser;
    if (!user) throw new Error("No authenticated user found");

    try {
      // Get device info
      const DeviceInfo = getDeviceInfo();
      const deviceInfo = {
        platform: Platform.OS,
        deviceModel: await DeviceInfo.getModel(),
        appVersion: Constants.expoConfig?.version || "1.0.0",
      };

      // Create activity log
      const activityData: Omit<ActivityLog, "id"> = {
        userId: user.uid,
        timestamp: serverTimestamp(),
        type: data.type || ActivityType.LOGIN,
        status: data.status || "completed",
        deviceInfo,
        ...data,
      };

      // Add to activityLogs collection
      const activityRef = await addDoc(
        collection(db, "activityLogs"),
        activityData
      );

      return activityRef.id;
    } catch (error) {
      console.error("Error logging activity:", error);
      throw error;
    }
  }

  /**
   * Get user activity logs
   */
  async getActivityLogs(
    limit = 10,
    type?: ActivityType
  ): Promise<ActivityLog[]> {
    const user = auth.currentUser;
    if (!user) throw new Error("No authenticated user found");

    try {
      let q = query(
        collection(db, "activityLogs"),
        where("userId", "==", user.uid),
        orderBy("timestamp", "desc"),
        firestoreLimit(limit)
      );

      // If type is specified, we'll filter the results in memory
      // This avoids the need for a composite index
      const querySnapshot = await getDocs(q);
      const logs: ActivityLog[] = [];

      querySnapshot.forEach((doc) => {
        const log = {
          id: doc.id,
          ...doc.data(),
        } as ActivityLog;

        // If type is specified, only include matching logs
        if (!type || log.type === type) {
          logs.push(log);
        }
      });

      // If we filtered by type, we might have fewer results than the limit
      // So we'll take only the first 'limit' items
      return logs.slice(0, limit);
    } catch (error) {
      console.error("Error getting activity logs:", error);
      throw error;
    }
  }

  /**
   * Create user notification
   */
  async createNotification(data: Partial<UserNotification>): Promise<string> {
    const user = auth.currentUser;
    if (!user) throw new Error("No authenticated user found");

    try {
      const notificationData: Omit<UserNotification, "id"> = {
        userId: user.uid,
        title: data.title || "",
        message: data.message || "",
        type: data.type || "system",
        timestamp: serverTimestamp(),
        isRead: false,
        ...data,
      };

      const notificationRef = await addDoc(
        collection(db, "notifications"),
        notificationData
      );

      return notificationRef.id;
    } catch (error) {
      console.error("Error creating notification:", error);
      throw error;
    }
  }

  /**
   * Get user notifications
   */
  async getUserNotifications(limit = 20): Promise<UserNotification[]> {
    const user = auth.currentUser;
    if (!user) throw new Error("No authenticated user found");

    try {
      const q = query(
        collection(db, "notifications"),
        where("userId", "==", user.uid),
        orderBy("timestamp", "desc"),
        firestoreLimit(limit)
      );

      const querySnapshot = await getDocs(q);

      const notifications: UserNotification[] = [];
      querySnapshot.forEach((doc) => {
        notifications.push({
          id: doc.id,
          ...doc.data(),
        } as UserNotification);
      });

      return notifications;
    } catch (error) {
      console.error("Error getting notifications:", error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      const notificationRef = doc(db, "notifications", notificationId);
      await updateDoc(notificationRef, {
        isRead: true,
      });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      throw error;
    }
  }

  /**
   * Create a basic user profile with minimal data for faster registration
   * This is used during the initial registration process
   */
  async createBasicUserProfile(
    data: Partial<UserProfile>
  ): Promise<UserProfile> {
    const user = auth.currentUser;
    if (!user) throw new Error("No authenticated user found");

    const now = serverTimestamp();
    const userRef = doc(db, "users", user.uid);

    // Create minimal profile structure
    const newProfile: UserProfile = {
      uid: user.uid,
      email: user.email || "",
      displayName: user.displayName || data.displayName || "",
      createdAt: now,
      updatedAt: now,
      role: data.role || "user",
    };

    try {
      // Create the user document with minimal data
      await setDoc(userRef, newProfile);

      // Schedule the full profile creation in the background
      setTimeout(async () => {
        try {
          // Create the full profile with all default values
          await this.createUserProfile(data);

          // Log the registration activity
          await this.logActivity({
            type: ActivityType.REGISTRATION,
            status: "completed",
          });
        } catch (error) {
          console.error("Error creating full user profile:", error);
        }
      }, 1000); // Delay by 1 second to prioritize UI responsiveness

      return newProfile;
    } catch (error) {
      console.error("Error creating basic user profile:", error);
      throw error;
    }
  }
}

/**
 * Helper function to check if it's a new day
 */
function isNewDay(date1: Date, date2: Date): boolean {
  return !isSameDay(date1, date2);
}

/**
 * Helper function to check if two dates are the same day
 */
function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

// Export a singleton instance
export const userProfileService = new UserProfileService();
export default userProfileService;
