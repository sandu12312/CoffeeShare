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
// Assuming we might reuse or adapt the partner header
import CoffeePartnerHeader from "../../components/CoffeePartnerHeader";
import adminService, { AdminUserData } from "../../services/adminService";
import { formatDate } from "../../utils/dateUtils";
import RegisterCoffeePartnerForm from "../../components/RegisterCoffeePartnerForm";
import PendingRegistrationsModal from "../../components/PendingRegistrationsModal";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width / 2 - 30; // For potential 2-column layout

export default function AdminDashboardScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [showPendingRegistrations, setShowPendingRegistrations] =
    useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeSubscriptions: 0,
    totalCafes: 0,
    recentRegistrations: [] as AdminUserData[],
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const dashboardStats = await adminService.getDashboardStats();
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

  const handleRegisterSuccess = () => {
    // Refresh dashboard data when a new partner is registered
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
      {/* Using partner header for now, can be customized later */}
      <CoffeePartnerHeader title={"Admin Dashboard"} showBackButton={true} />
      <ScrollView
        contentContainerStyle={styles.scrollViewContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <Text style={styles.welcomeMessage}>Admin Control Panel</Text>

        {/* Quick Action: Register Coffee Partner */}
        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => setShowRegisterForm(true)}
        >
          <Ionicons name="person-add-outline" size={24} color="#FFF" />
          <Text style={styles.quickActionText}>
            Register New Coffee Partner
          </Text>
        </TouchableOpacity>

        {/* Quick Action: View Pending Registrations */}
        <TouchableOpacity
          style={styles.pendingActionButton}
          onPress={() => setShowPendingRegistrations(true)}
        >
          <Ionicons name="mail-unread-outline" size={24} color="#FFF" />
          <Text style={styles.quickActionText}>View Pending Registrations</Text>
        </TouchableOpacity>

        {/* Quick Stats Section */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.totalUsers}</Text>
            <Text style={styles.statLabel}>Total Users</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.activeSubscriptions}</Text>
            <Text style={styles.statLabel}>Active Subscriptions</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.totalCafes}</Text>
            <Text style={styles.statLabel}>Partner Cafes</Text>
          </View>
        </View>

        {/* Recent Registrations */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Recent Registrations</Text>
          {stats.recentRegistrations.length > 0 ? (
            stats.recentRegistrations.map((user) => (
              <View key={user.id} style={styles.userItem}>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>
                    {user.displayName || "User"}
                  </Text>
                  <Text style={styles.userEmail}>{user.email}</Text>
                </View>
                <View style={styles.userMeta}>
                  <Text style={styles.userRole}>{user.role}</Text>
                  <Text style={styles.userDate}>
                    {formatDate(user.createdAt)}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No recent registrations</Text>
          )}

          <TouchableOpacity
            style={styles.viewAllButton}
            onPress={() => navigateTo("/(admin)/manage-users")}
          >
            <Text style={styles.viewAllText}>View All Users</Text>
          </TouchableOpacity>
        </View>

        {/* Admin Controls Grid */}
        <Text style={styles.sectionTitle}>Management Options</Text>
        <View style={styles.gridContainer}>
          {/* Card: Manage Users */}
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigateTo("/(admin)/manage-users")}
          >
            <Ionicons name="people-outline" size={40} color="#3F51B5" />
            {/* TODO: Translation key */}
            <Text style={styles.cardTitle}>Manage Users</Text>
          </TouchableOpacity>

          {/* Card: Manage Cafes */}
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigateTo("/(admin)/manage-cafes")}
          >
            <Ionicons name="storefront-outline" size={40} color="#009688" />
            {/* TODO: Translation key */}
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
            {/* TODO: Translation key */}
            <Text style={styles.cardTitle}>Manage Subscriptions</Text>
          </TouchableOpacity>

          {/* Card: View Statistics */}
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigateTo("/(admin)/statistics")}
          >
            <Ionicons name="bar-chart-outline" size={40} color="#E91E63" />
            {/* TODO: Translation key */}
            <Text style={styles.cardTitle}>Statistics</Text>
          </TouchableOpacity>

          {/* Card: Settings/Configuration */}
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigateTo("/(admin)/app-settings")}
          >
            <Ionicons name="settings-outline" size={40} color="#607D8B" />
            {/* TODO: Translation key */}
            <Text style={styles.cardTitle}>App Settings</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Register Coffee Partner Form Modal */}
      <RegisterCoffeePartnerForm
        visible={showRegisterForm}
        onClose={() => setShowRegisterForm(false)}
        onSuccess={handleRegisterSuccess}
      />

      {/* Pending Registrations Modal */}
      <PendingRegistrationsModal
        visible={showPendingRegistrations}
        onClose={() => setShowPendingRegistrations(false)}
      />
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
  pendingActionButton: {
    backgroundColor: "#007BFF",
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
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 25,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 15,
    marginHorizontal: 5,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#8B4513",
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  sectionContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 15,
    marginBottom: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 15,
  },
  userItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  userEmail: {
    fontSize: 14,
    color: "#666",
  },
  userMeta: {
    alignItems: "flex-end",
  },
  userRole: {
    fontSize: 14,
    color: "#8B4513",
    fontWeight: "500",
  },
  userDate: {
    fontSize: 12,
    color: "#999",
  },
  emptyText: {
    textAlign: "center",
    color: "#999",
    padding: 10,
  },
  viewAllButton: {
    alignSelf: "center",
    marginTop: 15,
    paddingVertical: 8,
    paddingHorizontal: 20,
    backgroundColor: "#8B4513",
    borderRadius: 20,
  },
  viewAllText: {
    color: "#FFFFFF",
    fontWeight: "600",
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
    // Shadow styles (similar to partner dashboard)
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
});
