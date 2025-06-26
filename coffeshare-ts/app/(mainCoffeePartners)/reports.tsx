import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  ImageBackground,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useLanguage } from "../../context/LanguageContext";
import { useFirebase } from "../../context/FirebaseContext";
import ScreenWrapper from "../../components/ScreenWrapper";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import partnerAnalyticsService, {
  ReportsData,
  PartnerDailyReport,
} from "../../services/partnerAnalyticsService";
import reportExportService from "../../services/reportExportService";
import * as Animatable from "react-native-animatable";
import { LinearGradient } from "expo-linear-gradient";
import { ErrorModal, Toast } from "../../components/ErrorComponents";
import { useErrorHandler } from "../../hooks/useErrorHandler";

// Placeholder pentru biblioteci de grafice
// import { LineChart } from 'react-native-chart-kit';

const { width } = Dimensions.get("window");

export default function ReportsScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const { user } = useFirebase();
  const { errorState, showError, showErrorModal, hideToast, hideModal } =
    useErrorHandler();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [partnerId, setPartnerId] = useState<string>(user?.uid || "");
  const [reportData, setReportData] = useState<ReportsData | null>(null);
  const [selectedDateRange, setSelectedDateRange] = useState<number>(7);

  const dateRangeOptions = [
    {
      label: "1 Day",
      sublabel: "Hours",
      value: 1,
      icon: "today-outline" as const,
    },
    {
      label: "7 Days",
      sublabel: "Daily",
      value: 7,
      icon: "calendar-outline" as const,
    },
    {
      label: "1 Month",
      sublabel: "Weekly",
      value: 28,
      icon: "calendar-number-outline" as const,
    },
    {
      label: "All Time",
      sublabel: "Monthly",
      value: -1,
      icon: "infinite-outline" as const,
    },
  ];

  const loadReportData = useCallback(async () => {
    try {
      setLoading(true);

      if (!user?.uid) {
        throw new Error("No user found");
      }

      setPartnerId(user.uid);

      // Inițializez profilul de analiză pentru partener
      await partnerAnalyticsService.initializePartnerProfile(
        user.uid,
        user.email || "",
        user.displayName || "Partner"
      );

      // Obțin datele de raportare pentru intervalul de date selectat
      const reportsData = await partnerAnalyticsService.getPartnerReportsData(
        user.uid,
        selectedDateRange
      );

      setReportData(reportsData);
    } catch (error) {
      __DEV__ && console.error("Error loading report data:", error);
      showError("Failed to load report data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.uid, selectedDateRange, showError]);

  // Adaug useFocusEffect pentru a reîmprospăta rapoartele când ecranul intră în focus
  useFocusEffect(
    useCallback(() => {
      if (user?.uid) {
        loadReportData();
      }
    }, [user?.uid, loadReportData])
  );

  useEffect(() => {
    if (user) {
      loadReportData();
    }
  }, [user, loadReportData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadReportData();
  }, [loadReportData]);

  // Pregătesc datele pentru grafic din analize cu granularități diferite
  const prepareChartData = () => {
    if (!reportData?.dailyReports || reportData.dailyReports.length === 0) {
      return {
        labels: ["No Data"],
        datasets: [{ data: [0] }],
      };
    }

    // Sortez datele după dată
    const sortedData = [...reportData.dailyReports].sort((a, b) => {
      return a.date.localeCompare(b.date);
    });

    if (selectedDateRange === 1) {
      // 1 ZI: Afișez scanările pe oră (la fiecare 3 ore pentru lizibilitate mai bună)
      const latestDay = sortedData[sortedData.length - 1];
      if (!latestDay?.hourlyDistribution) {
        return {
          labels: ["6AM", "9AM", "12PM", "3PM", "6PM", "9PM", "12AM", "3AM"],
          datasets: [{ data: Array(8).fill(0) }],
        };
      }

      // Grupez orele în intervale de 3 ore pentru lizibilitate mai bună
      const hourIntervals = [
        { label: "6AM", hours: [6, 7, 8] },
        { label: "9AM", hours: [9, 10, 11] },
        { label: "12PM", hours: [12, 13, 14] },
        { label: "3PM", hours: [15, 16, 17] },
        { label: "6PM", hours: [18, 19, 20] },
        { label: "9PM", hours: [21, 22, 23] },
        { label: "12AM", hours: [0, 1, 2] },
        { label: "3AM", hours: [3, 4, 5] },
      ];

      const intervalData = hourIntervals.map((interval) => {
        return interval.hours.reduce((sum, hour) => {
          const hourKey = `hour_${hour}`;
          return sum + (latestDay.hourlyDistribution[hourKey] || 0);
        }, 0);
      });

      return {
        labels: hourIntervals.map((interval) => interval.label),
        datasets: [{ data: intervalData }],
      };
    } else if (selectedDateRange === 7) {
      // 7 ZILE: Afișez scanările pe zi (zilele săptămânii)
      const last7Days = sortedData.slice(-7);

      return {
        labels: last7Days.map((item) => {
          const date = new Date(item.date);
          return date.toLocaleDateString(undefined, { weekday: "short" });
        }),
        datasets: [{ data: last7Days.map((item) => item.scansCount || 0) }],
      };
    } else if (selectedDateRange === 28) {
      // 1 LUNĂ: Afișez scanările pe săptămână (4 săptămâni)
      const weeklyData = [];
      const weeklyLabels = [];

      // Grupez datele pe săptămâni
      for (let weekIndex = 0; weekIndex < 4; weekIndex++) {
        const weekStart = weekIndex * 7;
        const weekEnd = Math.min(weekStart + 7, sortedData.length);
        const weekData = sortedData.slice(
          sortedData.length - 28 + weekStart,
          sortedData.length - 28 + weekEnd
        );

        const weekScans = weekData.reduce(
          (sum, day) => sum + (day.scansCount || 0),
          0
        );
        weeklyData.push(weekScans);
        weeklyLabels.push(`Week ${weekIndex + 1}`);
      }

      return {
        labels: weeklyLabels,
        datasets: [{ data: weeklyData }],
      };
    } else {
      // TOT TIMPUL: Afișez scanările pe lună
      const monthlyData: { [key: string]: number } = {};

      sortedData.forEach((item) => {
        const date = new Date(item.date);
        const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1)
          .toString()
          .padStart(2, "0")}`;
        monthlyData[monthKey] =
          (monthlyData[monthKey] || 0) + (item.scansCount || 0);
      });

      const sortedMonths = Object.keys(monthlyData).sort();
      const last12Months = sortedMonths.slice(-12); // Afișez ultimele 12 luni max pentru lizibilitate

      return {
        labels: last12Months.map((monthKey) => {
          const [year, month] = monthKey.split("-");
          const date = new Date(parseInt(year), parseInt(month) - 1);
          return date.toLocaleDateString(undefined, {
            month: "short",
            year: "2-digit",
          });
        }),
        datasets: [
          { data: last12Months.map((monthKey) => monthlyData[monthKey] || 0) },
        ],
      };
    }
  };

  const chartData = prepareChartData();

  const handleExportData = () => {
    if (!reportData || !user) {
      showError("No data available to export");
      return;
    }

    showErrorModal(
      "Export Data",
      "Choose export format:",
      { label: "Export PDF Report", onPress: () => exportPDFReport() },
      { label: "Export CSV Data", onPress: () => exportCSVData() }
    );
  };

  const exportPDFReport = async () => {
    if (!reportData || !user) return;

    const dateRangeText =
      selectedDateRange === -1
        ? "All Time"
        : selectedDateRange === 1
        ? "Last Day"
        : `Last ${selectedDateRange} Days`;

    const exportOptions = {
      partnerName: user.displayName || "Coffee Partner",
      partnerEmail: user.email || "",
      dateRange: dateRangeText,
      reportData: reportData,
      selectedDateRange: selectedDateRange,
    };

    try {
      await reportExportService.generatePDFReport(exportOptions);
    } catch (error) {
      console.error("PDF export error:", error);
    }
  };

  const exportCSVData = async () => {
    if (!reportData || !user) return;

    const dateRangeText =
      selectedDateRange === -1
        ? "All Time"
        : selectedDateRange === 1
        ? "Last Day"
        : `Last ${selectedDateRange} Days`;

    const exportOptions = {
      partnerName: user.displayName || "Coffee Partner",
      partnerEmail: user.email || "",
      dateRange: dateRangeText,
      reportData: reportData,
      selectedDateRange: selectedDateRange,
    };

    try {
      await reportExportService.exportCSVReport(exportOptions);
    } catch (error) {
      console.error("CSV export error:", error);
    }
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
      <ImageBackground
        source={require("../../assets/images/BackGroundCoffeePartners app.jpg")}
        style={styles.container}
        resizeMode="cover"
      >
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
          {/* Date Range Selector */}
          <Animatable.View animation="fadeInDown" duration={600}>
            <View style={styles.dateRangeSelectorContainer}>
              <View style={styles.selectorHeader}>
                <Ionicons name="analytics-outline" size={24} color="#8B4513" />
                <Text style={styles.dateRangeSelectorTitle}>
                  Select Time Period
                </Text>
              </View>
              <View style={styles.dateRangeButtons}>
                {dateRangeOptions.map((option, index) => {
                  const isSelected = selectedDateRange === option.value;
                  return (
                    <Animatable.View
                      key={option.value}
                      animation="fadeInUp"
                      delay={100 + index * 50}
                      style={styles.dateRangeButtonWrapper}
                    >
                      <TouchableOpacity
                        style={[
                          styles.dateRangeButton,
                          isSelected && styles.dateRangeButtonSelected,
                        ]}
                        onPress={() => setSelectedDateRange(option.value)}
                        activeOpacity={0.7}
                      >
                        <Animatable.View
                          animation={isSelected ? "pulse" : undefined}
                          duration={300}
                          style={styles.dateRangeButtonContent}
                        >
                          <LinearGradient
                            colors={
                              isSelected
                                ? ["#8B4513", "#A0522D"]
                                : ["#FFFFFF", "#F8F4F0"]
                            }
                            style={styles.dateRangeButtonGradient}
                          >
                            <View style={styles.dateRangeButtonIcon}>
                              <Ionicons
                                name={option.icon}
                                size={20}
                                color={isSelected ? "#FFFFFF" : "#8B4513"}
                              />
                            </View>
                            <Text
                              style={[
                                styles.dateRangeButtonText,
                                isSelected &&
                                  styles.dateRangeButtonTextSelected,
                              ]}
                            >
                              {option.label}
                            </Text>
                            <Text
                              style={[
                                styles.dateRangeButtonSublabel,
                                isSelected &&
                                  styles.dateRangeButtonSublabelSelected,
                              ]}
                            >
                              {option.sublabel}
                            </Text>
                          </LinearGradient>
                        </Animatable.View>
                      </TouchableOpacity>
                    </Animatable.View>
                  );
                })}
              </View>
            </View>
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
            {selectedDateRange === 1
              ? "Scans per Hour"
              : selectedDateRange === 7
              ? "Scans per Day"
              : selectedDateRange === 28
              ? "Scans per Week"
              : "Scans per Month"}
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
                  {selectedDateRange === 1
                    ? "Hourly Activity Pattern"
                    : selectedDateRange === 7
                    ? "Weekly Coffee Scans"
                    : selectedDateRange === 28
                    ? "Monthly Trends by Week"
                    : "Long-term Monthly Analysis"}
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
                  {selectedDateRange === -1
                    ? "All Time"
                    : selectedDateRange === 1
                    ? "Last Day"
                    : `Last ${selectedDateRange} Days`}
                  : {reportData?.totalScans || 0} scans |{" "}
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
                <Text style={styles.exportButtonText}>Export Report</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animatable.View>
        </ScrollView>
      </ImageBackground>

      {/* Error Components */}
      <Toast
        visible={errorState.toast.visible}
        message={errorState.toast.message}
        type={errorState.toast.type}
        onHide={hideToast}
        action={errorState.toast.action}
      />

      <ErrorModal
        visible={errorState.modal.visible}
        title={errorState.modal.title}
        message={errorState.modal.message}
        type={errorState.modal.type}
        onDismiss={hideModal}
        primaryAction={errorState.modal.primaryAction}
        secondaryAction={errorState.modal.secondaryAction}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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
  dateRangeSelectorContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  selectorHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    gap: 10,
  },
  dateRangeSelectorTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#3C2415",
  },
  dateRangeButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  dateRangeButtonWrapper: {
    flex: 1,
  },
  dateRangeButton: {
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: "hidden",
  },
  dateRangeButtonSelected: {
    shadowColor: "#8B4513",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  dateRangeButtonContent: {
    width: "100%",
  },
  dateRangeButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: "center",
    minHeight: 90,
    justifyContent: "center",
  },
  dateRangeButtonIcon: {
    marginBottom: 8,
  },
  dateRangeButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#3C2415",
    marginBottom: 4,
    textAlign: "center",
  },
  dateRangeButtonTextSelected: {
    color: "#FFFFFF",
  },
  dateRangeButtonSublabel: {
    fontSize: 11,
    fontWeight: "500",
    color: "#666",
    textAlign: "center",
  },
  dateRangeButtonSublabelSelected: {
    color: "#F5E6D3",
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
    height: 160,
    paddingHorizontal: 5,
    marginBottom: 25,
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
    width: 28,
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
    fontSize: 11,
    color: "#666",
    marginTop: 8,
    fontWeight: "600",
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
