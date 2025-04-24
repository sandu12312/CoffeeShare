import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { useLanguage } from "../../context/LanguageContext"; // Adjust path as needed
import ScreenWrapper from "../../components/ScreenWrapper"; // Assuming you have this
import { Ionicons } from "@expo/vector-icons"; // Import Ionicons
import { useRouter } from "expo-router"; // Import useRouter

const { width } = Dimensions.get("window");
const CARD_WIDTH = width / 2 - 30; // Calculate card width for 2 columns

export default function CoffeePartnerDashboard() {
  const { t } = useLanguage();
  const router = useRouter(); // Initialize router

  // Dummy data for now
  const dailyStats = {
    coffeesServed: 25,
    revenue: 150.75,
    newCustomers: 3,
  };

  const handleScanQR = () => {
    // Navigate to QR Scanner screen
    router.push("/(mainCoffeePartners)/scanner");
    // console.log("Navigate to Scan QR"); // Keep for debugging if needed
  };

  const handleViewReports = () => {
    // Navigate to Reports screen
    router.push("/(mainCoffeePartners)/reports");
    // console.log("Navigate to Reports");
  };

  const handleManageProducts = () => {
    // Navigate to Manage Products screen
    router.push("/(mainCoffeePartners)/products");
    // console.log("Navigate to Manage Products");
  };

  const handleSettings = () => {
    // Navigate to Cafe Settings screen
    router.push("/(mainCoffeePartners)/settings");
    // console.log("Navigate to Settings");
  };

  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <View style={styles.headerContainer}>
          <Text style={styles.title}>{t("dashboard")}</Text>
          {/* TODO: Add Cafe Name dynamically */}
          <Text style={styles.subtitle}>Bine ai venit, [Nume Cafenea]!</Text>
        </View>

        {/* Quick Stats Section */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="cafe-outline" size={30} color="#8B4513" />
            <Text style={styles.statValue}>{dailyStats.coffeesServed}</Text>
            {/* TODO: Add translation key 'coffeesServedToday' */}
            <Text style={styles.statLabel}>Cafele servite azi</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="cash-outline" size={30} color="#4CAF50" />
            <Text style={styles.statValue}>
              ${dailyStats.revenue.toFixed(2)}
            </Text>
            {/* TODO: Add translation key 'estimatedRevenue' */}
            <Text style={styles.statLabel}>Încasări estimate</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="person-add-outline" size={30} color="#2196F3" />
            <Text style={styles.statValue}>{dailyStats.newCustomers}</Text>
            {/* TODO: Add translation key 'newCustomersToday' */}
            <Text style={styles.statLabel}>Clienți noi azi</Text>
          </View>
        </View>

        {/* Quick Actions Section */}
        <Text style={styles.sectionTitle}>Acțiuni Rapide</Text>
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.actionButton} onPress={handleScanQR}>
            <Ionicons name="qr-code-outline" size={24} color="#FFFFFF" />
            {/* TODO: Add translation key 'scanQRAction' */}
            <Text style={styles.actionButtonText}>Scanează QR</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleViewReports}
          >
            <Ionicons name="analytics-outline" size={24} color="#FFFFFF" />
            {/* TODO: Add translation key 'viewReportsAction' */}
            <Text style={styles.actionButtonText}>Vezi Rapoarte</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleManageProducts}
          >
            <Ionicons name="list-outline" size={24} color="#FFFFFF" />
            {/* TODO: Add translation key 'manageProductsAction' */}
            <Text style={styles.actionButtonText}>Gestionează Produse</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleSettings}
          >
            <Ionicons name="settings-outline" size={24} color="#FFFFFF" />
            {/* TODO: Add translation key 'cafeSettingsAction' */}
            <Text style={styles.actionButtonText}>Setări Cafenea</Text>
          </TouchableOpacity>
        </View>

        {/* TODO: Add Notifications Section */}
        {/* TODO: Add Recent Activity Section */}
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scrollViewContent: {
    paddingBottom: 80, // Ensure space for potential bottom nav bar
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
    backgroundColor: "#f8f8f8", // Slightly different background
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#321E0E", // Dark brown color
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: "row",
    flexWrap: "wrap", // Allow cards to wrap to the next line
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
    minHeight: 120, // Ensure cards have a minimum height
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
    paddingHorizontal: 10, // Adjust padding to align with stats cards
  },
  actionButton: {
    backgroundColor: "#8B4513", // Main brown color
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
    width: CARD_WIDTH, // Use the same width as stat cards
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
  // Add more styles as needed
});
