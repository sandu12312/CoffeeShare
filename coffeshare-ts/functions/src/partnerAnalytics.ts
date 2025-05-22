import * as functions from "firebase-functions/v2";
import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";
import * as admin from "firebase-admin";

// Make sure Firebase Admin is initialized
try {
  admin.app();
} catch (e) {
  admin.initializeApp();
}

/**
 * Track coffee partner analytics when a QR code is redeemed
 * This runs after the QR code is verified and redeemed
 */
export const trackPartnerAnalytics = onDocumentUpdated(
  "qrCodes/{qrCodeId}",
  async (event) => {
    const previousValue = event.data?.before?.data();
    const newValue = event.data?.after?.data();

    // Only proceed if the QR code has been redeemed (changed from unused to used)
    if (previousValue && newValue && !previousValue.isUsed && newValue.isUsed) {
      try {
        const cafeId = newValue.cafeId;
        const userId = newValue.userId;
        const timestamp =
          newValue.redemptionTimestamp ||
          admin.firestore.FieldValue.serverTimestamp();
        const productId = newValue.productId;

        // Get the cafe data
        const cafeDoc = await admin
          .firestore()
          .collection("cafes")
          .doc(cafeId)
          .get();

        if (!cafeDoc.exists) {
          console.error(`Cafe with ID ${cafeId} not found`);
          return;
        }

        const cafeData = cafeDoc.data();
        const partnerId = cafeData?.partnerId;

        if (!partnerId) {
          console.error(`No partner ID found for cafe ${cafeId}`);
          return;
        }

        // Get product price if available
        let productPrice = 0;
        if (productId) {
          const productDoc = await admin
            .firestore()
            .collection("cafes")
            .doc(cafeId)
            .collection("products")
            .doc(productId)
            .get();

          if (productDoc.exists) {
            productPrice = productDoc.data()?.price || 0;
          }
        } else {
          // Use default coffee price if no specific product
          productPrice = cafeData?.defaultCoffeePrice || 3.5;
        }

        // Format date strings for the analytics
        const now = admin.firestore.Timestamp.now().toDate();
        const dateStr = now.toISOString().split("T")[0]; // YYYY-MM-DD
        const yearMonth = dateStr.substring(0, 7); // YYYY-MM

        // Reference to the partner's analytics document for today
        const dailyAnalyticsRef = admin
          .firestore()
          .collection("partners")
          .doc(partnerId)
          .collection("analytics")
          .doc(dateStr);

        // Check if the customer is new (first time at this cafe)
        const previousVisits = await admin
          .firestore()
          .collection("qrCodes")
          .where("cafeId", "==", cafeId)
          .where("userId", "==", userId)
          .where("isUsed", "==", true)
          .orderBy("redemptionTimestamp", "asc")
          .limit(2) // We only need 2 to check if this is the first one
          .get();

        // If we only have one document (the current one), this is a new customer
        const isNewCustomer = previousVisits.size <= 1;

        // Create or update the daily analytics
        await dailyAnalyticsRef.set(
          {
            date: dateStr,
            yearMonth: yearMonth,
            cafeId: cafeId,
            partnerId: partnerId,
            coffeesServed: admin.firestore.FieldValue.increment(1),
            revenue: admin.firestore.FieldValue.increment(productPrice),
            newCustomers: isNewCustomer
              ? admin.firestore.FieldValue.increment(1)
              : admin.firestore.FieldValue.increment(0),
            uniqueCustomers: admin.firestore.FieldValue.arrayUnion(userId),
            redemptions: admin.firestore.FieldValue.arrayUnion({
              timestamp: timestamp,
              userId: userId,
              productId: productId || "standard",
              price: productPrice,
            }),
            // Keep track of hourly distribution for peak hour analysis
            [`hourlyDistribution.hour_${now.getHours()}`]:
              admin.firestore.FieldValue.increment(1),
            lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );

        // Also update the monthly summary for long-term analytics
        const monthlyAnalyticsRef = admin
          .firestore()
          .collection("partners")
          .doc(partnerId)
          .collection("monthlySummary")
          .doc(yearMonth);

        await monthlyAnalyticsRef.set(
          {
            yearMonth: yearMonth,
            partnerId: partnerId,
            cafeId: cafeId,
            totalCoffees: admin.firestore.FieldValue.increment(1),
            totalRevenue: admin.firestore.FieldValue.increment(productPrice),
            totalNewCustomers: isNewCustomer
              ? admin.firestore.FieldValue.increment(1)
              : admin.firestore.FieldValue.increment(0),
            uniqueCustomerCount: admin.firestore.FieldValue.arrayUnion(userId),
            lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );

        console.log(
          `Successfully tracked analytics for cafe ${cafeId}, partner ${partnerId}`
        );
      } catch (error) {
        console.error("Error tracking partner analytics:", error);
      }
    }
  }
);

/**
 * Calculate and update daily, weekly, and monthly summary analytics for a partner
 * This runs on a schedule (once per day at midnight)
 */
export const calculatePartnerAnalyticsSummaries = onSchedule(
  "0 0 * * *",
  async (event) => {
    try {
      // Get all partners
      const partnersSnapshot = await admin
        .firestore()
        .collection("partners")
        .get();

      // Process each partner
      for (const partnerDoc of partnersSnapshot.docs) {
        const partnerId = partnerDoc.id;

        // Calculate date ranges
        const now = new Date();
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split("T")[0];

        // Get the last week date
        const lastWeekDate = new Date(now);
        lastWeekDate.setDate(now.getDate() - 7);
        const lastWeekStr = lastWeekDate.toISOString().split("T")[0];

        // Get yesterday's analytics to update the cafe-specific dashboard
        const yesterdayDoc = await admin
          .firestore()
          .collection("partners")
          .doc(partnerId)
          .collection("analytics")
          .doc(yesterdayStr)
          .get();

        if (yesterdayDoc.exists) {
          const yesterdayData = yesterdayDoc.data();
          const cafeId = yesterdayData?.cafeId;

          if (cafeId) {
            // Update the cafe with the latest summary
            await admin
              .firestore()
              .collection("cafes")
              .doc(cafeId)
              .update({
                lastDailyStats: {
                  date: yesterdayStr,
                  coffeesServed: yesterdayData.coffeesServed || 0,
                  revenue: yesterdayData.revenue || 0,
                  newCustomers: yesterdayData.newCustomers || 0,
                  uniqueCustomers: (yesterdayData.uniqueCustomers || []).length,
                  updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                },
              });
          }
        }

        // Calculate weekly stats
        const weeklyStats = {
          coffeesServed: 0,
          revenue: 0,
          newCustomers: 0,
          uniqueCustomers: new Set<string>(),
        };

        // Get the last 7 days analytics
        const weeklyDocs = await admin
          .firestore()
          .collection("partners")
          .doc(partnerId)
          .collection("analytics")
          .where("date", ">=", lastWeekStr)
          .where("date", "<=", yesterdayStr)
          .get();

        // Process the weekly data
        weeklyDocs.forEach((doc) => {
          const data = doc.data();
          weeklyStats.coffeesServed += data.coffeesServed || 0;
          weeklyStats.revenue += data.revenue || 0;
          weeklyStats.newCustomers += data.newCustomers || 0;

          // Add unique customers
          (data.uniqueCustomers || []).forEach((customerId: string) => {
            weeklyStats.uniqueCustomers.add(customerId);
          });
        });

        // Update the partner's dashboard with the weekly summary
        await admin
          .firestore()
          .collection("partners")
          .doc(partnerId)
          .update({
            weeklySummary: {
              startDate: lastWeekStr,
              endDate: yesterdayStr,
              coffeesServed: weeklyStats.coffeesServed,
              revenue: weeklyStats.revenue,
              newCustomers: weeklyStats.newCustomers,
              uniqueCustomerCount: weeklyStats.uniqueCustomers.size,
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            },
          });
      }

      console.log("Successfully calculated partner analytics summaries");
    } catch (error) {
      console.error("Error calculating partner analytics summaries:", error);
    }
  }
);
