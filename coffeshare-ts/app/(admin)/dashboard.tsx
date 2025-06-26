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
// Folosesc componenta de administrare utilizatori
import UserManagementBox from "../../components/UserManagementBox";
import CoffeePartnerHeader from "../../components/CoffeePartnerHeader";
import { roleManagementService } from "../../services/roleManagementService";
import { formatDate } from "../../utils/dateUtils";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width / 2 - 30; // Pentru layout potențial în 2 coloane

export default function AdminDashboardScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalAdmins: 0,
    totalPartners: 0,
    activeUsers: 0,
    pendingPartners: 0,
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const dashboardStats = await roleManagementService.getAllRoleStatistics();
      setStats(dashboardStats);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const navigateTo = (path: string) => {
    router.push(path);
  };

  const handleUserManagementUpdate = () => {
    // Reîmprospătez datele dashboard-ului când utilizatorii sunt actualizați
    loadDashboardData();
  };

  if (loading && !refreshing) {
    return (
      <ScreenWrapper>
        <CoffeePartnerHeader title={"Admin Dashboard"} showBackButton={true} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B4513" />
          <Text style={styles.loadingText}>Loading dashboard data...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <CoffeePartnerHeader title={"Admin Dashboard"} showBackButton={true} />
      <ScrollView
        contentContainerStyle={styles.scrollViewContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <Text style={styles.welcomeMessage}>Admin Control Panel</Text>

        {/* Quick Action: User Management */}
        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => setShowUserManagement(true)}
        >
          <Ionicons name="people-outline" size={24} color="#FFF" />
          <Text style={styles.quickActionText}>User Management</Text>
        </TouchableOpacity>

        {/* Quick Stats Section */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.totalUsers}</Text>
            <Text style={styles.statLabel}>Total Users</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.totalAdmins}</Text>
            <Text style={styles.statLabel}>Administrators</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.totalPartners}</Text>
            <Text style={styles.statLabel}>Coffee Partners</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.activeUsers}</Text>
            <Text style={styles.statLabel}>Active Users</Text>
          </View>
        </View>

        {/* Pending Partners Alert */}
        {stats.pendingPartners > 0 && (
          <TouchableOpacity
            style={styles.pendingAlert}
            onPress={() => setShowUserManagement(true)}
          >
            <Ionicons name="warning-outline" size={20} color="#FF6B35" />
            <Text style={styles.pendingAlertText}>
              {stats.pendingPartners} partners awaiting verification
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#FF6B35" />
          </TouchableOpacity>
        )}

        {/* Admin Controls Grid */}
        <Text style={styles.sectionTitle}>Management Options</Text>
        <View style={styles.gridContainer}>
          {/* Card: Manage Users */}
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigateTo("/(admin)/manage-users")}
          >
            <Ionicons name="people-outline" size={40} color="#3F51B5" />
            <Text style={styles.cardTitle}>Manage Users</Text>
          </TouchableOpacity>

          {/* Card: Manage Cafes */}
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigateTo("/(admin)/manage-cafes")}
          >
            <Ionicons name="storefront-outline" size={40} color="#009688" />
            <Text style={styles.cardTitle}>Manage Cafes</Text>
          </TouchableOpacity>

          {/* Card: Add Cafe Location */}
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigateTo("/(admin)/add-cafe-location")}
          >
            <Ionicons name="location-outline" size={40} color="#FF5722" />
            <Text style={styles.cardTitle}>Add Cafe Location</Text>
          </TouchableOpacity>

          {/* Card: Manage Subscriptions */}
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigateTo("/(admin)/manage-subscriptions")}
          >
            <Ionicons name="card-outline" size={40} color="#FF9800" />
            <Text style={styles.cardTitle}>Manage Subscriptions</Text>
          </TouchableOpacity>

          {/* Card: View Statistics */}
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigateTo("/(admin)/statistics")}
          >
            <Ionicons name="bar-chart-outline" size={40} color="#E91E63" />
            <Text style={styles.cardTitle}>Statistics</Text>
          </TouchableOpacity>

          {/* Card: Settings/Configuration */}
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigateTo("/(admin)/app-settings")}
          >
            <Ionicons name="settings-outline" size={40} color="#607D8B" />
            <Text style={styles.cardTitle}>App Settings</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* User Management Modal */}
      {showUserManagement && (
        <View style={styles.userManagementModal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>User Management</Text>
            <TouchableOpacity
              onPress={() => setShowUserManagement(false)}
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={24} color="#8B4513" />
            </TouchableOpacity>
          </View>
          <UserManagementBox onUserUpdated={handleUserManagementUpdate} />
        </View>
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scrollViewContent: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#8B4513",
  },
  welcomeMessage: {
    fontSize: 22,
    fontWeight: "700",
    color: "#333",
    marginBottom: 25,
    textAlign: "center",
  },
  quickActionButton: {
    backgroundColor: "#4CAF50",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 10,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 25,
    flexWrap: "wrap",
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 15,
    marginHorizontal: 2,
    marginVertical: 5,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minWidth: "22%",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#8B4513",
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 10,
    color: "#666",
    textAlign: "center",
  },
  pendingAlert: {
    backgroundColor: "#FFF3E0",
    borderLeftWidth: 4,
    borderLeftColor: "#FF6B35",
    padding: 15,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  pendingAlertText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: "#E65100",
    fontWeight: "500",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 15,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    width: CARD_WIDTH,
    minHeight: 150,
    padding: 15,
    marginBottom: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 15,
    color: "#444",
    textAlign: "center",
  },
  userManagementModal: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#FFFFFF",
    zIndex: 1000,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    backgroundColor: "#FFFFFF",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  modalCloseButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#F5F5F5",
  },
});
