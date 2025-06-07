import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Stack, router, Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import BottomTabBar from "../../components/BottomTabBar";
import { useLanguage, TranslationKey } from "../../context/LanguageContext";
import { useFirebase } from "../../context/FirebaseContext";
import { ActivityType } from "../../types";
import { useSubscriptionStatus } from "../../hooks/useSubscriptionStatus";
import { Toast } from "../../components/ErrorComponents";
import { useErrorHandler } from "../../hooks/useErrorHandler";

type IconName = keyof typeof Ionicons.glyphMap;

interface MenuItem {
  title: string;
  icon: IconName;
  onPress: () => void;
}

export default function ProfileScreen() {
  const { t } = useLanguage();
  const { user, userProfile, logout, getActivityLogs } = useFirebase();
  const { errorState, showError, hideToast } = useErrorHandler();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);

  // Use the subscription status hook to get real-time data
  const subscriptionStatus = useSubscriptionStatus(user?.uid);

  const fetchActivityLogs = async () => {
    try {
      const logs = await getActivityLogs(5);
      setActivityLogs(logs);
    } catch (error) {
      console.error("Error fetching activity logs:", error);
    }
  };

  useEffect(() => {
    fetchActivityLogs();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchActivityLogs();
    } finally {
      setRefreshing(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "";

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleLogout = async () => {
    try {
      setLoading(true);
      await logout();
      router.replace("/(auth)/login");
    } catch (error) {
      console.error("Logout error:", error);
      showError(t("dashboard.logoutError"));
    } finally {
      setLoading(false);
    }
  };

  const menuItems: MenuItem[] = [
    {
      title: t("accountSettings"),
      icon: "person-outline",
      onPress: () => router.push("/(mainUsers)/AccountSettings"),
    },
    {
      title: t("subscriptions"),
      icon: "card-outline",
      onPress: () => router.push("/(mainUsers)/subscriptions"),
    },
    {
      title: t("notifications"),
      icon: "notifications-outline",
      onPress: () => router.push("/(mainUsers)/notifications"),
    },
    {
      title: t("privacy"),
      icon: "shield-outline",
      onPress: () => router.push("/(mainUsers)/AccountSettings/Privacy"),
    },
    {
      title: t("help"),
      icon: "help-circle-outline",
      onPress: () => router.push("/(mainUsers)/AccountSettings/Help"),
    },
    {
      title: t("about"),
      icon: "information-circle-outline",
      onPress: () => router.push("/(mainUsers)/AccountSettings/About"),
    },
  ];

  const getActivityIcon = (type: ActivityType): IconName => {
    switch (type) {
      case ActivityType.COFFEE_REDEMPTION:
        return "cafe-outline";
      case ActivityType.LOGIN:
        return "log-in-outline";
      case ActivityType.LOGOUT:
        return "log-out-outline";
      case ActivityType.PROFILE_UPDATE:
        return "person-outline";
      case ActivityType.SUBSCRIPTION_PURCHASE:
      case ActivityType.SUBSCRIPTION_RENEWAL:
        return "card-outline";
      default:
        return "document-text-outline";
    }
  };

  const formatActivityText = (activity: any): string => {
    const cafeName = activity.cafeName || t("dashboard.defaultCafeName");
    const subscriptionType = activity.subscriptionType || "";

    switch (activity.type) {
      case ActivityType.COFFEE_REDEMPTION:
        return t("profile.activityCoffeeRedemption", { cafeName });
      case ActivityType.LOGIN:
        return t("profile.activityLogin");
      case ActivityType.LOGOUT:
        return t("profile.activityLogout");
      case ActivityType.PROFILE_UPDATE:
        return t("profile.activityProfileUpdate");
      case ActivityType.SUBSCRIPTION_PURCHASE:
        return t("profile.activitySubscriptionPurchase", { subscriptionType });
      case ActivityType.SUBSCRIPTION_RENEWAL:
        return t("profile.activitySubscriptionRenewal", { subscriptionType });
      default:
        return t("profile.activityDefault");
    }
  };

  if (!userProfile) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B4513" />
        <Text style={styles.loadingText}>{t("profile.loading")}</Text>
      </SafeAreaView>
    );
  }

  const favoriteCafeName =
    userProfile.stats?.favoriteCafe?.name || t("dashboard.noFavoriteCafe");

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.customHeader}>
        <Text style={styles.customHeaderTitle}>{t("profile")}</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            {userProfile.photoURL ? (
              <Image
                source={{ uri: userProfile.photoURL }}
                style={styles.avatar}
              />
            ) : (
              <View style={styles.placeholderAvatar}>
                <Text style={styles.placeholderText}>
                  {userProfile.displayName
                    ? userProfile.displayName.charAt(0).toUpperCase()
                    : t("profile.initialPlaceholder")}
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.userName}>{userProfile.displayName}</Text>
          <Text style={styles.userEmail}>{userProfile.email}</Text>
          <Text style={styles.memberSince}>
            {t("memberSince")} {formatDate(userProfile.createdAt)}
          </Text>
        </View>

        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Ionicons
              name="cafe-outline"
              size={24}
              color="#8B4513"
              style={styles.statIcon}
            />
            <Text style={styles.statValue}>
              {userProfile.stats?.totalCoffees || 0}
            </Text>
            <Text style={styles.statLabel}>{t("totalCoffees")}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons
              name="star-outline"
              size={24}
              color="#8B4513"
              style={styles.statIcon}
            />
            <Text
              style={styles.statValue}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {favoriteCafeName}
            </Text>
            <Text style={styles.statLabel}>{t("favoriteCafe")}</Text>
          </View>
        </View>

        <View style={styles.subscriptionCard}>
          <Text style={styles.sectionTitle}>
            {t("profile.subscriptionTitle")}
          </Text>
          <View style={styles.subscriptionDetails}>
            <View style={styles.subscriptionRow}>
              <Text style={styles.subscriptionLabel}>
                {t("profile.planLabel")}
              </Text>
              <Text style={styles.subscriptionValue}>
                {subscriptionStatus.subscriptionName ||
                  t("profile.noSubscriptionPlan")}
              </Text>
            </View>

            {subscriptionStatus.isActive && (
              <>
                <View style={styles.subscriptionRow}>
                  <Text style={styles.subscriptionLabel}>
                    {t("profile.statusLabel")}
                  </Text>
                  <Text
                    style={[
                      styles.subscriptionValue,
                      subscriptionStatus.isActive
                        ? styles.activeText
                        : styles.inactiveText,
                    ]}
                  >
                    {subscriptionStatus.isActive
                      ? t("profile.statusActive")
                      : t("profile.statusInactive")}
                  </Text>
                </View>

                <View style={styles.subscriptionRow}>
                  <Text style={styles.subscriptionLabel}>Beans Remaining</Text>
                  <Text style={[styles.subscriptionValue, styles.beansValue]}>
                    {subscriptionStatus.beansLeft || 0} /{" "}
                    {subscriptionStatus.beansTotal || 0} beans
                  </Text>
                </View>

                {subscriptionStatus.expiresAt && (
                  <View style={styles.subscriptionRow}>
                    <Text style={styles.subscriptionLabel}>
                      {t("profile.expiresLabel")}
                    </Text>
                    <Text style={styles.subscriptionValue}>
                      {formatDate(subscriptionStatus.expiresAt)}
                    </Text>
                  </View>
                )}
              </>
            )}
          </View>
        </View>

        <View style={styles.activityCard}>
          <Text style={styles.sectionTitle}>
            {t("profile.recentActivityTitle")}
          </Text>
          {activityLogs.length > 0 ? (
            <View style={styles.activityList}>
              {activityLogs.map((activity, index) => (
                <View key={index} style={styles.activityItem}>
                  <View style={styles.activityIconContainer}>
                    <Ionicons
                      name={getActivityIcon(activity.type)}
                      size={16}
                      color="#FFFFFF"
                    />
                  </View>
                  <View style={styles.activityDetails}>
                    <Text style={styles.activityText}>
                      {formatActivityText(activity)}
                    </Text>
                    <Text style={styles.activityTime}>
                      {formatDate(activity.timestamp)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.noActivityText}>
              {t("profile.noRecentActivity")}
            </Text>
          )}
        </View>

        <View style={styles.settingsCard}>
          <View style={styles.menuContainer}>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.menuItem}
                onPress={item.onPress}
              >
                <View style={styles.menuItemLeft}>
                  <Ionicons name={item.icon} size={24} color="#8B4513" />
                  <Text style={styles.menuItemText}>{item.title}</Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#CCCCCC" />
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={handleLogout}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#C0392B" />
            ) : (
              <>
                <Ionicons name="log-out-outline" size={22} color="#C0392B" />
                <Text style={[styles.settingText, styles.logoutText]}>
                  {t("logout")}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      <BottomTabBar />

      {/* Error Components */}
      <Toast
        visible={errorState.toast.visible}
        message={errorState.toast.message}
        type={errorState.toast.type}
        onHide={hideToast}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    paddingBottom: 75,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
  },
  loadingText: {
    marginTop: 10,
    color: "#8B4513",
    fontSize: 16,
  },
  customHeader: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 10,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0D6C7",
    alignItems: "center",
  },
  customHeaderTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: "#321E0E",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 20,
  },
  profileHeader: {
    alignItems: "center",
    marginBottom: 25,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(139, 69, 19, 0.1)",
  },
  avatarContainer: {
    width: 110,
    height: 110,
    borderRadius: 55,
    overflow: "hidden",
    marginBottom: 15,
    borderWidth: 3,
    borderColor: "#8B4513",
    backgroundColor: "#E0D6C7",
  },
  avatar: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  placeholderAvatar: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#8B4513",
  },
  placeholderText: {
    fontSize: 48,
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#321E0E",
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 16,
    color: "#8B4513",
    marginBottom: 8,
  },
  memberSince: {
    fontSize: 14,
    color: "#8B4513",
    opacity: 0.8,
  },
  statsCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    paddingVertical: 15,
    marginBottom: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 3,
    borderWidth: 1,
    borderColor: "rgba(139, 69, 19, 0.1)",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 10,
  },
  statIcon: {
    marginBottom: 5,
  },
  statDivider: {
    width: 1,
    backgroundColor: "rgba(139, 69, 19, 0.15)",
    marginVertical: 5,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#321E0E",
    marginBottom: 5,
    textAlign: "center",
  },
  statLabel: {
    fontSize: 13,
    color: "#8B4513",
    textAlign: "center",
  },
  subscriptionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: "rgba(139, 69, 19, 0.1)",
  },
  subscriptionDetails: {
    marginTop: 10,
  },
  subscriptionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(139, 69, 19, 0.1)",
  },
  subscriptionLabel: {
    fontSize: 16,
    color: "#321E0E",
  },
  subscriptionValue: {
    fontSize: 16,
    fontWeight: "500",
    color: "#321E0E",
  },
  activeText: {
    color: "#27AE60",
  },
  inactiveText: {
    color: "#E74C3C",
  },
  beansValue: {
    fontWeight: "600",
    color: "#8B4513",
  },
  activityCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: "rgba(139, 69, 19, 0.1)",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#321E0E",
    marginBottom: 5,
  },
  activityList: {
    marginTop: 10,
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(139, 69, 19, 0.1)",
  },
  activityIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#8B4513",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  activityDetails: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    color: "#321E0E",
  },
  activityTime: {
    fontSize: 12,
    color: "#8B4513",
    opacity: 0.7,
    marginTop: 2,
  },
  noActivityText: {
    padding: 10,
    textAlign: "center",
    color: "#8B4513",
    fontStyle: "italic",
  },
  settingsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: "rgba(139, 69, 19, 0.1)",
    marginBottom: 20,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(139, 69, 19, 0.08)",
  },
  settingText: {
    flex: 1,
    fontSize: 16,
    color: "#321E0E",
    marginLeft: 15,
  },
  logoutText: {
    color: "#C0392B",
    fontWeight: "500",
  },
  menuContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 20,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  menuItemText: {
    fontSize: 16,
    color: "#1A1A1A",
    marginLeft: 12,
  },
});
