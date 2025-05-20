import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  DocumentData,
  Timestamp,
} from "firebase/firestore";
import { db } from "../config/firebase";

export interface DailyStats {
  date: string;
  coffeesServed: number;
  revenue: number;
  newCustomers: number;
  uniqueCustomers: string[] | number;
}

export interface WeeklySummary {
  startDate: string;
  endDate: string;
  coffeesServed: number;
  revenue: number;
  newCustomers: number;
  uniqueCustomerCount: number;
  updatedAt: Timestamp;
}

export interface MonthlySummary {
  yearMonth: string;
  totalCoffees: number;
  totalRevenue: number;
  totalNewCustomers: number;
  uniqueCustomerCount: string[] | number;
}

export interface HourlyDistribution {
  [key: string]: number; // hour_0, hour_1, etc.
}

export interface PartnerDetails {
  id: string;
  name: string;
  email: string;
  associatedCafeId: string;
  createdAt: Timestamp;
}

class PartnerAnalyticsService {
  /**
   * Get partner details including associated cafe ID
   * @param partnerId The partner ID
   */
  async getPartnerDetails(partnerId: string): Promise<PartnerDetails | null> {
    try {
      const partnerDoc = await getDoc(doc(db, "partners", partnerId));

      if (!partnerDoc.exists()) {
        return null;
      }

      const data = partnerDoc.data();
      return {
        id: partnerDoc.id,
        name: data.name || "",
        email: data.email || "",
        associatedCafeId: data.associatedCafeId || "",
        createdAt: data.createdAt || null,
      } as PartnerDetails;
    } catch (error) {
      console.error("Error fetching partner details:", error);
      throw error;
    }
  }

  /**
   * Get the latest daily stats for a cafe
   * @param cafeId The cafe ID
   */
  async getLatestDailyStats(cafeId: string): Promise<DailyStats | null> {
    try {
      const cafeDoc = await getDoc(doc(db, "cafes", cafeId));

      if (!cafeDoc.exists()) {
        throw new Error(`Cafe with ID ${cafeId} not found`);
      }

      const cafeData = cafeDoc.data();
      return cafeData.lastDailyStats || null;
    } catch (error) {
      console.error("Error fetching latest daily stats:", error);
      throw error;
    }
  }

  /**
   * Get the weekly summary for a partner
   * @param partnerId The partner ID
   */
  async getWeeklySummary(partnerId: string): Promise<WeeklySummary | null> {
    try {
      const partnerDoc = await getDoc(doc(db, "partners", partnerId));

      if (!partnerDoc.exists()) {
        throw new Error(`Partner with ID ${partnerId} not found`);
      }

      const partnerData = partnerDoc.data();
      return partnerData.weeklySummary || null;
    } catch (error) {
      console.error("Error fetching weekly summary:", error);
      throw error;
    }
  }

  /**
   * Get the daily analytics for a specific date
   * @param partnerId The partner ID
   * @param date Date string in YYYY-MM-DD format
   */
  async getDailyAnalytics(
    partnerId: string,
    date: string
  ): Promise<DocumentData | null> {
    try {
      const analyticsDoc = await getDoc(
        doc(db, "partners", partnerId, "analytics", date)
      );

      if (!analyticsDoc.exists()) {
        return null;
      }

      return analyticsDoc.data();
    } catch (error) {
      console.error("Error fetching daily analytics:", error);
      throw error;
    }
  }

  /**
   * Get the analytics for a date range
   * @param partnerId The partner ID
   * @param startDate Start date in YYYY-MM-DD format
   * @param endDate End date in YYYY-MM-DD format
   */
  async getAnalyticsForRange(
    partnerId: string,
    startDate: string,
    endDate: string
  ): Promise<DocumentData[]> {
    try {
      const analyticsQuery = query(
        collection(db, "partners", partnerId, "analytics"),
        where("date", ">=", startDate),
        where("date", "<=", endDate),
        orderBy("date", "asc")
      );

      const querySnapshot = await getDocs(analyticsQuery);
      return querySnapshot.docs.map((doc) => doc.data());
    } catch (error) {
      console.error("Error fetching analytics for range:", error);
      throw error;
    }
  }

  /**
   * Get monthly summary
   * @param partnerId The partner ID
   * @param yearMonth Year-month in YYYY-MM format
   */
  async getMonthlySummary(
    partnerId: string,
    yearMonth: string
  ): Promise<MonthlySummary | null> {
    try {
      const summaryDoc = await getDoc(
        doc(db, "partners", partnerId, "monthlySummary", yearMonth)
      );

      if (!summaryDoc.exists()) {
        return null;
      }

      return summaryDoc.data() as MonthlySummary;
    } catch (error) {
      console.error("Error fetching monthly summary:", error);
      throw error;
    }
  }

  /**
   * Get the most recent analytics documents
   * @param partnerId The partner ID
   * @param count Number of documents to retrieve
   */
  async getRecentAnalytics(
    partnerId: string,
    count: number = 7
  ): Promise<DocumentData[]> {
    try {
      const analyticsQuery = query(
        collection(db, "partners", partnerId, "analytics"),
        orderBy("date", "desc"),
        limit(count)
      );

      const querySnapshot = await getDocs(analyticsQuery);
      const results = querySnapshot.docs.map((doc) => doc.data());

      // Sort in ascending order by date
      return results.sort((a, b) => a.date.localeCompare(b.date));
    } catch (error) {
      console.error("Error fetching recent analytics:", error);
      throw error;
    }
  }

  /**
   * Calculate the peak hour for a specific date
   * @param partnerId The partner ID
   * @param date Date string in YYYY-MM-DD format
   */
  async getPeakHour(partnerId: string, date: string): Promise<string | null> {
    try {
      const analyticsDoc = await getDoc(
        doc(db, "partners", partnerId, "analytics", date)
      );

      if (!analyticsDoc.exists()) {
        return null;
      }

      const data = analyticsDoc.data();
      const hourlyData: HourlyDistribution = {};

      // Extract hourly distribution
      Object.keys(data).forEach((key) => {
        if (key.startsWith("hour_")) {
          const hourNum = parseInt(key.replace("hour_", ""));
          hourlyData[key] = data[key] || 0;
        }
      });

      if (Object.keys(hourlyData).length === 0) {
        return null;
      }

      // Find the hour with the maximum value
      let maxHour = 0;
      let maxCount = 0;

      Object.keys(hourlyData).forEach((hourKey) => {
        const count = hourlyData[hourKey];
        const hour = parseInt(hourKey.replace("hour_", ""));

        if (count > maxCount) {
          maxCount = count;
          maxHour = hour;
        }
      });

      // Format hour for display
      const displayHour = maxHour.toString().padStart(2, "0");
      return `${displayHour}:00 - ${(maxHour + 1)
        .toString()
        .padStart(2, "0")}:00`;
    } catch (error) {
      console.error("Error calculating peak hour:", error);
      throw error;
    }
  }
}

export default new PartnerAnalyticsService();
