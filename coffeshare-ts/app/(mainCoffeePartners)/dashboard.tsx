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
  Platform,
  ImageBackground,
} from "react-native";
import { useLanguage } from "../../context/LanguageContext";
import { useFirebase } from "../../context/FirebaseContext";
import ScreenWrapper from "../../components/ScreenWrapper";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import partnerAnalyticsService, {
  DashboardStats,
} from "../../services/partnerAnalyticsService";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../config/firebase";
import * as Animatable from "react-native-animatable";
import { LinearGradient } from "expo-linear-gradient";
import { ErrorModal, Toast } from "../../components/ErrorComponents";
import { useErrorHandler } from "../../hooks/useErrorHandler";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width / 2 - 30;

export default function CoffeePartnerDashboard() {
  const { t } = useLanguage();
  const router = useRouter();
  const { user } = useFirebase();
  const { errorState, showErrorModal, showError, hideModal, hideToast } =
    useErrorHandler();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cafeName, setCafeName] = useState<string>("");
  const [cafeId, setCafeId] = useState<string>("");
  const [partnerId, setPartnerId] = useState<string>(user?.uid || "");
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(
    null
  );

  useEffect(() => {
    loadPartnerData();
  }, [user]);

  const loadPartnerData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Găsesc cafeneaua partenerului
      const partnerDoc = await getDoc(doc(db, "coffeePartners", user.uid));
      if (!partnerDoc.exists()) {
        console.error(
          "Partner document not found in coffeePartners collection"
        );
        // Încerc colecția legacy partners ca fallback
        const legacyPartnerDoc = await getDoc(doc(db, "partners", user.uid));
        if (!legacyPartnerDoc.exists()) {
          console.error(
            "Partner document not found in legacy partners collection either"
          );
          return;
        }
        console.log("Using legacy partners collection");
        // Folosesc datele din documentul legacy
        const partnerData = legacyPartnerDoc.data();
        console.log(
          "Legacy partner document data:",
          JSON.stringify(partnerData, null, 2)
        );

        let associatedCafeId =
          partnerData.associatedCafeId || partnerData.cafeId || "";
        let businessName = partnerData.businessName || "Your Business";

        if (!associatedCafeId) {
          console.log(
            "No associatedCafeId found in legacy, checking if partner has business info..."
          );

          // Dacă partenerul are informații de business, îl folosesc ca cafenea
          if (partnerData.businessName) {
            console.log(
              "Legacy partner has business info, using partner as cafe"
            );
            // Folosesc ID-ul partenerului ca ID cafenea deoarece conține informațiile business-ului
            associatedCafeId = user.uid;
            businessName = partnerData.businessName;

            setCafeId(associatedCafeId);
            setCafeName(businessName);
            setPartnerId(user.uid);

            // Inițializez profilul de analiză pentru partener
            await partnerAnalyticsService.initializePartnerProfile(
              user.uid,
              user.email || "",
              user.displayName || "Partner"
            );

            // Încarc statisticile dashboard-ului
            const stats =
              await partnerAnalyticsService.getPartnerDashboardStats(user.uid);
            console.log("Dashboard stats loaded:", stats);
            setDashboardStats(stats);
            return;
          } else {
            console.error(
              "No associated cafe found and no business info in legacy partner document. Available fields:",
              Object.keys(partnerData)
            );
            showErrorModal(
              "Setup Required",
              "Your partner account needs business information. Please complete your business profile setup.",
              {
                label: "Continue Anyway",
                onPress: () => {
                  // Permit dashboard-ului să se încarce cu o configurație implicită
                  setCafeId("default");
                  setCafeName("Setup Required");
                  setPartnerId(user.uid);
                },
              }
            );
            return;
          }
        }

        setCafeId(associatedCafeId);
        setPartnerId(user.uid);

        // Încarc detaliile cafenelei (sau folosesc numele business-ului din partener dacă nu există doc separat)
        try {
          const cafeDoc = await getDoc(doc(db, "cafes", associatedCafeId));
          if (cafeDoc.exists()) {
            const cafeData = cafeDoc.data();
            setCafeName(cafeData.businessName || cafeData.name || businessName);
          } else {
            // Nu există document separat pentru cafenea, folosesc numele business-ului din partener
            console.log(
              "No legacy cafe document found, using business name from partner"
            );
            setCafeName(businessName);
          }
        } catch (error) {
          console.log(
            "Error loading legacy cafe document, using business name from partner:",
            error
          );
          setCafeName(businessName);
        }

        // Inițializez profilul de analiză pentru partener
        await partnerAnalyticsService.initializePartnerProfile(
          user.uid,
          user.email || "",
          user.displayName || "Partner"
        );

        // Încarc statisticile dashboard-ului
        const stats = await partnerAnalyticsService.getPartnerDashboardStats(
          user.uid
        );
        console.log("Dashboard stats loaded:", stats);
        setDashboardStats(stats);
        return;
      }

      const partnerData = partnerDoc.data();
      console.log(
        "Partner document data:",
        JSON.stringify(partnerData, null, 2)
      );

      // Verific dacă partenerul are associatedCafeId, altfel folosesc partenerul ca cafenea
      let associatedCafeId =
        partnerData.associatedCafeId || partnerData.cafeId || "";
      let businessName = partnerData.businessName || "Your Business";

      if (!associatedCafeId) {
        console.log(
          "No associatedCafeId found, checking if partner has business info..."
        );

        // Dacă partenerul are informații de business, îl folosesc ca cafenea
        if (partnerData.businessName) {
          console.log("Partner has business info, using partner as cafe");
          // Folosesc ID-ul partenerului ca ID cafenea deoarece conține informațiile business-ului
          associatedCafeId = user.uid;
          businessName = partnerData.businessName;

          setCafeId(associatedCafeId);
          setCafeName(businessName);
          setPartnerId(user.uid);

          // Inițializez profilul de analiză pentru partener
          await partnerAnalyticsService.initializePartnerProfile(
            user.uid,
            user.email || "",
            user.displayName || "Partner"
          );

          // Încarc statisticile dashboard-ului
          const stats = await partnerAnalyticsService.getPartnerDashboardStats(
            user.uid
          );
          console.log("Dashboard stats loaded:", stats);
          setDashboardStats(stats);
          return;
        } else {
          console.error(
            "No associated cafe found and no business info in partner document. Available fields:",
            Object.keys(partnerData)
          );
          showErrorModal(
            "Setup Required",
            "Your partner account needs business information. Please complete your business profile setup.",
            {
              label: "Continue Anyway",
              onPress: () => {
                // Permit dashboard-ului să se încarce cu o configurație implicită
                setCafeId("default");
                setCafeName("Setup Required");
                setPartnerId(user.uid);
              },
            }
          );
          return;
        }
      }

      setCafeId(associatedCafeId);
      setPartnerId(user.uid);

      // Încarc detaliile cafenelei (sau folosesc numele business-ului din partener dacă nu există doc separat)
      try {
        const cafeDoc = await getDoc(doc(db, "cafes", associatedCafeId));
        if (cafeDoc.exists()) {
          const cafeData = cafeDoc.data();
          setCafeName(cafeData.businessName || cafeData.name || businessName);
        } else {
          // Nu există document separat pentru cafenea, folosesc numele business-ului din partener
          console.log(
            "No cafe document found, using business name from partner"
          );
          setCafeName(businessName);
        }
      } catch (error) {
        console.log(
          "Error loading cafe document, using business name from partner:",
          error
        );
        setCafeName(businessName);
      }

      // Inițializez profilul de analiză pentru partener
      await partnerAnalyticsService.initializePartnerProfile(
        user.uid,
        user.email || "",
        user.displayName || "Partner"
      );

      // Încarc statisticile dashboard-ului
      const stats = await partnerAnalyticsService.getPartnerDashboardStats(
        user.uid
      );
      console.log("Dashboard stats loaded:", stats);
      setDashboardStats(stats);
    } catch (error) {
      console.error("Error loading partner data:", error);
      showError("Failed to load dashboard data");
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

  // Creez data curentă pentru testare dacă nu există date disponibile
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
    <ImageBackground
      source={require("../../assets/images/BackGroundCoffeePartners app.jpg")}
      style={styles.container}
      resizeMode="cover"
    >
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

        {/* Today's Key Metrics */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, styles.statCardElevated]}>
            <Ionicons name="cafe-outline" size={30} color="#8B4513" />
            <Text style={styles.statValue}>
              {dashboardStats?.todayScans || 0}
            </Text>
            <Text style={styles.statLabel}>{"Today's Scans"}</Text>
          </View>

          <View style={[styles.statCard, styles.statCardElevated]}>
            <Ionicons name="cash-outline" size={30} color="#4CAF50" />
            <Text style={[styles.statValue, styles.revenueText]}>
              {(dashboardStats?.todayEarnings || 0).toFixed(2)} RON
            </Text>
            <Text style={styles.statLabel}>{"Today's Earnings"}</Text>
          </View>

          <View style={[styles.statCard, styles.statCardElevated]}>
            <Ionicons name="person-add-outline" size={30} color="#2196F3" />
            <Text style={[styles.statValue, styles.customersText]}>
              {dashboardStats?.todayUniqueCustomers || 0}
            </Text>
            <Text style={styles.statLabel}>{"Unique Customers"}</Text>
          </View>
        </View>

        {/* Info Message */}
        {(!dashboardStats ||
          (dashboardStats.todayScans === 0 &&
            dashboardStats.todayEarnings === 0)) && (
          <Animatable.View animation="fadeIn" style={styles.infoCard}>
            <Ionicons
              name="information-circle-outline"
              size={24}
              color="#8B4513"
            />
            <Text style={styles.infoText}>
              Your daily stats will appear here once customers start scanning QR
              codes at your cafe.
            </Text>
          </Animatable.View>
        )}

        {/* Setup Required Message */}
        {cafeName === "Setup Required" && (
          <Animatable.View animation="fadeIn" style={styles.warningCard}>
            <Ionicons name="warning-outline" size={24} color="#FF6B6B" />
            <Text style={styles.warningText}>
              Cafe association required. Check console logs for debugging info.
            </Text>
          </Animatable.View>
        )}

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
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  infoCard: {
    backgroundColor: "#FFF8F3",
    marginHorizontal: 20,
    marginVertical: 15,
    padding: 15,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0D6C7",
  },
  infoText: {
    fontSize: 14,
    color: "#8B4513",
    marginLeft: 10,
    flex: 1,
    lineHeight: 20,
  },
  warningCard: {
    backgroundColor: "#FFF5F5",
    marginHorizontal: 20,
    marginVertical: 15,
    padding: 15,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FFB3B3",
  },
  warningText: {
    fontSize: 14,
    color: "#FF6B6B",
    marginLeft: 10,
    flex: 1,
    lineHeight: 20,
    fontWeight: "500",
  },
});
