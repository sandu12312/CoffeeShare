import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useLanguage } from "../../context/LanguageContext";
import ScreenWrapper from "../../components/ScreenWrapper";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import CoffeePartnerHeader from "../../components/CoffeePartnerHeader";
import globalStatisticsService, {
  GlobalStatistics,
  TrendData,
} from "../../services/globalStatisticsService";
import Toast from "react-native-toast-message";

// Placeholder pentru biblioteci de grafice
// import { LineChart, PieChart } from "react-native-chart-kit";

const { width } = Dimensions.get("window");

export default function GeneralStatisticsScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const [statistics, setStatistics] = useState<GlobalStatistics | null>(null);
  const [trendingData, setTrendingData] = useState<{
    userTrend: TrendData[];
    revenueTrend: TrendData[];
    activityTrend: TrendData[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTrendPeriod, setSelectedTrendPeriod] = useState(7);

  useEffect(() => {
    loadStatistics();
    loadTrendingData();

    // Mă abonez la actualizări în timp real
    const unsubscribe = globalStatisticsService.subscribeToGlobalStatistics(
      (stats) => {
        if (stats) {
          setStatistics(stats);
        }
      }
    );

    return unsubscribe;
  }, []);

  const loadStatistics = async () => {
    try {
      setLoading(true);
      const stats = await globalStatisticsService.getGlobalStatistics();
      setStatistics(stats);
    } catch (error) {
      console.error("Error loading statistics:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to load statistics",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadTrendingData = async () => {
    try {
      const trends = await globalStatisticsService.getTrendingData(
        selectedTrendPeriod
      );
      setTrendingData(trends);
    } catch (error) {
      console.error("Error loading trending data:", error);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      const refreshedStats = await globalStatisticsService.refreshStatistics();
      setStatistics(refreshedStats);
      await loadTrendingData();
      Toast.show({
        type: "success",
        text1: "Updated",
        text2: "Statistics refreshed successfully",
      });
    } catch (error) {
      console.error("Error refreshing statistics:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to refresh statistics",
      });
    } finally {
      setRefreshing(false);
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M";
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num.toString();
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("ro-RO", {
      style: "currency",
      currency: "RON",
    }).format(amount);
  };

  const getGrowthColor = (rate: number): string => {
    if (rate > 0) return "#4CAF50";
    if (rate < 0) return "#F44336";
    return "#666";
  };

  const getGrowthIcon = (
    rate: number
  ): "trending-up" | "trending-down" | "remove" => {
    if (rate > 0) return "trending-up";
    if (rate < 0) return "trending-down";
    return "remove";
  };

  if (loading && !statistics) {
    return (
      <ScreenWrapper>
        <CoffeePartnerHeader title="Statistici Generale" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B4513" />
          <Text style={styles.loadingText}>Se încarcă statisticile...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  if (!statistics) {
    return (
      <ScreenWrapper>
        <CoffeePartnerHeader title="Statistici Generale" />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#F44336" />
          <Text style={styles.errorTitle}>
            Nu s-au putut încărca statisticile
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadStatistics}>
            <Text style={styles.retryButtonText}>Încearcă din nou</Text>
          </TouchableOpacity>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <CoffeePartnerHeader title={"Statistici Generale"} />

      <ScrollView
        contentContainerStyle={styles.scrollViewContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Selector pentru perioada de timp - pe viitor */}
        <Text style={styles.dateRangeText}>Perioada: Ultimele 30 de zile</Text>

        {/* Last Updated Info */}
        <View style={styles.lastUpdatedContainer}>
          <Ionicons name="time-outline" size={16} color="#666" />
          <Text style={styles.lastUpdatedText}>
            Ultima actualizare:{" "}
            {statistics.lastUpdated?.toDate?.()?.toLocaleString("ro-RO") ||
              "Nu se știe"}
          </Text>
          <TouchableOpacity
            onPress={handleRefresh}
            style={styles.refreshButton}
          >
            <Ionicons
              name="refresh"
              size={20}
              color="#8B4513"
              style={{
                transform: [{ rotate: refreshing ? "180deg" : "0deg" }],
              }}
            />
          </TouchableOpacity>
        </View>

        {/* Key Metrics Grid */}
        <View style={styles.metricsGrid}>
          {/* Users */}
          <View style={styles.metricCard}>
            <Ionicons name="people-circle-outline" size={30} color="#3F51B5" />
            <Text style={styles.metricValue}>
              {formatNumber(statistics.totalUsers)}
            </Text>
            <Text style={styles.metricLabel}>Total Utilizatori</Text>
            <View style={styles.subMetric}>
              <Text style={styles.subMetricText}>
                {statistics.activeUsers} activi
              </Text>
              <View
                style={[
                  styles.growthBadge,
                  {
                    backgroundColor: getGrowthColor(statistics.userGrowthRate),
                  },
                ]}
              >
                <Ionicons
                  name={getGrowthIcon(statistics.userGrowthRate)}
                  size={12}
                  color="white"
                />
                <Text style={styles.growthText}>
                  {statistics.userGrowthRate.toFixed(1)}%
                </Text>
              </View>
            </View>
          </View>

          {/* Cafes */}
          <View style={styles.metricCard}>
            <Ionicons name="storefront-outline" size={30} color="#009688" />
            <Text style={styles.metricValue}>
              {formatNumber(statistics.totalCafes)}
            </Text>
            <Text style={styles.metricLabel}>Cafenele</Text>
            <View style={styles.subMetric}>
              <Text style={styles.subMetricText}>
                {statistics.activeCafes} active
              </Text>
              {statistics.pendingCafes > 0 && (
                <Text style={styles.pendingText}>
                  {statistics.pendingCafes} în așteptare
                </Text>
              )}
            </View>
          </View>

          {/* Subscriptions */}
          <View style={styles.metricCard}>
            <Ionicons name="card-outline" size={30} color="#FF9800" />
            <Text style={styles.metricValue}>
              {formatNumber(statistics.activeSubscriptions)}
            </Text>
            <Text style={styles.metricLabel}>Abonamente Active</Text>
            <View style={styles.subMetric}>
              <Text style={styles.revenueText}>
                {formatCurrency(statistics.subscriptionRevenue)}
              </Text>
            </View>
          </View>

          {/* Coffee Redemptions */}
          <View style={styles.metricCard}>
            <Ionicons name="cafe-outline" size={30} color="#8B4513" />
            <Text style={styles.metricValue}>
              {formatNumber(statistics.coffeesRedeemedToday)}
            </Text>
            <Text style={styles.metricLabel}>Cafele Azi</Text>
            <View style={styles.subMetric}>
              <Text style={styles.subMetricText}>
                Total: {formatNumber(statistics.totalCoffeesRedeemed)}
              </Text>
            </View>
          </View>
        </View>

        {/* Revenue Section */}
        <View style={styles.revenueSection}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="trending-up" size={20} color="#8B4513" /> Venituri
          </Text>
          <View style={styles.revenueGrid}>
            <View style={styles.revenueCard}>
              <Text style={styles.revenueLabel}>Astăzi</Text>
              <Text style={styles.revenueValue}>
                {formatCurrency(statistics.revenueToday)}
              </Text>
            </View>
            <View style={styles.revenueCard}>
              <Text style={styles.revenueLabel}>Această săptămână</Text>
              <Text style={styles.revenueValue}>
                {formatCurrency(statistics.revenueThisWeek)}
              </Text>
            </View>
            <View style={styles.revenueCard}>
              <Text style={styles.revenueLabel}>Această lună</Text>
              <Text style={styles.revenueValue}>
                {formatCurrency(statistics.revenueThisMonth)}
              </Text>
            </View>
            <View style={styles.revenueCard}>
              <Text style={styles.revenueLabel}>Total</Text>
              <Text style={[styles.revenueValue, styles.totalRevenue]}>
                {formatCurrency(statistics.totalRevenue)}
              </Text>
              <View
                style={[
                  styles.growthBadge,
                  {
                    backgroundColor: getGrowthColor(
                      statistics.revenueGrowthRate
                    ),
                  },
                ]}
              >
                <Ionicons
                  name={getGrowthIcon(statistics.revenueGrowthRate)}
                  size={12}
                  color="white"
                />
                <Text style={styles.growthText}>
                  {statistics.revenueGrowthRate.toFixed(1)}%
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Activity Section */}
        <View style={styles.activitySection}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="pulse" size={20} color="#8B4513" /> Activitate
          </Text>
          <View style={styles.activityGrid}>
            <View style={styles.activityCard}>
              <Ionicons name="qr-code-outline" size={24} color="#9C27B0" />
              <Text style={styles.activityValue}>
                {statistics.qrScansToday}
              </Text>
              <Text style={styles.activityLabel}>QR Scanuri Astăzi</Text>
            </View>
            <View style={styles.activityCard}>
              <Ionicons name="cart-outline" size={24} color="#FF5722" />
              <Text style={styles.activityValue}>
                {statistics.activeCartsCount}
              </Text>
              <Text style={styles.activityLabel}>Coșuri Active</Text>
            </View>
            <View style={styles.activityCard}>
              <Ionicons name="people-outline" size={24} color="#607D8B" />
              <Text style={styles.activityValue}>
                {statistics.newUsersThisWeek}
              </Text>
              <Text style={styles.activityLabel}>Utilizatori Noi (7 zile)</Text>
            </View>
            <View style={styles.activityCard}>
              <Ionicons name="restaurant-outline" size={24} color="#795548" />
              <Text style={styles.activityValue}>
                {statistics.totalProducts}
              </Text>
              <Text style={styles.activityLabel}>Total Produse</Text>
            </View>
          </View>
        </View>

        {/* Trending Data Charts Placeholder */}
        {trendingData && (
          <View style={styles.chartSection}>
            <Text style={styles.sectionTitle}>
              Tendințe (Ultimele {selectedTrendPeriod} zile)
            </Text>

            {/* Period Selector */}
            <View style={styles.periodSelector}>
              {[7, 14, 30].map((period) => (
                <TouchableOpacity
                  key={period}
                  style={[
                    styles.periodButton,
                    selectedTrendPeriod === period && styles.periodButtonActive,
                  ]}
                  onPress={() => {
                    setSelectedTrendPeriod(period);
                    loadTrendingData();
                  }}
                >
                  <Text
                    style={[
                      styles.periodButtonText,
                      selectedTrendPeriod === period &&
                        styles.periodButtonTextActive,
                    ]}
                  >
                    {period} zile
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.chartPlaceholder}>
              <Ionicons name="bar-chart-outline" size={50} color="#CCC" />
              <Text style={styles.placeholderText}>Grafice în dezvoltare</Text>
              <Text style={styles.chartDataText}>
                Utilizatori noi:{" "}
                {trendingData.userTrend.reduce(
                  (sum, item) => sum + item.value,
                  0
                )}
              </Text>
              <Text style={styles.chartDataText}>
                Venituri:{" "}
                {formatCurrency(
                  trendingData.revenueTrend.reduce(
                    (sum, item) => sum + item.value,
                    0
                  )
                )}
              </Text>
              <Text style={styles.chartDataText}>
                Cafele:{" "}
                {trendingData.activityTrend.reduce(
                  (sum, item) => sum + item.value,
                  0
                )}
              </Text>
            </View>
          </View>
        )}

        {/* Partners Section */}
        <View style={styles.partnersSection}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="business" size={20} color="#8B4513" /> Parteneri
          </Text>
          <View style={styles.partnersGrid}>
            <View style={styles.partnerCard}>
              <Text style={styles.partnerValue}>
                {statistics.totalPartners}
              </Text>
              <Text style={styles.partnerLabel}>Total Parteneri</Text>
            </View>
            <View style={styles.partnerCard}>
              <Text style={[styles.partnerValue, { color: "#4CAF50" }]}>
                {statistics.activePartners}
              </Text>
              <Text style={styles.partnerLabel}>Activi</Text>
            </View>
            <View style={styles.partnerCard}>
              <Text style={[styles.partnerValue, { color: "#FF9800" }]}>
                {statistics.pendingPartners}
              </Text>
              <Text style={styles.partnerLabel}>În așteptare</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

// Stiluri actualizate
const styles = StyleSheet.create({
  scrollViewContent: {
    padding: 15,
    paddingBottom: 40,
  },
  dateRangeText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
    fontStyle: "italic",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: "#666",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginTop: 15,
    textAlign: "center",
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: "#8B4513",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "white",
    fontWeight: "600",
  },
  lastUpdatedContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    padding: 10,
    backgroundColor: "#f8f4f0",
    borderRadius: 8,
  },
  lastUpdatedText: {
    fontSize: 12,
    color: "#666",
    marginLeft: 5,
    flex: 1,
  },
  refreshButton: {
    padding: 5,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
    marginBottom: 20,
  },
  metricCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 15,
    alignItems: "center",
    width: "47%",
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minHeight: 140,
    justifyContent: "center",
  },
  metricValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginTop: 8,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 13,
    color: "#666",
    textAlign: "center",
    marginBottom: 8,
  },
  subMetric: {
    alignItems: "center",
  },
  subMetricText: {
    fontSize: 11,
    color: "#888",
    marginBottom: 4,
  },
  pendingText: {
    fontSize: 10,
    color: "#FF9800",
    fontWeight: "500",
  },
  revenueText: {
    fontSize: 11,
    color: "#4CAF50",
    fontWeight: "600",
  },
  growthBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 4,
  },
  growthText: {
    fontSize: 10,
    color: "white",
    fontWeight: "600",
    marginLeft: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#321E0E",
    marginBottom: 15,
    flexDirection: "row",
    alignItems: "center",
  },
  revenueSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  revenueGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  revenueCard: {
    width: "48%",
    padding: 15,
    backgroundColor: "#f8f4f0",
    borderRadius: 10,
    marginBottom: 10,
    alignItems: "center",
  },
  revenueLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 5,
    textAlign: "center",
  },
  revenueValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#8B4513",
  },
  totalRevenue: {
    fontSize: 18,
    color: "#4CAF50",
  },
  activitySection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activityGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  activityCard: {
    width: "48%",
    padding: 15,
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
    marginBottom: 10,
    alignItems: "center",
  },
  activityValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginTop: 8,
    marginBottom: 4,
  },
  activityLabel: {
    fontSize: 11,
    color: "#666",
    textAlign: "center",
  },
  chartSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  periodSelector: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 20,
  },
  periodButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 5,
    backgroundColor: "#f0f0f0",
  },
  periodButtonActive: {
    backgroundColor: "#8B4513",
  },
  periodButtonText: {
    fontSize: 12,
    color: "#666",
  },
  periodButtonTextActive: {
    color: "white",
    fontWeight: "600",
  },
  chartPlaceholder: {
    backgroundColor: "#F5F5F5",
    borderRadius: 10,
    height: 200,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EEE",
  },
  placeholderText: {
    color: "#AAA",
    marginTop: 10,
    fontSize: 14,
  },
  chartDataText: {
    fontSize: 12,
    color: "#666",
    marginTop: 5,
  },
  partnersSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  partnersGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  partnerCard: {
    alignItems: "center",
    flex: 1,
  },
  partnerValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#8B4513",
    marginBottom: 5,
  },
  partnerLabel: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
});
// --------------
