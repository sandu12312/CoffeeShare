import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  doc,
  getDoc,
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  where,
  Timestamp,
} from "firebase/firestore";
import { db } from "../config/firebase";

export interface NotificationItem {
  id: string;
  type:
    | "subscription_expiry"
    | "daily_update"
    | "general"
    | "achievement"
    | "coffee_tip"
    | "special_offer"
    | "milestone"
    | "recommendation"
    | "welcome";
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  priority: "low" | "medium" | "high";
  expiryDate?: Date;
  subscriptionType?: string;
  actionUrl?: string;
  icon?: string;
}

export interface UserSubscription {
  id: string;
  name: string;
  price: number;
  beans: number;
  duration: number;
  isActive: boolean;
  createdAt: Date;
}

class NotificationService {
  private readonly STORAGE_KEY = "user_notifications";
  private readonly DAILY_UPDATE_KEY = "last_daily_update";

  /**
   * Get all notifications for a user
   */
  async getNotifications(userId: string): Promise<NotificationItem[]> {
    try {
      const stored = await AsyncStorage.getItem(
        `${this.STORAGE_KEY}_${userId}`
      );
      if (stored) {
        const notifications = JSON.parse(stored);
        return notifications.map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp),
          expiryDate: n.expiryDate ? new Date(n.expiryDate) : undefined,
        }));
      }
      return [];
    } catch (error) {
      console.error("Error getting notifications:", error);
      return [];
    }
  }

  /**
   * Save notifications to storage
   */
  private async saveNotifications(
    userId: string,
    notifications: NotificationItem[]
  ): Promise<void> {
    try {
      await AsyncStorage.setItem(
        `${this.STORAGE_KEY}_${userId}`,
        JSON.stringify(notifications)
      );
    } catch (error) {
      console.error("Error saving notifications:", error);
    }
  }

  /**
   * Add a new notification
   */
  async addNotification(
    userId: string,
    notification: Omit<NotificationItem, "id">
  ): Promise<void> {
    const notifications = await this.getNotifications(userId);
    const newNotification: NotificationItem = {
      ...notification,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    };

    notifications.unshift(newNotification);

    // Keep only last 50 notifications
    if (notifications.length > 50) {
      notifications.splice(50);
    }

    await this.saveNotifications(userId, notifications);
  }

  /**
   * Mark notification as read
   */
  async markAsRead(userId: string, notificationId: string): Promise<void> {
    const notifications = await this.getNotifications(userId);
    const notification = notifications.find((n) => n.id === notificationId);
    if (notification) {
      notification.read = true;
      await this.saveNotifications(userId, notifications);
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string): Promise<void> {
    const notifications = await this.getNotifications(userId);
    notifications.forEach((n) => (n.read = true));
    await this.saveNotifications(userId, notifications);
  }

  /**
   * Get unread notifications count
   */
  async getUnreadCount(userId: string): Promise<number> {
    const notifications = await this.getNotifications(userId);
    return notifications.filter((n) => !n.read).length;
  }

  /**
   * Check subscription expiry and create notifications
   */
  async checkSubscriptionExpiry(
    userId: string,
    userSubscription: any
  ): Promise<void> {
    if (
      !userSubscription ||
      !userSubscription.isActive ||
      !userSubscription.expiresAt
    ) {
      return;
    }

    const expiryDate = userSubscription.expiresAt.toDate
      ? userSubscription.expiresAt.toDate()
      : new Date(userSubscription.expiresAt);
    const now = new Date();
    const daysUntilExpiry = Math.ceil(
      (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Check if we already sent a notification for this subscription and timeframe
    const notifications = await this.getNotifications(userId);
    const existingWarning = notifications.find(
      (n) =>
        n.type === "subscription_expiry" &&
        n.subscriptionType === userSubscription.name &&
        n.expiryDate?.getTime() === expiryDate.getTime()
    );

    if (existingWarning) {
      return; // Already notified about this expiry
    }

    // Create notifications based on days until expiry
    if (daysUntilExpiry <= 0) {
      await this.addNotification(userId, {
        type: "subscription_expiry",
        title: "Subscription Expired",
        message: `Your ${userSubscription.name} subscription has expired. Renew now to continue enjoying your coffee benefits!`,
        timestamp: new Date(),
        read: false,
        priority: "high",
        expiryDate: expiryDate,
        subscriptionType: userSubscription.name,
      });
    } else if (daysUntilExpiry <= 3) {
      await this.addNotification(userId, {
        type: "subscription_expiry",
        title: "Subscription Expiring Soon",
        message: `Your ${
          userSubscription.name
        } subscription expires in ${daysUntilExpiry} day${
          daysUntilExpiry > 1 ? "s" : ""
        }. Don't miss out on your coffee!`,
        timestamp: new Date(),
        read: false,
        priority: "high",
        expiryDate: expiryDate,
        subscriptionType: userSubscription.name,
      });
    } else if (daysUntilExpiry <= 7) {
      await this.addNotification(userId, {
        type: "subscription_expiry",
        title: "Subscription Reminder",
        message: `Your ${userSubscription.name} subscription expires in ${daysUntilExpiry} days. Consider renewing to avoid interruption.`,
        timestamp: new Date(),
        read: false,
        priority: "medium",
        expiryDate: expiryDate,
        subscriptionType: userSubscription.name,
      });
    }
  }

  /**
   * Get latest subscription plans from Firestore
   */
  private async getLatestSubscriptions(): Promise<UserSubscription[]> {
    try {
      // Use a simpler query to avoid composite index requirement
      const subscriptionsQuery = query(
        collection(db, "subscriptions"),
        where("isActive", "==", true),
        limit(10) // Get more and filter in JavaScript
      );

      const snapshot = await getDocs(subscriptionsQuery);
      const subscriptions = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || "Unknown Plan",
          price: data.price || 0,
          beans: data.beans || 0,
          duration: data.duration || 30,
          isActive: data.isActive || false,
          createdAt: data.createdAt?.toDate() || new Date(),
        };
      });

      // Sort by creation date in JavaScript and take the latest 3
      return subscriptions
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, 3);
    } catch (error) {
      console.error("Error fetching latest subscriptions:", error);
      // Return some default subscription info if query fails
      return [
        {
          id: "default-1",
          name: "Premium Coffee Plan",
          price: 29.99,
          beans: 30,
          duration: 30,
          isActive: true,
          createdAt: new Date(),
        },
        {
          id: "default-2",
          name: "Student Coffee Plan",
          price: 19.99,
          beans: 20,
          duration: 30,
          isActive: true,
          createdAt: new Date(),
        },
      ];
    }
  }

  /**
   * Check if daily update should be sent
   */
  private async shouldSendDailyUpdate(userId: string): Promise<boolean> {
    try {
      const lastUpdate = await AsyncStorage.getItem(
        `${this.DAILY_UPDATE_KEY}_${userId}`
      );
      if (!lastUpdate) {
        return true;
      }

      const lastUpdateDate = new Date(lastUpdate);
      const now = new Date();
      const hoursSinceLastUpdate =
        (now.getTime() - lastUpdateDate.getTime()) / (1000 * 60 * 60);

      return hoursSinceLastUpdate >= 24; // Send once per day
    } catch (error) {
      console.error("Error checking daily update:", error);
      return true;
    }
  }

  /**
   * Send daily subscription updates
   */
  async sendDailySubscriptionUpdate(userId: string): Promise<void> {
    const shouldSend = await this.shouldSendDailyUpdate(userId);
    if (!shouldSend) {
      return;
    }

    try {
      const latestSubscriptions = await this.getLatestSubscriptions();

      if (latestSubscriptions.length > 0) {
        const subscriptionNames = latestSubscriptions
          .map((s) => s.name)
          .join(", ");

        await this.addNotification(userId, {
          type: "daily_update",
          title: "New Subscription Plans Available!",
          message: `Check out our latest plans: ${subscriptionNames}. Find the perfect coffee subscription for your needs!`,
          timestamp: new Date(),
          read: false,
          priority: "low",
        });

        // Update last daily update timestamp
        await AsyncStorage.setItem(
          `${this.DAILY_UPDATE_KEY}_${userId}`,
          new Date().toISOString()
        );
      }
    } catch (error) {
      console.error("Error sending daily update:", error);
    }
  }

  /**
   * Initialize notifications for a user (check expiry and send daily update)
   */
  async initializeNotifications(
    userId: string,
    userSubscription: any
  ): Promise<void> {
    try {
      // Check if we've already run today
      const lastRun = await AsyncStorage.getItem(
        `notifications_last_run_${userId}`
      );
      const today = new Date().toDateString();

      if (lastRun === today) {
        // Already ran today, skip
        return;
      }

      // Check subscription expiry
      await this.checkSubscriptionExpiry(userId, userSubscription);

      // Send daily update if needed
      await this.sendDailySubscriptionUpdate(userId);

      // Send welcome notification for new users (only once)
      await this.sendWelcomeNotification(userId);

      // Send coffee tips and check achievements (daily)
      await this.sendCoffeeTip(userId);
      await this.checkRealAchievements(userId);
      await this.sendPersonalizedRecommendations(userId);
      await this.sendSpecialOffers(userId);

      // Mark as run today
      await AsyncStorage.setItem(`notifications_last_run_${userId}`, today);
    } catch (error) {
      console.error("Error initializing notifications:", error);
    }
  }

  /**
   * Send welcome notification for new users
   */
  async sendWelcomeNotification(userId: string): Promise<void> {
    try {
      const notifications = await this.getNotifications(userId);
      const hasWelcome = notifications.some((n) => n.type === "welcome");

      if (!hasWelcome) {
        await this.addNotification(userId, {
          type: "welcome",
          title: "☕ Welcome to CoffeeShare!",
          message:
            "We're excited to have you! Start your coffee journey by exploring our subscription plans and discovering amazing cafes nearby.",
          timestamp: new Date(),
          read: false,
          priority: "medium",
          icon: "cafe",
        });
      }
    } catch (error) {
      console.error("Error sending welcome notification:", error);
    }
  }

  /**
   * Send daily coffee tips
   */
  async sendCoffeeTip(userId: string): Promise<void> {
    try {
      const lastTip = await AsyncStorage.getItem(`coffee_tip_${userId}`);
      const lastTipDate = lastTip ? new Date(lastTip) : null;
      const now = new Date();

      // Send tip every 5 days
      if (
        !lastTipDate ||
        now.getTime() - lastTipDate.getTime() > 5 * 24 * 60 * 60 * 1000
      ) {
        const tips = [
          {
            title: "☕ Coffee Tip: Perfect Brewing Temperature",
            message:
              "The ideal water temperature for brewing coffee is between 195°F-205°F (90°C-96°C). This ensures optimal extraction without burning the beans!",
          },
          {
            title: "☕ Coffee Tip: Storage Secrets",
            message:
              "Store your coffee beans in an airtight container away from light, heat, and moisture. Avoid the fridge - it can introduce unwanted odors!",
          },
          {
            title: "☕ Coffee Tip: Grind Fresh",
            message:
              "For the best flavor, grind your coffee beans just before brewing. Pre-ground coffee loses its flavor compounds within 30 minutes!",
          },
          {
            title: "☕ Coffee Tip: Water Quality Matters",
            message:
              "Since coffee is 98% water, use filtered or bottled water for brewing. Hard water can make coffee taste bitter, while soft water can make it taste flat.",
          },
          {
            title: "☕ Coffee Tip: Golden Ratio",
            message:
              "The perfect coffee-to-water ratio is 1:15 to 1:17. That's about 1-2 tablespoons of coffee per 6 ounces of water!",
          },
        ];

        const randomTip = tips[Math.floor(Math.random() * tips.length)];

        await this.addNotification(userId, {
          type: "coffee_tip",
          title: randomTip.title,
          message: randomTip.message,
          timestamp: new Date(),
          read: false,
          priority: "low",
          icon: "bulb",
        });

        await AsyncStorage.setItem(`coffee_tip_${userId}`, now.toISOString());
      }
    } catch (error) {
      console.error("Error sending coffee tip:", error);
    }
  }

  /**
   * Check and send achievement notifications
   */
  async checkAchievements(userId: string): Promise<void> {
    try {
      // This would typically check user's activity from Firestore
      // For now, we'll simulate some achievements
      const achievements = [
        {
          id: "first_coffee",
          title: "🏆 First Coffee Achievement!",
          message:
            "Congratulations! You've redeemed your first coffee. Welcome to the CoffeeShare family!",
          threshold: 1,
        },
        {
          id: "coffee_enthusiast",
          title: "🏆 Coffee Enthusiast!",
          message:
            "Amazing! You've redeemed 5 coffees this month. You're becoming a true coffee lover!",
          threshold: 5,
        },
        {
          id: "cafe_explorer",
          title: "🏆 Cafe Explorer!",
          message:
            "Fantastic! You've visited 3 different cafes. Keep exploring and discover new flavors!",
          threshold: 3,
        },
      ];

      // Simulate checking one random achievement
      const randomAchievement =
        achievements[Math.floor(Math.random() * achievements.length)];
      const notifications = await this.getNotifications(userId);
      const hasAchievement = notifications.some((n) =>
        n.message.includes(randomAchievement.id)
      );

      if (!hasAchievement && Math.random() > 0.7) {
        // 30% chance to trigger
        await this.addNotification(userId, {
          type: "achievement",
          title: randomAchievement.title,
          message: randomAchievement.message,
          timestamp: new Date(),
          read: false,
          priority: "medium",
          icon: "trophy",
        });
      }
    } catch (error) {
      console.error("Error checking achievements:", error);
    }
  }

  /**
   * Check and send real achievement notifications based on user activity
   */
  async checkRealAchievements(userId: string): Promise<void> {
    try {
      // Get user's actual activity from Firestore
      const userStats = await this.getUserActivityStats(userId);
      const existingNotifications = await this.getNotifications(userId);

      const achievements = [
        {
          id: "first_coffee",
          title: "🏆 First Coffee Achievement!",
          message:
            "Congratulations! You've redeemed your first coffee. Welcome to the CoffeeShare family!",
          threshold: 1,
          checkValue: userStats.totalCoffees,
        },
        {
          id: "coffee_enthusiast",
          title: "🏆 Coffee Enthusiast!",
          message:
            "Amazing! You've redeemed 5 coffees this month. You're becoming a true coffee lover!",
          threshold: 5,
          checkValue: userStats.monthlyScans,
        },
        {
          id: "cafe_explorer",
          title: "🏆 Cafe Explorer!",
          message:
            "Fantastic! You've visited 3 different cafes. Keep exploring and discover new flavors!",
          threshold: 3,
          checkValue: userStats.uniqueCafes,
        },
        {
          id: "weekly_warrior",
          title: "🏆 Weekly Warrior!",
          message:
            "Incredible! You've been active for 7 consecutive days. Your dedication is inspiring!",
          threshold: 7,
          checkValue: userStats.consecutiveDays,
        },
        {
          id: "bean_collector",
          title: "🏆 Bean Collector!",
          message:
            "Excellent! You've collected 100+ coffee beans. You're building quite the collection!",
          threshold: 100,
          checkValue: userStats.totalBeans,
        },
      ];

      // Check each achievement
      for (const achievement of achievements) {
        const hasAchievement = existingNotifications.some(
          (n) =>
            n.message.includes(achievement.id) ||
            n.title.includes(achievement.title)
        );

        // Only send if user reached threshold and hasn't received this achievement yet
        if (
          !hasAchievement &&
          achievement.checkValue >= achievement.threshold
        ) {
          await this.addNotification(userId, {
            type: "achievement",
            title: achievement.title,
            message: achievement.message,
            timestamp: new Date(),
            read: false,
            priority: "medium",
            icon: "trophy",
          });
        }
      }
    } catch (error) {
      console.error("Error checking real achievements:", error);
    }
  }

  /**
   * Get user's actual activity statistics from Firestore
   */
  async getUserActivityStats(userId: string): Promise<{
    totalCoffees: number;
    monthlyScans: number;
    uniqueCafes: number;
    consecutiveDays: number;
    totalBeans: number;
  }> {
    try {
      // Try to get user's activity from activityLogs collection instead of scans
      // First try with type filter, if it fails, try without type filter
      let activitySnapshot;

      try {
        const activityQuery = query(
          collection(db, "activityLogs"),
          where("userId", "==", userId),
          where("type", "==", "COFFEE_REDEMPTION"),
          orderBy("timestamp", "desc"),
          limit(100)
        );
        activitySnapshot = await getDocs(activityQuery);
      } catch (indexError) {
        console.log("Index not ready yet, trying simpler query...");
        // Fallback to simpler query without type filter
        const simpleQuery = query(
          collection(db, "activityLogs"),
          where("userId", "==", userId),
          orderBy("timestamp", "desc"),
          limit(100)
        );
        activitySnapshot = await getDocs(simpleQuery);
      }
      const activities = activitySnapshot.docs
        .map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            userId: data.userId || "",
            cafeId: data.cafeId || "",
            type: data.type || "",
            timestamp: data.timestamp?.toDate() || new Date(),
            ...data,
          };
        })
        .filter(
          (activity) =>
            activity.type === "COFFEE_REDEMPTION" ||
            activity.type === "coffee_redemption" ||
            !activity.type // Include activities without type for backward compatibility
        );

      // Calculate stats
      const now = new Date();
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const totalCoffees = activities.length;
      const monthlyScans = activities.filter(
        (activity) => activity.timestamp >= oneMonthAgo
      ).length;

      // Count unique cafes
      const uniqueCafes = new Set(
        activities.map((activity) => activity.cafeId).filter(Boolean)
      ).size;

      // Calculate consecutive days (simplified)
      let consecutiveDays = 0;
      const activityDates = [
        ...new Set(
          activities.map((activity) => activity.timestamp.toDateString())
        ),
      ];

      for (let i = 0; i < Math.min(activityDates.length, 30); i++) {
        const checkDate = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        if (activityDates.includes(checkDate.toDateString())) {
          consecutiveDays++;
        } else {
          break;
        }
      }

      // Get user's current beans (simplified - would get from user document)
      const totalBeans = activities.length * 10; // Assume 10 beans per activity

      return {
        totalCoffees,
        monthlyScans,
        uniqueCafes,
        consecutiveDays,
        totalBeans,
      };
    } catch (error) {
      console.error("Error getting user activity stats:", error);
      // Return default stats if error - this prevents the permission error from breaking the app
      return {
        totalCoffees: 0,
        monthlyScans: 0,
        uniqueCafes: 0,
        consecutiveDays: 0,
        totalBeans: 0,
      };
    }
  }

  /**
   * Send personalized recommendations
   */
  async sendPersonalizedRecommendations(userId: string): Promise<void> {
    try {
      const lastRec = await AsyncStorage.getItem(`recommendation_${userId}`);
      const lastRecDate = lastRec ? new Date(lastRec) : null;
      const now = new Date();

      // Send recommendation every 7 days
      if (
        !lastRecDate ||
        now.getTime() - lastRecDate.getTime() > 7 * 24 * 60 * 60 * 1000
      ) {
        const recommendations = [
          {
            title: "🎯 Perfect Match Found!",
            message:
              "Based on your coffee habits, we think you'd love our Premium Roast at Café Central. Try it with your next visit!",
          },
          {
            title: "🌟 New Cafe Recommendation",
            message:
              "Coffee lovers like you are raving about Aroma Bistro! It's just 0.5km from your usual spots. Give it a try!",
          },
          {
            title: "☀️ Morning Boost Suggestion",
            message:
              "Your morning coffee routine could be even better! Try switching to our Espresso Blend for that extra energy kick.",
          },
          {
            title: "🍃 Sustainability Tip",
            message:
              "Love the planet as much as coffee? Choose cafes with our 'Eco-Friendly' badge to support sustainable practices!",
          },
        ];

        const randomRec =
          recommendations[Math.floor(Math.random() * recommendations.length)];

        await this.addNotification(userId, {
          type: "recommendation",
          title: randomRec.title,
          message: randomRec.message,
          timestamp: new Date(),
          read: false,
          priority: "low",
          icon: "compass",
        });

        await AsyncStorage.setItem(
          `recommendation_${userId}`,
          now.toISOString()
        );
      }
    } catch (error) {
      console.error("Error sending recommendations:", error);
    }
  }

  /**
   * Send special offers and promotions
   */
  async sendSpecialOffers(userId: string): Promise<void> {
    try {
      const lastOffer = await AsyncStorage.getItem(`special_offer_${userId}`);
      const lastOfferDate = lastOffer ? new Date(lastOffer) : null;
      const now = new Date();

      // Send offer every 10 days
      if (
        !lastOfferDate ||
        now.getTime() - lastOfferDate.getTime() > 10 * 24 * 60 * 60 * 1000
      ) {
        const offers = [
          {
            title: "🎉 Weekend Special: 20% Off!",
            message:
              "This weekend only! Get 20% off your next coffee purchase at any participating cafe. Use code: WEEKEND20",
          },
          {
            title: "☕ Happy Hour: Buy 1 Get 1 Free!",
            message:
              "Today from 3-5 PM: Buy any coffee and get another one FREE! Perfect for sharing with a friend.",
          },
          {
            title: "🌟 Loyalty Bonus: Extra 5 Beans!",
            message:
              "You're awesome! As a valued customer, enjoy 5 bonus beans added to your next subscription renewal.",
          },
          {
            title: "🎁 Refer a Friend Reward",
            message:
              "Invite friends to CoffeeShare and both of you get a free week of coffee! Share the coffee love.",
          },
          {
            title: "🏆 VIP Access: New Cafe Preview",
            message:
              "Exclusive for you! Get early access to our newest partner cafe 'Roast & Toast' opening next week.",
          },
        ];

        const randomOffer = offers[Math.floor(Math.random() * offers.length)];

        await this.addNotification(userId, {
          type: "special_offer",
          title: randomOffer.title,
          message: randomOffer.message,
          timestamp: new Date(),
          read: false,
          priority: "high",
          icon: "gift",
        });

        await AsyncStorage.setItem(
          `special_offer_${userId}`,
          now.toISOString()
        );
      }
    } catch (error) {
      console.error("Error sending special offers:", error);
    }
  }

  /**
   * Clear all notifications for a user
   */
  async clearAllNotifications(userId: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(`${this.STORAGE_KEY}_${userId}`);
    } catch (error) {
      console.error("Error clearing notifications:", error);
    }
  }
}

export const notificationService = new NotificationService();
export default notificationService;
