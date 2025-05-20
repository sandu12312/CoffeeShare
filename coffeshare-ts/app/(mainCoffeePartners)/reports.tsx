import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { useLanguage } from "../../context/LanguageContext";
import { useFirebase } from "../../context/FirebaseContext";
import ScreenWrapper from "../../components/ScreenWrapper";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import partnerAnalyticsService from "../../services/partnerAnalyticsService";
import { DocumentData } from "firebase/firestore";

// Placeholder for a chart library
// import { LineChart } from 'react-native-chart-kit';

export default function ReportsScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const { user } = useFirebase();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [partnerId, setPartnerId] = useState<string>(user?.uid || "");
  const [cafeId, setCafeId] = useState<string>("");
  const [reportData, setReportData] = useState({
    totalScans: 0,
    uniqueCustomers: 0,
    peakHour: "",
    averageScansPerDay: 0,
  });
  const [analyticsData, setAnalyticsData] = useState<DocumentData[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");

  useEffect(() => {
    if (user) {
      loadReportData();
    }
  }, [user]);

  const loadReportData = async () => {
    try {
      setLoading(true);

      // Get the partner's associated cafe
      const partnerData = await partnerAnalyticsService.getPartnerDetails(
        user?.uid || ""
      );
      if (!partnerData) {
        throw new Error("Partner data not found");
      }

      setPartnerId(user?.uid || "");
      setCafeId(partnerData.associatedCafeId || "");

      try {
        // Get last 7 days of analytics
        const recentAnalytics =
          await partnerAnalyticsService.getRecentAnalytics(user?.uid || "", 7);
        setAnalyticsData(recentAnalytics);

        if (recentAnalytics.length > 0) {
          // Get the most recent date
          const sortedDates = recentAnalytics
            .map((item) => item.date)
            .sort((a, b) => b.localeCompare(a));

          const mostRecentDate = sortedDates[0];
          setSelectedDate(mostRecentDate);

          // Calculate totals and averages
          let totalScans = 0;
          let totalCustomers = new Set();

          recentAnalytics.forEach((item) => {
            totalScans += item.coffeesServed || 0;

            // Add unique customers
            if (Array.isArray(item.uniqueCustomers)) {
              item.uniqueCustomers.forEach((customerId: string) => {
                totalCustomers.add(customerId);
              });
            }
          });

          // Get peak hour
          const peakHour = await partnerAnalyticsService.getPeakHour(
            user?.uid || "",
            mostRecentDate
          );

          // Set report data
          setReportData({
            totalScans,
            uniqueCustomers: totalCustomers.size,
            peakHour: peakHour || "14:00 - 15:00",
            averageScansPerDay: Math.round(
              totalScans / (recentAnalytics.length || 1)
            ),
          });
        }
      } catch (error: any) {
        // Check if error is due to index building
        if (
          error.message &&
          error.message.includes("index is currently building")
        ) {
          Alert.alert(
            t("cafe.indexBuildingTitle"),
            t("cafe.indexBuildingMessage"),
            [{ text: t("common.ok") }]
          );
        } else {
          throw error; // Re-throw other errors
        }
      }
    } catch (error) {
      console.error("Error loading report data:", error);
      Alert.alert(t("common.error"), "Failed to load report data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadReportData();
  };

  // Prepare chart data from the analytics
  const prepareChartData = () => {
    // Sort data by date
    const sortedData = [...analyticsData].sort((a, b) => {
      return a.date.localeCompare(b.date);
    });

    // Get last 7 days or less
    const last7Days = sortedData.slice(-7);

    // Format for chart
    return {
      labels: last7Days.map((item) => {
        // Format date to day of week (Mon, Tue, etc)
        const date = new Date(item.date);
        return date.toLocaleDateString(undefined, { weekday: "short" });
      }),
      datasets: [
        {
          data: last7Days.map((item) => item.coffeesServed || 0),
        },
      ],
    };
  };

  const chartData =
    analyticsData.length > 0
      ? prepareChartData()
      : {
          labels: ["Lun", "Mar", "Mie", "Joi", "Vin", "Sam", "Dum"],
          datasets: [{ data: [0, 0, 0, 0, 0, 0, 0] }],
        };

  const handleExportData = () => {
    // TODO: Implement data export functionality
    Alert.alert(t("cafe.exportComingSoon"));
  };

  if (loading) {
    return (
      <ScreenWrapper>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B4513" />
          <Text style={styles.loadingText}>{t("cafe.loadingReports")}</Text>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#321E0E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("cafe.reportsAndStats")}</Text>
      </View>
      <ScrollView
        contentContainerStyle={styles.scrollViewContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Date range info */}
        <Text style={styles.sectionTitle}>
          {t("cafe.periodLastDays", { days: analyticsData.length })}
        </Text>

        {/* Key Metrics */}
        <View style={styles.metricsContainer}>
          <View style={styles.metricCard}>
            <Ionicons name="scan-outline" size={24} color="#8B4513" />
            <Text style={styles.metricValue}>{reportData.totalScans}</Text>
            <Text style={styles.metricLabel}>{t("cafe.totalScans")}</Text>
          </View>
          <View style={styles.metricCard}>
            <Ionicons name="people-outline" size={24} color="#2196F3" />
            <Text style={styles.metricValue}>{reportData.uniqueCustomers}</Text>
            <Text style={styles.metricLabel}>{t("cafe.uniqueCustomers")}</Text>
          </View>
          <View style={styles.metricCard}>
            <Ionicons name="time-outline" size={24} color="#FF9800" />
            <Text style={styles.metricValue}>{reportData.peakHour}</Text>
            <Text style={styles.metricLabel}>{t("cafe.peakHour")}</Text>
          </View>
          <View style={styles.metricCard}>
            <Ionicons name="stats-chart-outline" size={24} color="#4CAF50" />
            <Text style={styles.metricValue}>
              {reportData.averageScansPerDay}
            </Text>
            <Text style={styles.metricLabel}>{t("cafe.avgScansPerDay")}</Text>
          </View>
        </View>

        {/* Charts Section */}
        <Text style={styles.sectionTitle}>{t("cafe.scansPerDay")}</Text>
        <View style={styles.chartPlaceholder}>
          {/* <LineChart
            data={chartData}
            width={Dimensions.get('window').width - 40}
            height={220}
            yAxisSuffix=" coffees"
            yAxisInterval={1}
            chartConfig={{
              backgroundColor: "#e26a00",
              backgroundGradientFrom: "#fb8c00",
              backgroundGradientTo: "#ffa726",
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
              style: {
                borderRadius: 16
              },
              propsForDots: {
                r: "6",
                strokeWidth: "2",
                stroke: "#ffa726"
              }
            }}
            bezier
            style={{
              marginVertical: 8,
              borderRadius: 16
            }}
          /> */}
          <Ionicons name="bar-chart-outline" size={80} color="#E0E0E0" />
          <Text style={styles.placeholderText}>
            {t("cafe.coffeeScansChart")}
          </Text>

          {/* Chart values */}
          {analyticsData.length > 0 && (
            <View style={styles.chartValues}>
              {chartData.labels.map((label, index) => (
                <View key={index} style={styles.chartValueItem}>
                  <Text style={styles.chartValueDay}>{label}</Text>
                  <Text style={styles.chartValueNumber}>
                    {chartData.datasets[0].data[index]}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Export Button */}
        <TouchableOpacity
          style={styles.exportButton}
          onPress={handleExportData}
        >
          <Ionicons name="download-outline" size={20} color="#FFFFFF" />
          <Text style={styles.exportButtonText}>{t("cafe.exportData")}</Text>
        </TouchableOpacity>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#321E0E",
  },
  scrollViewContent: {
    padding: 20,
    paddingBottom: 80,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#321E0E",
    marginBottom: 15,
  },
  metricsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  metricCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 15,
    alignItems: "center",
    width: "48%",
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    minHeight: 100,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#321E0E",
    marginTop: 8,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  chartPlaceholder: {
    backgroundColor: "#F0F0F0",
    borderRadius: 10,
    minHeight: 220,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    padding: 15,
  },
  placeholderText: {
    color: "#A0A0A0",
    marginTop: 10,
    fontSize: 16,
  },
  chartValues: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 20,
    paddingHorizontal: 10,
  },
  chartValueItem: {
    alignItems: "center",
  },
  chartValueDay: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  chartValueNumber: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#321E0E",
  },
  exportButton: {
    backgroundColor: "#8B4513",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    borderRadius: 8,
    marginTop: 10,
  },
  exportButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 10,
  },
});
