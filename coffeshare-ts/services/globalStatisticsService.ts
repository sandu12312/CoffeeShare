import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp,
  onSnapshot,
  writeBatch,
} from "firebase/firestore";
import { db } from "../config/firebase";

export interface GlobalStatistics {
  id?: string;
  // User Statistics
  totalUsers: number;
  activeUsers: number;
  newUsersThisMonth: number;
  newUsersThisWeek: number;

  // Partner Statistics
  totalPartners: number;
  activePartners: number;
  pendingPartners: number;

  // Cafe Statistics
  totalCafes: number;
  activeCafes: number;
  pendingCafes: number;
  inactiveCafes: number;

  // Product Statistics
  totalProducts: number;

  // Subscription Statistics
  totalSubscriptions: number;
  activeSubscriptions: number;
  subscriptionRevenue: number;

  // Activity Statistics
  coffeesRedeemedToday: number;
  coffeesRedeemedThisWeek: number;
  coffeesRedeemedThisMonth: number;
  totalCoffeesRedeemed: number;

  // Revenue Statistics
  totalRevenue: number;
  revenueThisMonth: number;
  revenueThisWeek: number;
  revenueToday: number;

  // Engagement Statistics
  activeCartsCount: number;
  qrScansToday: number;
  qrScansThisWeek: number;

  // Growth Statistics
  userGrowthRate: number; // percentage
  revenueGrowthRate: number; // percentage

  // Last updated
  lastUpdated: Timestamp;
  calculatedAt: Timestamp;
}

export interface DailyStatistics {
  id?: string;
  date: string; // YYYY-MM-DD
  newUsers: number;
  newPartners: number;
  newCafes: number;
  coffeesRedeemed: number;
  revenue: number;
  activeUsers: number;
  qrScans: number;
  createdAt: Timestamp;
}

export interface TrendData {
  period: string;
  value: number;
  label: string;
}

class GlobalStatisticsService {
  private readonly GLOBAL_STATS_DOC = "global";
  private readonly COLLECTION_NAME = "globalStatistics";
  private readonly DAILY_STATS_COLLECTION = "dailyStatistics";

  /**
   * Calculate and update global statistics
   */
  async calculateAndUpdateGlobalStatistics(): Promise<GlobalStatistics> {
    try {
      console.log("🔄 Starting global statistics calculation...");

      const stats: GlobalStatistics = {
        // Initialize all stats
        totalUsers: 0,
        activeUsers: 0,
        newUsersThisMonth: 0,
        newUsersThisWeek: 0,
        totalPartners: 0,
        activePartners: 0,
        pendingPartners: 0,
        totalCafes: 0,
        activeCafes: 0,
        pendingCafes: 0,
        inactiveCafes: 0,
        totalProducts: 0,
        totalSubscriptions: 0,
        activeSubscriptions: 0,
        subscriptionRevenue: 0,
        coffeesRedeemedToday: 0,
        coffeesRedeemedThisWeek: 0,
        coffeesRedeemedThisMonth: 0,
        totalCoffeesRedeemed: 0,
        totalRevenue: 0,
        revenueThisMonth: 0,
        revenueThisWeek: 0,
        revenueToday: 0,
        activeCartsCount: 0,
        qrScansToday: 0,
        qrScansThisWeek: 0,
        userGrowthRate: 0,
        revenueGrowthRate: 0,
        lastUpdated: serverTimestamp() as Timestamp,
        calculatedAt: Timestamp.now(),
      };

      // Date calculations
      const now = new Date();
      const today = now.toISOString().split("T")[0];
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const startOfToday = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      );

      // User Statistics
      await this.calculateUserStatistics(stats, oneWeekAgo, oneMonthAgo);

      // Partner Statistics
      await this.calculatePartnerStatistics(stats);

      // Cafe Statistics
      await this.calculateCafeStatistics(stats);

      // Product Statistics
      await this.calculateProductStatistics(stats);

      // Subscription Statistics
      await this.calculateSubscriptionStatistics(stats, oneMonthAgo);

      // Activity & QR Statistics
      await this.calculateActivityStatistics(
        stats,
        startOfToday,
        oneWeekAgo,
        oneMonthAgo
      );

      // Revenue Statistics
      await this.calculateRevenueStatistics(
        stats,
        startOfToday,
        oneWeekAgo,
        oneMonthAgo
      );

      // Cart Statistics
      await this.calculateCartStatistics(stats);

      // Growth Statistics
      await this.calculateGrowthStatistics(stats, oneMonthAgo);

      // Save to database
      const statsRef = doc(db, this.COLLECTION_NAME, this.GLOBAL_STATS_DOC);
      await setDoc(statsRef, stats, { merge: true });

      console.log("✅ Global statistics calculated and saved:", {
        totalUsers: stats.totalUsers,
        totalCafes: stats.totalCafes,
        totalRevenue: stats.totalRevenue,
        coffeesRedeemed: stats.totalCoffeesRedeemed,
      });

      return stats;
    } catch (error) {
      console.error("❌ Error calculating global statistics:", error);
      throw error;
    }
  }

  /**
   * Calculate user statistics
   */
  private async calculateUserStatistics(
    stats: GlobalStatistics,
    oneWeekAgo: Date,
    oneMonthAgo: Date
  ): Promise<void> {
    try {
      // Get all users from different collections
      const collections = ["users", "admins", "partners"];
      let totalUsers = 0;
      let activeUsers = 0;
      let newUsersThisWeek = 0;
      let newUsersThisMonth = 0;

      for (const collectionName of collections) {
        try {
          const snapshot = await getDocs(collection(db, collectionName));

          snapshot.forEach((doc) => {
            const userData = doc.data();
            totalUsers++;

            // Count active users
            if (userData.status === "active" || !userData.status) {
              activeUsers++;
            }

            // Count new users
            const createdAt = userData.createdAt?.toDate();
            if (createdAt) {
              if (createdAt >= oneWeekAgo) {
                newUsersThisWeek++;
              }
              if (createdAt >= oneMonthAgo) {
                newUsersThisMonth++;
              }
            }
          });
        } catch (error) {
          console.warn(`Collection ${collectionName} might not exist:`, error);
        }
      }

      stats.totalUsers = totalUsers;
      stats.activeUsers = activeUsers;
      stats.newUsersThisWeek = newUsersThisWeek;
      stats.newUsersThisMonth = newUsersThisMonth;

      console.log(`📊 User stats: ${totalUsers} total, ${activeUsers} active`);
    } catch (error) {
      console.error("Error calculating user statistics:", error);
    }
  }

  /**
   * Calculate partner statistics
   */
  private async calculatePartnerStatistics(
    stats: GlobalStatistics
  ): Promise<void> {
    try {
      let totalPartners = 0;
      let activePartners = 0;

      // Partners from partners collection
      try {
        const partnersSnapshot = await getDocs(collection(db, "partners"));
        totalPartners += partnersSnapshot.size;

        partnersSnapshot.forEach((doc) => {
          const partnerData = doc.data();
          if (
            partnerData.status === "active" ||
            partnerData.verificationStatus === "verified"
          ) {
            activePartners++;
          }
        });
      } catch (error) {
        console.warn("Partners collection might not exist:", error);
      }

      // Partners from users collection (legacy)
      try {
        const legacyPartnersQuery = query(
          collection(db, "users"),
          where("role", "==", "partner")
        );
        const legacyPartnersSnapshot = await getDocs(legacyPartnersQuery);

        legacyPartnersSnapshot.forEach((doc) => {
          const userData = doc.data();
          totalPartners++;
          if (userData.status === "active" || !userData.status) {
            activePartners++;
          }
        });
      } catch (error) {
        console.warn("Legacy partners query failed:", error);
      }

      // Pending partner registrations
      let pendingPartners = 0;
      try {
        const pendingRegistrationsSnapshot = await getDocs(
          query(
            collection(db, "pendingPartnerRegistrations"),
            where("status", "==", "pending")
          )
        );
        pendingPartners = pendingRegistrationsSnapshot.size;
      } catch (error) {
        console.warn(
          "Pending registrations collection might not exist:",
          error
        );
      }

      stats.totalPartners = totalPartners;
      stats.activePartners = activePartners;
      stats.pendingPartners = pendingPartners;

      console.log(
        `🏪 Partner stats: ${totalPartners} total, ${activePartners} active`
      );
    } catch (error) {
      console.error("Error calculating partner statistics:", error);
    }
  }

  /**
   * Calculate cafe statistics
   */
  private async calculateCafeStatistics(
    stats: GlobalStatistics
  ): Promise<void> {
    try {
      const cafesSnapshot = await getDocs(collection(db, "cafes"));
      let totalCafes = cafesSnapshot.size;
      let activeCafes = 0;
      let pendingCafes = 0;
      let inactiveCafes = 0;

      cafesSnapshot.forEach((doc) => {
        const cafeData = doc.data();
        switch (cafeData.status) {
          case "active":
            activeCafes++;
            break;
          case "pending":
            pendingCafes++;
            break;
          case "inactive":
            inactiveCafes++;
            break;
        }
      });

      stats.totalCafes = totalCafes;
      stats.activeCafes = activeCafes;
      stats.pendingCafes = pendingCafes;
      stats.inactiveCafes = inactiveCafes;

      console.log(`☕ Cafe stats: ${totalCafes} total, ${activeCafes} active`);
    } catch (error) {
      console.error("Error calculating cafe statistics:", error);
    }
  }

  /**
   * Calculate product statistics
   */
  private async calculateProductStatistics(
    stats: GlobalStatistics
  ): Promise<void> {
    try {
      const productsSnapshot = await getDocs(collection(db, "products"));
      stats.totalProducts = productsSnapshot.size;

      console.log(`🛍️ Product stats: ${stats.totalProducts} total products`);
    } catch (error) {
      console.error("Error calculating product statistics:", error);
    }
  }

  /**
   * Calculate subscription statistics
   */
  private async calculateSubscriptionStatistics(
    stats: GlobalStatistics,
    oneMonthAgo: Date
  ): Promise<void> {
    try {
      // Subscription plans
      try {
        const subscriptionsSnapshot = await getDocs(
          collection(db, "subscriptions")
        );
        stats.totalSubscriptions = subscriptionsSnapshot.size;
      } catch (error) {
        console.warn("Subscriptions collection might not exist:", error);
      }

      // User subscriptions
      try {
        const userSubscriptionsSnapshot = await getDocs(
          collection(db, "userSubscriptions")
        );
        let activeSubscriptions = 0;
        let subscriptionRevenue = 0;

        userSubscriptionsSnapshot.forEach((doc) => {
          const subData = doc.data();
          if (subData.status === "active") {
            activeSubscriptions++;
            subscriptionRevenue += subData.price || 0;
          }
        });

        stats.activeSubscriptions = activeSubscriptions;
        stats.subscriptionRevenue = subscriptionRevenue;

        console.log(
          `💳 Subscription stats: ${activeSubscriptions} active, ${subscriptionRevenue} RON revenue`
        );
      } catch (error) {
        console.warn("User subscriptions collection might not exist:", error);
      }
    } catch (error) {
      console.error("Error calculating subscription statistics:", error);
    }
  }

  /**
   * Calculate activity and QR statistics
   */
  private async calculateActivityStatistics(
    stats: GlobalStatistics,
    startOfToday: Date,
    oneWeekAgo: Date,
    oneMonthAgo: Date
  ): Promise<void> {
    try {
      let totalCoffeesRedeemed = 0;
      let coffeesRedeemedToday = 0;
      let coffeesRedeemedThisWeek = 0;
      let coffeesRedeemedThisMonth = 0;
      let qrScansToday = 0;
      let qrScansThisWeek = 0;

      // QR Scans and Coffee Redemptions from transactions
      try {
        const transactionsSnapshot = await getDocs(
          collection(db, "transactions")
        );
        totalCoffeesRedeemed += transactionsSnapshot.size;

        transactionsSnapshot.forEach((doc) => {
          const transactionData = doc.data();
          const scannedAt = transactionData.scannedAt?.toDate();

          if (scannedAt) {
            if (scannedAt >= startOfToday) {
              coffeesRedeemedToday++;
              qrScansToday++;
            }
            if (scannedAt >= oneWeekAgo) {
              coffeesRedeemedThisWeek++;
              qrScansThisWeek++;
            }
            if (scannedAt >= oneMonthAgo) {
              coffeesRedeemedThisMonth++;
            }
          }
        });
      } catch (error) {
        console.warn("Transactions collection might not exist:", error);
      }

      // Also check user activities
      try {
        const activitiesSnapshot = await getDocs(
          query(
            collection(db, "userActivities"),
            where("type", "==", "COFFEE_REDEMPTION")
          )
        );

        activitiesSnapshot.forEach((doc) => {
          const activityData = doc.data();
          const timestamp = activityData.timestamp?.toDate();

          if (timestamp) {
            if (timestamp >= startOfToday) {
              coffeesRedeemedToday++;
            }
            if (timestamp >= oneWeekAgo) {
              coffeesRedeemedThisWeek++;
            }
            if (timestamp >= oneMonthAgo) {
              coffeesRedeemedThisMonth++;
            }
          }
        });

        totalCoffeesRedeemed = Math.max(
          totalCoffeesRedeemed,
          activitiesSnapshot.size
        );
      } catch (error) {
        console.warn("User activities collection might not exist:", error);
      }

      stats.totalCoffeesRedeemed = totalCoffeesRedeemed;
      stats.coffeesRedeemedToday = coffeesRedeemedToday;
      stats.coffeesRedeemedThisWeek = coffeesRedeemedThisWeek;
      stats.coffeesRedeemedThisMonth = coffeesRedeemedThisMonth;
      stats.qrScansToday = qrScansToday;
      stats.qrScansThisWeek = qrScansThisWeek;

      console.log(
        `⚡ Activity stats: ${totalCoffeesRedeemed} total redemptions, ${qrScansToday} QR scans today`
      );
    } catch (error) {
      console.error("Error calculating activity statistics:", error);
    }
  }

  /**
   * Calculate revenue statistics
   */
  private async calculateRevenueStatistics(
    stats: GlobalStatistics,
    startOfToday: Date,
    oneWeekAgo: Date,
    oneMonthAgo: Date
  ): Promise<void> {
    try {
      let totalRevenue = 0;
      let revenueToday = 0;
      let revenueThisWeek = 0;
      let revenueThisMonth = 0;

      // Revenue from partner analytics
      try {
        const partnerProfilesSnapshot = await getDocs(
          collection(db, "partnerAnalyticsProfiles")
        );
        partnerProfilesSnapshot.forEach((doc) => {
          const profileData = doc.data();
          totalRevenue += profileData.totalEarnings || 0;
        });
      } catch (error) {
        console.warn("Partner analytics profiles might not exist:", error);
      }

      // Revenue from transactions
      try {
        const transactionsSnapshot = await getDocs(
          collection(db, "transactions")
        );
        transactionsSnapshot.forEach((doc) => {
          const transactionData = doc.data();
          const earnings = transactionData.earningsRon || 0;
          const scannedAt = transactionData.scannedAt?.toDate();

          if (scannedAt) {
            if (scannedAt >= startOfToday) {
              revenueToday += earnings;
            }
            if (scannedAt >= oneWeekAgo) {
              revenueThisWeek += earnings;
            }
            if (scannedAt >= oneMonthAgo) {
              revenueThisMonth += earnings;
            }
          }
        });
      } catch (error) {
        console.warn("Transactions collection might not exist:", error);
      }

      // Add subscription revenue
      totalRevenue += stats.subscriptionRevenue;

      stats.totalRevenue = totalRevenue;
      stats.revenueToday = revenueToday;
      stats.revenueThisWeek = revenueThisWeek;
      stats.revenueThisMonth = revenueThisMonth;

      console.log(
        `💰 Revenue stats: ${totalRevenue} RON total, ${revenueToday} RON today`
      );
    } catch (error) {
      console.error("Error calculating revenue statistics:", error);
    }
  }

  /**
   * Calculate cart statistics
   */
  private async calculateCartStatistics(
    stats: GlobalStatistics
  ): Promise<void> {
    try {
      const cartsSnapshot = await getDocs(collection(db, "userCarts"));
      let activeCartsCount = 0;

      cartsSnapshot.forEach((doc) => {
        const cartData = doc.data();
        if (cartData.items && cartData.items.length > 0) {
          activeCartsCount++;
        }
      });

      stats.activeCartsCount = activeCartsCount;

      console.log(`🛒 Cart stats: ${activeCartsCount} active carts`);
    } catch (error) {
      console.error("Error calculating cart statistics:", error);
    }
  }

  /**
   * Calculate growth statistics
   */
  private async calculateGrowthStatistics(
    stats: GlobalStatistics,
    oneMonthAgo: Date
  ): Promise<void> {
    try {
      // Calculate user growth rate
      const previousMonthUsers = stats.totalUsers - stats.newUsersThisMonth;
      stats.userGrowthRate =
        previousMonthUsers > 0
          ? (stats.newUsersThisMonth / previousMonthUsers) * 100
          : 0;

      // Calculate revenue growth rate (simplified)
      const previousMonthRevenue = stats.totalRevenue - stats.revenueThisMonth;
      stats.revenueGrowthRate =
        previousMonthRevenue > 0
          ? (stats.revenueThisMonth / previousMonthRevenue) * 100
          : 0;

      console.log(
        `📈 Growth stats: ${stats.userGrowthRate.toFixed(
          1
        )}% user growth, ${stats.revenueGrowthRate.toFixed(1)}% revenue growth`
      );
    } catch (error) {
      console.error("Error calculating growth statistics:", error);
    }
  }

  /**
   * Get global statistics
   */
  async getGlobalStatistics(): Promise<GlobalStatistics | null> {
    try {
      const statsRef = doc(db, this.COLLECTION_NAME, this.GLOBAL_STATS_DOC);
      const statsDoc = await getDoc(statsRef);

      if (statsDoc.exists()) {
        return { id: statsDoc.id, ...statsDoc.data() } as GlobalStatistics;
      }

      // If no stats exist, calculate them
      console.log("📊 No existing statistics found, calculating new ones...");
      return await this.calculateAndUpdateGlobalStatistics();
    } catch (error: any) {
      console.error("Error getting global statistics:", error);

      // Handle specific Firebase permission errors
      if (error?.code === "permission-denied") {
        console.error(
          "Permission denied accessing statistics. Make sure Firestore rules are deployed and user has admin permissions."
        );
      }

      return null;
    }
  }

  /**
   * Subscribe to global statistics changes
   */
  subscribeToGlobalStatistics(
    callback: (stats: GlobalStatistics | null) => void
  ): () => void {
    const statsRef = doc(db, this.COLLECTION_NAME, this.GLOBAL_STATS_DOC);

    return onSnapshot(
      statsRef,
      (doc) => {
        if (doc.exists()) {
          callback({ id: doc.id, ...doc.data() } as GlobalStatistics);
        } else {
          callback(null);
        }
      },
      (error: any) => {
        console.error("Error subscribing to global statistics:", error);

        // Handle specific Firebase permission errors
        if (error?.code === "permission-denied") {
          console.error(
            "Permission denied subscribing to statistics. Make sure Firestore rules are deployed and user has admin permissions."
          );
        }

        callback(null);
      }
    );
  }

  /**
   * Record daily statistics
   */
  async recordDailyStatistics(): Promise<void> {
    try {
      const today = new Date().toISOString().split("T")[0];
      const dailyStatsRef = doc(db, this.DAILY_STATS_COLLECTION, today);

      // Check if today's stats already exist
      const existingStats = await getDoc(dailyStatsRef);
      if (existingStats.exists()) {
        console.log("📅 Daily statistics for today already recorded");
        return;
      }

      // Calculate today's statistics
      const globalStats = await this.getGlobalStatistics();
      if (!globalStats) return;

      const dailyStats: DailyStatistics = {
        date: today,
        newUsers: globalStats.newUsersThisWeek, // This would need more precise calculation
        newPartners: 0, // Would need to calculate partners created today
        newCafes: 0, // Would need to calculate cafes created today
        coffeesRedeemed: globalStats.coffeesRedeemedToday,
        revenue: globalStats.revenueToday,
        activeUsers: globalStats.activeUsers,
        qrScans: globalStats.qrScansToday,
        createdAt: Timestamp.now(),
      };

      await setDoc(dailyStatsRef, dailyStats);
      console.log(`📅 Daily statistics recorded for ${today}`);
    } catch (error) {
      console.error("Error recording daily statistics:", error);
    }
  }

  /**
   * Get trending data for charts
   */
  async getTrendingData(days: number = 7): Promise<{
    userTrend: TrendData[];
    revenueTrend: TrendData[];
    activityTrend: TrendData[];
  }> {
    try {
      const endDate = new Date();
      const endDateStr = endDate.toISOString().split("T")[0];

      let dailyStatsSnapshot;
      try {
        dailyStatsSnapshot = await getDocs(
          query(
            collection(db, this.DAILY_STATS_COLLECTION),
            orderBy("date", "desc"),
            limit(days)
          )
        );
      } catch (error) {
        console.warn(
          "Daily statistics collection might not exist, generating mock data"
        );
        return this.generateMockTrendingData(days);
      }

      const userTrend: TrendData[] = [];
      const revenueTrend: TrendData[] = [];
      const activityTrend: TrendData[] = [];

      dailyStatsSnapshot.forEach((doc) => {
        const data = doc.data() as DailyStatistics;
        const date = new Date(data.date);
        const label = date.toLocaleDateString("ro-RO", {
          month: "short",
          day: "numeric",
        });

        userTrend.push({
          period: data.date,
          value: data.newUsers,
          label,
        });

        revenueTrend.push({
          period: data.date,
          value: data.revenue,
          label,
        });

        activityTrend.push({
          period: data.date,
          value: data.coffeesRedeemed,
          label,
        });
      });

      return {
        userTrend: userTrend.reverse(),
        revenueTrend: revenueTrend.reverse(),
        activityTrend: activityTrend.reverse(),
      };
    } catch (error) {
      console.error("Error getting trending data:", error);
      return this.generateMockTrendingData(days);
    }
  }

  /**
   * Generate mock trending data for demo purposes
   */
  private generateMockTrendingData(days: number): {
    userTrend: TrendData[];
    revenueTrend: TrendData[];
    activityTrend: TrendData[];
  } {
    const userTrend: TrendData[] = [];
    const revenueTrend: TrendData[] = [];
    const activityTrend: TrendData[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      const label = date.toLocaleDateString("ro-RO", {
        month: "short",
        day: "numeric",
      });

      userTrend.push({
        period: dateStr,
        value: Math.floor(Math.random() * 20) + 5,
        label,
      });

      revenueTrend.push({
        period: dateStr,
        value: Math.floor(Math.random() * 500) + 100,
        label,
      });

      activityTrend.push({
        period: dateStr,
        value: Math.floor(Math.random() * 50) + 10,
        label,
      });
    }

    return { userTrend, revenueTrend, activityTrend };
  }

  /**
   * Force refresh statistics (for admin use)
   */
  async refreshStatistics(): Promise<GlobalStatistics> {
    console.log("🔄 Force refreshing global statistics...");
    return await this.calculateAndUpdateGlobalStatistics();
  }

  /**
   * Initialize statistics service (run on app start)
   */
  async initialize(): Promise<void> {
    try {
      // Calculate global statistics if they don't exist or are outdated
      const existingStats = await this.getGlobalStatistics();
      const now = new Date();

      if (
        !existingStats ||
        (existingStats.calculatedAt &&
          now.getTime() - existingStats.calculatedAt.toMillis() >
            60 * 60 * 1000)
      ) {
        // 1 hour
        console.log("📊 Statistics are outdated, recalculating...");
        await this.calculateAndUpdateGlobalStatistics();
      }
    } catch (error) {
      console.error("Error initializing statistics service:", error);
    }
  }
}

export const globalStatisticsService = new GlobalStatisticsService();
export default globalStatisticsService;
