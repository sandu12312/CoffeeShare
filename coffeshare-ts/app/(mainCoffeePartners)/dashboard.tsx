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
      <ScreenWrapper>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B4513" />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <ScrollView
        contentContainerStyle={styles.scrollViewContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.headerContainer}>
          <Text style={styles.title}>{t("dashboard")}</Text>
          <Text style={styles.subtitle}>
            {t("cafe.welcomeMessage", { name: cafeName })}
          </Text>
        </View>

        {/* Quick Stats Section */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="cafe-outline" size={30} color="#8B4513" />
            <Text style={styles.statValue}>
              {dailyStats?.coffeesServed || 0}
            </Text>
            <Text style={styles.statLabel}>{t("cafe.coffeesServedToday")}</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="cash-outline" size={30} color="#4CAF50" />
            <Text style={styles.statValue}>
              ${(dailyStats?.revenue || 0).toFixed(2)}
            </Text>
            <Text style={styles.statLabel}>{t("cafe.estimatedRevenue")}</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="person-add-outline" size={30} color="#2196F3" />
            <Text style={styles.statValue}>
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
          <TouchableOpacity style={styles.actionButton} onPress={handleScanQR}>
            <Ionicons name="qr-code-outline" size={24} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>
              {t("cafe.scanQRAction")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleViewReports}
          >
            <Ionicons name="analytics-outline" size={24} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>
              {t("cafe.viewReportsAction")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleManageProducts}
          >
            <Ionicons name="list-outline" size={24} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>
              {t("cafe.manageProductsAction")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleSettings}
          >
            <Ionicons name="settings-outline" size={24} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>
              {t("cafe.cafeSettingsAction")}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scrollViewContent: {
    paddingBottom: 80,
  },
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
  headerContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  container: {
    flex: 1,
    backgroundColor: "#f8f8f8",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#321E0E",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginTop: 4,
  },
  dateInfoContainer: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  dateInfoText: {
    fontSize: 12,
    color: "#888",
    fontStyle: "italic",
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
    borderRadius: 10,
    padding: 15,
    alignItems: "center",
    justifyContent: "center",
    width: CARD_WIDTH,
    minHeight: 120,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#321E0E",
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: "#666",
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#321E0E",
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
    backgroundColor: "#8B4513",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
    width: CARD_WIDTH,
    marginBottom: 20,
    flexDirection: "row",
    minHeight: 60,
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
    marginLeft: 8,
  },
});
