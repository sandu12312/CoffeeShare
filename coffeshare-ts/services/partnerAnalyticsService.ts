import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  DocumentData,
  Timestamp,
  runTransaction,
  serverTimestamp,
  increment,
} from "firebase/firestore";
import { db } from "../config/firebase";

// Constants
const BEANS_TO_RON_RATE = 2; // 1 bean = 2 RON

// Interfaces
export interface PartnerTransaction {
  id?: string;
  partnerId: string;
  partnerEmail: string;
  partnerName: string;
  cafeId: string;
  cafeName: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  qrTokenId: string;
  beansUsed: number;
  earningsRon: number;
  scannedAt: Timestamp;
  date: string; // YYYY-MM-DD format
  tokenType: "instant" | "checkout";
  items?: Array<{
    productName: string;
    quantity: number;
    beansValue: number;
  }>;
}

export interface PartnerDailyReport {
  id?: string;
  partnerId: string;
  partnerEmail: string;
  partnerName: string;
  cafeId: string;
  cafeName: string;
  date: string; // YYYY-MM-DD format
  scansCount: number;
  totalBeansUsed: number;
  totalEarningsRON: number;
  uniqueCustomers: string[]; // Array of user IDs
  hourlyDistribution: { [hour: string]: number }; // hour_0, hour_1, etc.
  firstScanAt?: Timestamp;
  lastScanAt?: Timestamp;
  updatedAt: Timestamp;
}

export interface PartnerAnalyticsProfile {
  id?: string;
  partnerId: string;
  partnerEmail: string;
  partnerName: string;
  totalEarnings: number;
  totalScans: number;
  totalBeansProcessed: number;
  firstScanAt?: Timestamp;
  lastScanAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface DashboardStats {
  todayScans: number;
  todayEarnings: number;
  todayUniqueCustomers: number;
  totalEarnings: number;
  totalScans: number;
  totalBeansProcessed: number;
  averageEarningsPerDay: number;
  peakHour: string;
  lastScanAt?: Timestamp;
}

export interface ReportsData {
  dailyReports: PartnerDailyReport[];
  totalScans: number;
  totalEarnings: number;
  totalBeansUsed: number;
  uniqueCustomers: number;
  peakHour: string;
  averageScansPerDay: number;
  averageEarningsPerDay: number;
}

class PartnerAnalyticsService {
  /**
   * Initialize partner analytics profile
   */
  async initializePartnerProfile(
    partnerId: string,
    partnerEmail: string,
    partnerName: string
  ): Promise<void> {
    try {
      const profileRef = doc(db, "partnerAnalyticsProfiles", partnerId);
      const profileDoc = await getDoc(profileRef);

      if (!profileDoc.exists()) {
        const newProfile: Omit<PartnerAnalyticsProfile, "id"> = {
          partnerId,
          partnerEmail,
          partnerName,
          totalEarnings: 0,
          totalScans: 0,
          totalBeansProcessed: 0,
          createdAt: serverTimestamp() as Timestamp,
          updatedAt: serverTimestamp() as Timestamp,
        };

        await setDoc(profileRef, newProfile);
        console.log(`✅ Partner analytics profile created for ${partnerEmail}`);
      }
    } catch (error) {
      console.error("Error initializing partner profile:", error);
      throw error;
    }
  }

  /**
   * Log a partner scan transaction (called during QR scan)
   */
  async logPartnerScan(
    partnerId: string,
    partnerEmail: string,
    partnerName: string,
    cafeId: string,
    cafeName: string,
    userId: string,
    qrTokenId: string,
    beansUsed: number,
    tokenType: "instant" | "checkout" = "instant",
    userInfo?: { name?: string; email?: string },
    items?: Array<{ productName: string; quantity: number; beansValue: number }>
  ): Promise<void> {
    try {
      const now = new Date();
      const today = now.toISOString().split("T")[0]; // YYYY-MM-DD
      const hour = now.getHours();
      const earningsRon = beansUsed * BEANS_TO_RON_RATE;

      await runTransaction(db, async (transaction) => {
        // ===== ALL READS FIRST (Firestore requirement) =====

        // 1. Read daily report document
        const dailyReportId = `${partnerId}_${today}`;
        const dailyReportRef = doc(db, "partnerReports", dailyReportId);
        const dailyReportDoc = await transaction.get(dailyReportRef);

        // 2. Read partner analytics profile
        const profileRef = doc(db, "partnerAnalyticsProfiles", partnerId);
        const profileDoc = await transaction.get(profileRef);

        // ===== ALL WRITES SECOND (Firestore requirement) =====

        // 3. Create transaction record
        const transactionData: any = {
          partnerId,
          partnerEmail,
          partnerName,
          cafeId,
          cafeName,
          userId,
          qrTokenId,
          beansUsed,
          earningsRon,
          scannedAt: Timestamp.now(),
          date: today,
          tokenType,
        };

        // Only add optional fields if they have actual values (not undefined or null)
        if (
          userInfo?.name !== undefined &&
          userInfo?.name !== null &&
          userInfo?.name !== ""
        ) {
          transactionData.userName = userInfo.name;
        }

        if (
          userInfo?.email !== undefined &&
          userInfo?.email !== null &&
          userInfo?.email !== ""
        ) {
          transactionData.userEmail = userInfo.email;
        }

        if (items && items.length > 0) {
          transactionData.items = items;
        }

        const transactionRef = doc(collection(db, "transactions"));
        transaction.set(transactionRef, transactionData);

        // 4. Update daily report
        if (dailyReportDoc.exists()) {
          const currentData = dailyReportDoc.data() as PartnerDailyReport;
          const uniqueCustomers = Array.from(
            new Set([...currentData.uniqueCustomers, userId])
          );
          const hourlyDistribution = {
            ...currentData.hourlyDistribution,
            [`hour_${hour}`]:
              (currentData.hourlyDistribution[`hour_${hour}`] || 0) + 1,
          };

          transaction.update(dailyReportRef, {
            scansCount: increment(1),
            totalBeansUsed: increment(beansUsed),
            totalEarningsRON: increment(earningsRon),
            uniqueCustomers,
            hourlyDistribution,
            lastScanAt: Timestamp.now(),
            updatedAt: serverTimestamp(),
          });
        } else {
          const newDailyReport: Omit<PartnerDailyReport, "id"> = {
            partnerId,
            partnerEmail,
            partnerName,
            cafeId,
            cafeName,
            date: today,
            scansCount: 1,
            totalBeansUsed: beansUsed,
            totalEarningsRON: earningsRon,
            uniqueCustomers: [userId],
            hourlyDistribution: { [`hour_${hour}`]: 1 },
            firstScanAt: Timestamp.now(),
            lastScanAt: Timestamp.now(),
            updatedAt: serverTimestamp() as Timestamp,
          };

          transaction.set(dailyReportRef, newDailyReport);
        }

        // 5. Update partner analytics profile
        if (profileDoc.exists()) {
          transaction.update(profileRef, {
            totalEarnings: increment(earningsRon),
            totalScans: increment(1),
            totalBeansProcessed: increment(beansUsed),
            lastScanAt: Timestamp.now(),
            updatedAt: serverTimestamp(),
          });
        } else {
          // Create profile if it doesn't exist
          const newProfile: Omit<PartnerAnalyticsProfile, "id"> = {
            partnerId,
            partnerEmail,
            partnerName,
            totalEarnings: earningsRon,
            totalScans: 1,
            totalBeansProcessed: beansUsed,
            firstScanAt: Timestamp.now(),
            lastScanAt: Timestamp.now(),
            createdAt: serverTimestamp() as Timestamp,
            updatedAt: serverTimestamp() as Timestamp,
          };

          transaction.set(profileRef, newProfile);
        }
      });

      console.log(
        `✅ Partner scan logged: ${beansUsed} beans, ${earningsRon} RON for partner ${partnerEmail}`
      );
    } catch (error) {
      console.error("Error logging partner scan:", error);
      throw error;
    }
  }

  /**
   * Get partner dashboard statistics
   */
  async getPartnerDashboardStats(partnerId: string): Promise<DashboardStats> {
    try {
      const today = new Date().toISOString().split("T")[0];

      // Get today's report
      const todayReportRef = doc(db, "partnerReports", `${partnerId}_${today}`);
      const todayReportDoc = await getDoc(todayReportRef);

      // Get partner analytics profile
      const profileRef = doc(db, "partnerAnalyticsProfiles", partnerId);
      const profileDoc = await getDoc(profileRef);

      const todayData = todayReportDoc.exists()
        ? (todayReportDoc.data() as PartnerDailyReport)
        : null;
      const profileData = profileDoc.exists()
        ? (profileDoc.data() as PartnerAnalyticsProfile)
        : null;

      // Calculate peak hour from today's data
      let peakHour = "N/A";
      if (todayData?.hourlyDistribution) {
        const hours = Object.entries(todayData.hourlyDistribution);
        if (hours.length > 0) {
          const peakHourEntry = hours.reduce((max, current) =>
            current[1] > max[1] ? current : max
          );
          const hour = parseInt(peakHourEntry[0].replace("hour_", ""));
          peakHour = `${hour.toString().padStart(2, "0")}:00`;
        }
      }

      // Calculate average earnings per day (simplified calculation)
      let averageEarningsPerDay = 0;
      if (profileData && profileData.totalEarnings > 0) {
        // Simple calculation based on total earnings and days since first scan
        const daysSinceFirst = profileData.firstScanAt
          ? Math.max(
              1,
              Math.ceil(
                (Date.now() - profileData.firstScanAt.toMillis()) /
                  (1000 * 60 * 60 * 24)
              )
            )
          : 1;
        averageEarningsPerDay = profileData.totalEarnings / daysSinceFirst;
      }

      return {
        todayScans: todayData?.scansCount || 0,
        todayEarnings: todayData?.totalEarningsRON || 0,
        todayUniqueCustomers: todayData?.uniqueCustomers?.length || 0,
        totalEarnings: profileData?.totalEarnings || 0,
        totalScans: profileData?.totalScans || 0,
        totalBeansProcessed: profileData?.totalBeansProcessed || 0,
        averageEarningsPerDay,
        peakHour,
        lastScanAt: profileData?.lastScanAt,
      };
    } catch (error) {
      console.error("Error getting partner dashboard stats:", error);
      throw error;
    }
  }

  /**
   * Get partner reports data for a specific date range
   */
  async getPartnerReportsData(
    partnerId: string,
    daysBack: number = 7
  ): Promise<ReportsData> {
    try {
      const endDate = new Date();
      const endDateStr = endDate.toISOString().split("T")[0];

      let startDateStr: string;
      if (daysBack === -1) {
        // All time - use a very early date
        startDateStr = "2020-01-01";
      } else {
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - daysBack);
        startDateStr = startDate.toISOString().split("T")[0];
      }

      // Get daily reports for the date range (simplified query to avoid index)
      const reportsQuery = query(
        collection(db, "partnerReports"),
        where("partnerId", "==", partnerId)
      );

      const reportsSnapshot = await getDocs(reportsQuery);
      const dailyReports: PartnerDailyReport[] = [];

      let totalScans = 0;
      let totalEarnings = 0;
      let totalBeansUsed = 0;
      const allUniqueCustomers = new Set<string>();
      let peakHourCounts: { [hour: string]: number } = {};

      reportsSnapshot.forEach((doc) => {
        const report = { id: doc.id, ...doc.data() } as PartnerDailyReport;

        // Client-side filtering for date range
        if (report.date >= startDateStr && report.date <= endDateStr) {
          dailyReports.push(report);

          totalScans += report.scansCount;
          totalEarnings += report.totalEarningsRON;
          totalBeansUsed += report.totalBeansUsed;

          // Collect unique customers
          report.uniqueCustomers.forEach((customerId) =>
            allUniqueCustomers.add(customerId)
          );

          // Aggregate hourly distribution
          Object.entries(report.hourlyDistribution).forEach(([hour, count]) => {
            peakHourCounts[hour] = (peakHourCounts[hour] || 0) + count;
          });
        }
      });

      // Sort the results by date
      dailyReports.sort((a, b) => a.date.localeCompare(b.date));

      // Calculate peak hour
      let peakHour = "N/A";
      if (Object.keys(peakHourCounts).length > 0) {
        const peakHourEntry = Object.entries(peakHourCounts).reduce(
          (max, current) => (current[1] > max[1] ? current : max)
        );
        const hour = parseInt(peakHourEntry[0].replace("hour_", ""));
        peakHour = `${hour.toString().padStart(2, "0")}:00`;
      }

      const averageScansPerDay =
        dailyReports.length > 0 ? totalScans / dailyReports.length : 0;
      const averageEarningsPerDay =
        dailyReports.length > 0 ? totalEarnings / dailyReports.length : 0;

      return {
        dailyReports,
        totalScans,
        totalEarnings,
        totalBeansUsed,
        uniqueCustomers: allUniqueCustomers.size,
        peakHour,
        averageScansPerDay,
        averageEarningsPerDay,
      };
    } catch (error) {
      console.error("Error getting partner reports data:", error);
      throw error;
    }
  }

  /**
   * Get partner transactions for detailed view
   */
  async getPartnerTransactions(
    partnerId: string,
    limitCount: number = 50
  ): Promise<PartnerTransaction[]> {
    try {
      const transactionsQuery = query(
        collection(db, "transactions"),
        where("partnerId", "==", partnerId),
        orderBy("scannedAt", "desc"),
        limit(limitCount)
      );

      const transactionsSnapshot = await getDocs(transactionsQuery);
      const transactions: PartnerTransaction[] = [];

      transactionsSnapshot.forEach((doc) => {
        transactions.push({ id: doc.id, ...doc.data() } as PartnerTransaction);
      });

      return transactions;
    } catch (error) {
      console.error("Error getting partner transactions:", error);
      throw error;
    }
  }

  /**
   * Get admin-level global statistics
   */
  async getGlobalStats(): Promise<{
    totalPartners: number;
    totalScansToday: number;
    totalEarningsToday: number;
    totalScansAllTime: number;
    totalEarningsAllTime: number;
  }> {
    try {
      const today = new Date().toISOString().split("T")[0];

      // Get today's reports
      const todayReportsQuery = query(
        collection(db, "partnerReports"),
        where("date", "==", today)
      );

      const todayReportsSnapshot = await getDocs(todayReportsQuery);
      let totalScansToday = 0;
      let totalEarningsToday = 0;

      todayReportsSnapshot.forEach((doc) => {
        const data = doc.data();
        totalScansToday += data.scansCount || 0;
        totalEarningsToday += data.totalEarningsRON || 0;
      });

      // Get all-time stats from partner profiles
      const profilesSnapshot = await getDocs(
        collection(db, "partnerAnalyticsProfiles")
      );
      let totalScansAllTime = 0;
      let totalEarningsAllTime = 0;

      profilesSnapshot.forEach((doc) => {
        const data = doc.data();
        totalScansAllTime += data.totalScans || 0;
        totalEarningsAllTime += data.totalEarnings || 0;
      });

      return {
        totalPartners: profilesSnapshot.size,
        totalScansToday,
        totalEarningsToday,
        totalScansAllTime,
        totalEarningsAllTime,
      };
    } catch (error) {
      console.error("Error getting global stats:", error);
      throw error;
    }
  }
}

export const partnerAnalyticsService = new PartnerAnalyticsService();
export default partnerAnalyticsService;
