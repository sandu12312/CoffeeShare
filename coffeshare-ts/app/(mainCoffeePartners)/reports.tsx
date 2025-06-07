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
  Dimensions,
} from "react-native";
import { useLanguage } from "../../context/LanguageContext";
import { useFirebase } from "../../context/FirebaseContext";
import ScreenWrapper from "../../components/ScreenWrapper";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import partnerAnalyticsService, {
  ReportsData,
  PartnerDailyReport,
} from "../../services/partnerAnalyticsService";
import * as Animatable from "react-native-animatable";
import { LinearGradient } from "expo-linear-gradient";

// Placeholder for a chart library
// import { LineChart } from 'react-native-chart-kit';

const { width } = Dimensions.get("window");

export default function ReportsScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const { user } = useFirebase();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [partnerId, setPartnerId] = useState<string>(user?.uid || "");
  const [reportData, setReportData] = useState<ReportsData | null>(null);
  const [selectedDateRange, setSelectedDateRange] = useState<number>(7);

  useEffect(() => {
    if (user) {
      loadReportData();
    }
  }, [user, selectedDateRange]);

  const loadReportData = async () => {
    try {
      setLoading(true);

      if (!user?.uid) {
        throw new Error("No user found");
      }

      setPartnerId(user.uid);

      // Initialize partner analytics profile
      await partnerAnalyticsService.initializePartnerProfile(
        user.uid,
        user.email || "",
        user.displayName || "Partner"
      );

      // Get reports data for the selected date range
      const reportsData = await partnerAnalyticsService.getPartnerReportsData(
        user.uid,
        selectedDateRange
      );

      setReportData(reportsData);
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
    if (!reportData?.dailyReports) {
      return {
        labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        datasets: [{ data: [0, 0, 0, 0, 0, 0, 0] }],
      };
    }

    // Sort data by date
    const sortedData = [...reportData.dailyReports].sort((a, b) => {
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
          data: last7Days.map((item) => item.scansCount || 0),
        },
      ],
    };
  };

  const chartData = prepareChartData();

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
          <Ionicons name="arrow-back" size={24} color="#3C2415" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("cafe.reportsAndStats")}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollViewContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#8B4513"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Date range info */}
        <Animatable.View animation="fadeInDown" duration={600}>
          <LinearGradient
            colors={["#8B4513", "#A0522D"]}
            style={styles.dateRangeContainer}
          >
            <Ionicons name="calendar-outline" size={20} color="#F5E6D3" />
            <Text style={styles.dateRangeText}>
              {`Last ${selectedDateRange} days`}
            </Text>
          </LinearGradient>
        </Animatable.View>

        {/* Key Metrics */}
        <View style={styles.metricsContainer}>
          <Animatable.View
            animation="fadeInLeft"
            delay={200}
            style={styles.metricCard}
          >
            <LinearGradient
              colors={["#FFFFFF", "#FFF8F3"]}
              style={styles.metricGradient}
            >
              <View style={styles.metricIconContainer}>
                <Ionicons name="scan-outline" size={28} color="#8B4513" />
              </View>
              <Text style={styles.metricValue}>
                {reportData?.totalScans || 0}
              </Text>
              <Text style={styles.metricLabel}>{"Total Scans"}</Text>
            </LinearGradient>
          </Animatable.View>

          <Animatable.View
            animation="fadeInRight"
            delay={300}
            style={styles.metricCard}
          >
            <LinearGradient
              colors={["#FFFFFF", "#F0F8FF"]}
              style={styles.metricGradient}
            >
              <View style={[styles.metricIconContainer, styles.blueIcon]}>
                <Ionicons name="people-outline" size={28} color="#2196F3" />
              </View>
              <Text style={[styles.metricValue, styles.blueText]}>
                {reportData?.uniqueCustomers || 0}
              </Text>
              <Text style={styles.metricLabel}>{"Unique Customers"}</Text>
            </LinearGradient>
          </Animatable.View>

          <Animatable.View
            animation="fadeInLeft"
            delay={400}
            style={styles.metricCard}
          >
            <LinearGradient
              colors={["#FFFFFF", "#FFF5E6"]}
              style={styles.metricGradient}
            >
              <View style={[styles.metricIconContainer, styles.orangeIcon]}>
                <Ionicons name="time-outline" size={28} color="#FF9800" />
              </View>
              <Text style={[styles.metricValue, styles.orangeText]}>
                {reportData?.peakHour || "N/A"}
              </Text>
              <Text style={styles.metricLabel}>{"Peak Hour"}</Text>
            </LinearGradient>
          </Animatable.View>

          <Animatable.View
            animation="fadeInRight"
            delay={500}
            style={styles.metricCard}
          >
            <LinearGradient
              colors={["#FFFFFF", "#F0FFF0"]}
              style={styles.metricGradient}
            >
              <View style={[styles.metricIconContainer, styles.greenIcon]}>
                <Ionicons
                  name="stats-chart-outline"
                  size={28}
                  color="#4CAF50"
                />
              </View>
              <Text style={[styles.metricValue, styles.greenText]}>
                {(reportData?.totalEarnings || 0).toFixed(2)} RON
              </Text>
              <Text style={styles.metricLabel}>{"Total Earnings"}</Text>
            </LinearGradient>
          </Animatable.View>
        </View>

        {/* Charts Section */}
        <Animatable.Text
          animation="fadeInLeft"
          delay={600}
          style={styles.sectionTitle}
        >
          {t("cafe.scansPerDay")}
        </Animatable.Text>

        <Animatable.View
          animation="fadeInUp"
          delay={700}
          style={styles.chartContainer}
        >
          <LinearGradient
            colors={["#FFFFFF", "#FFF8F3"]}
            style={styles.chartGradient}
          >
            <View style={styles.chartHeader}>
              <Ionicons name="bar-chart" size={24} color="#8B4513" />
              <Text style={styles.chartTitle}>
                {t("cafe.coffeeScansChart")}
              </Text>
            </View>

            {/* Chart placeholder with better visualization */}
            <View style={styles.barChartContainer}>
              {chartData.labels.map((label, index) => {
                const value = chartData.datasets[0].data[index];
                const maxValue = Math.max(...chartData.datasets[0].data, 1);
                const barHeight = (value / maxValue) * 120;

                return (
                  <Animatable.View
                    key={index}
                    animation="fadeInUp"
                    delay={800 + index * 100}
                    style={styles.barWrapper}
                  >
                    <View style={styles.barContainer}>
                      <Text style={styles.barValue}>{value}</Text>
                      <View style={[styles.bar, { height: barHeight }]}>
                        <LinearGradient
                          colors={["#8B4513", "#D2691E"]}
                          style={styles.barGradient}
                        />
                      </View>
                    </View>
                    <Text style={styles.barLabel}>{label}</Text>
                  </Animatable.View>
                );
              })}
            </View>

            <View style={styles.chartFooter}>
              <Text style={styles.chartFooterText}>
                Total: {reportData?.totalScans || 0} scans |{" "}
                {(reportData?.totalEarnings || 0).toFixed(2)} RON earned
              </Text>
            </View>
          </LinearGradient>
        </Animatable.View>

        {/* Export Button */}
        <Animatable.View animation="bounceIn" delay={1500}>
          <TouchableOpacity
            style={styles.exportButton}
            onPress={handleExportData}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={["#3C2415", "#5D3A1A"]}
              style={styles.exportButtonGradient}
            >
              <Ionicons name="download-outline" size={22} color="#FFFFFF" />
              <Text style={styles.exportButtonText}>
                {t("cafe.exportData")}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animatable.View>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5E6D3",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#8B4513",
    fontWeight: "500",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: "#F5E6D3",
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#3C2415",
  },
  scrollViewContent: {
    padding: 20,
    paddingBottom: 80,
  },
  dateRangeContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginBottom: 20,
    gap: 8,
  },
  dateRangeText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#F5E6D3",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#3C2415",
    marginBottom: 15,
    marginTop: 10,
  },
  metricsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  metricCard: {
    width: "48%",
    marginBottom: 15,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    overflow: "hidden",
  },
  metricGradient: {
    padding: 16,
    alignItems: "center",
    minHeight: 120,
    justifyContent: "center",
  },
  metricIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#FFF8F3",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  blueIcon: {
    backgroundColor: "#E3F2FD",
  },
  orangeIcon: {
    backgroundColor: "#FFF3E0",
  },
  greenIcon: {
    backgroundColor: "#E8F5E9",
  },
  metricValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#3C2415",
    marginBottom: 4,
  },
  blueText: {
    color: "#2196F3",
  },
  orangeText: {
    color: "#FF9800",
  },
  greenText: {
    color: "#4CAF50",
  },
  metricLabel: {
    fontSize: 13,
    color: "#666",
    textAlign: "center",
    fontWeight: "500",
  },
  chartContainer: {
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    overflow: "hidden",
  },
  chartGradient: {
    padding: 20,
  },
  chartHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 10,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#3C2415",
  },
  barChartContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 150,
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  barWrapper: {
    flex: 1,
    alignItems: "center",
  },
  barContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  bar: {
    width: 30,
    borderRadius: 8,
    overflow: "hidden",
    marginTop: 5,
  },
  barGradient: {
    flex: 1,
  },
  barValue: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#3C2415",
    marginBottom: 5,
  },
  barLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 8,
  },
  chartFooter: {
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    paddingTop: 15,
    alignItems: "center",
  },
  chartFooterText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  exportButton: {
    borderRadius: 16,
    marginTop: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    overflow: "hidden",
  },
  exportButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 10,
  },
  exportButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});
