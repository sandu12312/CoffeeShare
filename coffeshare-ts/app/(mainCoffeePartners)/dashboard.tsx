import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Platform,
} from "react-native";
import { useLanguage } from "../../context/LanguageContext";
import { useFirebase } from "../../context/FirebaseContext";
import ScreenWrapper from "../../components/ScreenWrapper";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import partnerAnalyticsService, {
  DailyStats,
} from "../../services/partnerAnalyticsService";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../config/firebase";
import * as Animatable from "react-native-animatable";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width / 2 - 30;

export default function CoffeePartnerDashboard() {
  const { t } = useLanguage();
  const router = useRouter();
  const { user } = useFirebase();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cafeName, setCafeName] = useState<string>("");
  const [cafeId, setCafeId] = useState<string>("");
  const [partnerId, setPartnerId] = useState<string>(user?.uid || "");
  const [dailyStats, setDailyStats] = useState<DailyStats | null>(null);

  useEffect(() => {
    loadPartnerData();
  }, [user]);

  const loadPartnerData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Find the partner's cafe
      const partnerDoc = await getDoc(doc(db, "partners", user.uid));
      if (!partnerDoc.exists()) {
        console.error("Partner document not found");
        return;
      }

      const partnerData = partnerDoc.data();
      const associatedCafeId = partnerData.associatedCafeId || "";

      if (!associatedCafeId) {
        console.error("No associated cafe found for this partner");
        return;
      }

      setCafeId(associatedCafeId);
      setPartnerId(user.uid);

      // Load cafe details
      const cafeDoc = await getDoc(doc(db, "cafes", associatedCafeId));
      if (cafeDoc.exists()) {
        const cafeData = cafeDoc.data();
        setCafeName(cafeData.name || "Your Cafe");

        // Use last daily stats if available
        if (cafeData.lastDailyStats) {
          setDailyStats(cafeData.lastDailyStats);
        } else {
          // Fallback - get latest stats
          const stats = await partnerAnalyticsService.getLatestDailyStats(
            associatedCafeId
          );
          setDailyStats(stats);
        }
      }
    } catch (error) {
      console.error("Error loading partner data:", error);
      Alert.alert("Error", "Failed to load dashboard data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadPartnerData();
  };

  const handleScanQR = () => {
    router.push("/(mainCoffeePartners)/scanner");
  };

  const handleViewReports = () => {
    router.push("/(mainCoffeePartners)/reports");
  };

  const handleManageProducts = () => {
    router.push("/(mainCoffeePartners)/products");
  };

  const handleSettings = () => {
    router.push("/(mainCoffeePartners)/settings");
  };

  // Create current date for testing if no data available
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B4513" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
        {/* Header */}
        <View style={styles.headerContainer}>
          <LinearGradient
            colors={["#8B4513", "#A0522D"]}
            style={styles.headerGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="cafe" size={32} color="#F5E6D3" />
            <Text style={styles.title}>{t("dashboard")}</Text>
            <Text style={styles.subtitle}>
              {t("cafe.welcomeMessage", { name: cafeName })}
            </Text>
          </LinearGradient>
        </View>

        {/* Quick Stats Section */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, styles.statCardElevated]}>
            <Ionicons name="cafe-outline" size={30} color="#8B4513" />
            <Text style={styles.statValue}>
              {dailyStats?.coffeesServed || 0}
            </Text>
            <Text style={styles.statLabel}>{t("cafe.coffeesServedToday")}</Text>
          </View>

          <View style={[styles.statCard, styles.statCardElevated]}>
            <Ionicons name="cash-outline" size={30} color="#4CAF50" />
            <Text style={[styles.statValue, styles.revenueText]}>
              ${(dailyStats?.revenue || 0).toFixed(2)}
            </Text>
            <Text style={styles.statLabel}>{t("cafe.estimatedRevenue")}</Text>
          </View>

          <View style={[styles.statCard, styles.statCardElevated]}>
            <Ionicons name="person-add-outline" size={30} color="#2196F3" />
            <Text style={[styles.statValue, styles.customersText]}>
              {dailyStats?.newCustomers || 0}
            </Text>
            <Text style={styles.statLabel}>{t("cafe.newCustomersToday")}</Text>
          </View>
        </View>

        {/* Stats Date Info */}
        <View style={styles.dateInfoContainer}>
          <Text style={styles.dateInfoText}>
            {dailyStats?.date
              ? `${t("cafe.statsForDate")}: ${dailyStats.date}`
              : `${t("cafe.statsForDate")}: ${today} (${t(
                  "cafe.realTimeData"
                )})`}
          </Text>
        </View>

        {/* Quick Actions Section */}
        <Text style={styles.sectionTitle}>{t("cafe.quickActions")}</Text>

        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleScanQR}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={["#8B4513", "#A0522D"]}
              style={styles.actionButtonGradient}
            >
              <Ionicons name="qr-code-outline" size={24} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>
                {t("cafe.scanQRAction")}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleViewReports}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={["#3C2415", "#5D3A1A"]}
              style={styles.actionButtonGradient}
            >
              <Ionicons name="analytics-outline" size={24} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>
                {t("cafe.viewReportsAction")}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleManageProducts}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={["#D2691E", "#DEB887"]}
              style={styles.actionButtonGradient}
            >
              <Ionicons name="list-outline" size={24} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>
                {t("cafe.manageProductsAction")}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleSettings}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={["#704214", "#8B5A2B"]}
              style={styles.actionButtonGradient}
            >
              <Ionicons name="settings-outline" size={24} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>
                {t("cafe.cafeSettingsAction")}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5E6D3",
    paddingTop: Platform.OS === "ios" ? 50 : 30,
  },
  scrollViewContent: {
    paddingBottom: 80,
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
  headerContainer: {
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  headerGradient: {
    paddingHorizontal: 20,
    paddingVertical: 25,
    alignItems: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#F5E6D3",
    marginTop: 10,
  },
  subtitle: {
    fontSize: 18,
    color: "#FFF8F3",
    marginTop: 4,
    fontWeight: "500",
  },
  dateInfoContainer: {
    paddingHorizontal: 20,
    marginBottom: 10,
    alignItems: "center",
  },
  dateInfoText: {
    fontSize: 14,
    color: "#8B4513",
    fontStyle: "italic",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    overflow: "hidden",
  },
  statsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
    paddingHorizontal: 10,
    paddingVertical: 20,
  },
  statCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    width: CARD_WIDTH,
    minHeight: 120,
    marginBottom: 20,
    padding: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  statCardElevated: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  statValue: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#3C2415",
    marginTop: 8,
    marginBottom: 4,
  },
  revenueText: {
    color: "#4CAF50",
  },
  customersText: {
    color: "#2196F3",
  },
  statLabel: {
    fontSize: 13,
    color: "#666",
    textAlign: "center",
    fontWeight: "500",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#3C2415",
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 15,
  },
  actionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
    paddingHorizontal: 10,
  },
  actionButton: {
    borderRadius: 16,
    width: CARD_WIDTH,
    marginBottom: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  actionButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    minHeight: 60,
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "bold",
    marginLeft: 8,
  },
});
