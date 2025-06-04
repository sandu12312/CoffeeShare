import React, { useRef, useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ImageBackground,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
  StatusBar,
  Animated,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Stack, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import BottomTabBar from "../../components/BottomTabBar";
import { useLanguage } from "../../context/LanguageContext";
import { useFirebase } from "../../context/FirebaseContext";
import SubscriptionCard from "../../components/SubscriptionCard";
import RecentActivityCard from "../../components/RecentActivityCard";
import QuickStatsCard from "../../components/QuickStatsCard";
import { formatDate } from "../../utils/dateUtils";
import { ActivityType } from "../../types";
import { auth } from "../../config/firebase";
import {
  SubscriptionService,
  UserSubscription,
} from "../../services/subscriptionService";
import { useSubscriptionStatus } from "../../hooks/useSubscriptionStatus";

const HEADER_HEIGHT = 80;

// Helper function to format activity data
const formatActivityForDisplay = (activity: any, t: Function) => {
  return {
    id: activity.id,
    cafe: activity.cafeName || t("dashboard.defaultCafeName"),
    date: formatDate(activity.timestamp, true),
  };
};

export default function Dashboard() {
  const { t } = useLanguage();
  const { user, userProfile, logout, getActivityLogs } = useFirebase();
  const scrollOffsetY = useRef(new Animated.Value(0)).current;
  const lastScrollY = useRef(0);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Use the new subscription status hook
  const subscriptionStatus = useSubscriptionStatus(user?.uid);

  const headerTranslateY = scrollOffsetY.interpolate({
    inputRange: [0, HEADER_HEIGHT],
    outputRange: [0, -HEADER_HEIGHT],
    extrapolate: "clamp",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        await fetchUserActivities();
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const fetchUserActivities = async () => {
    try {
      const logs = await getActivityLogs(10, ActivityType.COFFEE_REDEMPTION);
      setActivityLogs(logs);
    } catch (error: any) {
      console.error("Error fetching activity logs:", error);
      // Check if error is due to index building
      if (
        error.message &&
        error.message.includes("index is currently building")
      ) {
        Alert.alert(
          t("cafe.indexBuildingTitle"),
          t("cafe.indexBuildingMessage"),
          [{ text: t("common.ok") }]
        );
      }
    }
  };

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollOffsetY } } }],
    {
      useNativeDriver: true,
      listener: (event: any) => {
        const currentScrollY = event.nativeEvent.contentOffset.y;
        lastScrollY.current = currentScrollY;
      },
    }
  );

  const handleLogout = async () => {
    try {
      await logout();
      router.replace("/(auth)/login");
    } catch (error) {
      console.error("Logout error:", error);
      Alert.alert(t("common.error"), t("dashboard.logoutError"));
    }
  };

  // Get subscription data for display
  const getSubscriptionData = () => {
    return {
      type: subscriptionStatus.subscriptionName,
      expires: subscriptionStatus.expiresAt
        ? formatDate(subscriptionStatus.expiresAt)
        : t("dashboard.subscriptionExpiresN/A"),
      beansLeft: subscriptionStatus.beansLeft,
      beansTotal: subscriptionStatus.beansTotal,
      hasActiveSubscription: subscriptionStatus.isActive,
    };
  };

  // Get recent activity from user logs
  const getRecentActivity = () => {
    if (activityLogs.length === 0) {
      return [
        {
          id: "no-activity",
          cafe: t("dashboard.noRecentActivity"),
          date: t("dashboard.getActivityPrompt"),
        },
      ];
    }

    return activityLogs
      .filter((log) => log.type === ActivityType.COFFEE_REDEMPTION)
      .slice(0, 3)
      .map((activity) => formatActivityForDisplay(activity, t));
  };

  // Get weekly stats data
  const getWeeklyStats = () => {
    if (!userProfile || !userProfile.stats) {
      return {
        coffeesThisWeek: 0,
        comparison: "+0%",
        favoriteCafe: t("dashboard.noFavoriteCafe"),
      };
    }

    const weeklyCount = userProfile.stats.weeklyCount || 0;
    // Calculate comparison (placeholder logic - replace with actual comparison later)
    const lastWeekCount = weeklyCount - 1; // This is a placeholder
    const comparison =
      lastWeekCount > 0
        ? `+${Math.round(
            ((weeklyCount - lastWeekCount) / lastWeekCount) * 100
          )}%`
        : "+0%";

    return {
      coffeesThisWeek: weeklyCount,
      comparison: comparison,
      favoriteCafe:
        userProfile.stats.favoriteCafe?.name || t("dashboard.noFavoriteCafe"),
    };
  };

  // Handler functions
  const handleRenewSubscription = () => {
    router.push("/(mainUsers)/subscriptions");
  };

  const handleCafePress = (cafe: any) => {
    console.log("Cafe pressed:", cafe);
    // Navigate to cafe details
  };

  const handleViewFullHistory = () => {
    router.push("/(mainUsers)/profile");
  };

  const handleActivityPress = (activity: any) => {
    console.log("Activity pressed:", activity);
    // Navigate to activity details
  };

  const handleProfilePress = () => {
    router.push("/(mainUsers)/profile");
  };

  if (loading || !userProfile) {
    return (
      <ImageBackground
        source={require("../../assets/images/coffee-beans-textured-background.jpg")}
        style={styles.background}
        resizeMode="cover"
      >
        <SafeAreaView style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>{t("dashboard.loadingData")}</Text>
        </SafeAreaView>
      </ImageBackground>
    );
  }

  if (loading || subscriptionStatus.loading || !userProfile) {
    return (
      <ImageBackground
        source={require("../../assets/images/coffee-beans-textured-background.jpg")}
        style={styles.background}
        resizeMode="cover"
      >
        <SafeAreaView style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>{t("dashboard.loadingData")}</Text>
        </SafeAreaView>
      </ImageBackground>
    );
  }

  const subscriptionData = getSubscriptionData();
  const recentActivity = getRecentActivity();
  const quickStats = getWeeklyStats();

  const displayName =
    userProfile?.displayName || user?.displayName || t("profile.coffeeLover");

  return (
    <ImageBackground
      source={require("../../assets/images/coffee-beans-textured-background.jpg")}
      style={styles.background}
      resizeMode="cover"
    >
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />

        {/* Animated Floating Header Elements */}
        <Animated.View
          style={[
            styles.floatingHeaderContainer,
            { transform: [{ translateY: headerTranslateY }] },
          ]}
        >
          <Text style={styles.floatingHeaderTitle}>{t("common.appName")}</Text>
          <View style={styles.floatingHeaderIcons}>
            {/* Icon Buttons */}
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons
                name="notifications-outline"
                size={26}
                color="#FFFFFF"
                style={styles.iconShadow}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={handleProfilePress}
            >
              <Ionicons
                name="person-outline"
                size={26}
                color="#FFFFFF"
                style={styles.iconShadow}
              />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Main Scrollable Content */}
        <Animated.ScrollView
          contentContainerStyle={styles.scrollContent}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
        >
          {/* User Welcome Section */}
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeText}>
              {t("dashboard.welcomeMessage", { name: displayName })}
            </Text>
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <Text style={styles.logoutText}>
                {t("dashboard.logoutButton")}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Subscription Card - Using Bean-based Subscription Data */}
          <SubscriptionCard
            type={subscriptionData.type}
            expires={subscriptionData.expires}
            beansLeft={subscriptionData.beansLeft}
            beansTotal={subscriptionData.beansTotal}
            onRenew={handleRenewSubscription}
            isLoading={loading}
          />

          {/* QR Code Button - Show only if the user has an active subscription with beans */}
          {subscriptionData.hasActiveSubscription &&
            subscriptionData.beansLeft > 0 && (
              <TouchableOpacity
                style={styles.qrCodeButton}
                onPress={() => router.push("/(mainUsers)/qr")}
              >
                <Ionicons name="qr-code-outline" size={24} color="#FFFFFF" />
                <Text style={styles.qrCodeButtonText}>{t("scanQRCode")}</Text>
              </TouchableOpacity>
            )}

          {/* Recent Activity Card - Using Real User Data */}
          <RecentActivityCard
            activities={recentActivity}
            onViewAll={handleViewFullHistory}
            onActivityPress={handleActivityPress}
          />

          {/* Quick Stats Card - Using Real User Data */}
          <QuickStatsCard
            coffeesThisWeek={quickStats.coffeesThisWeek}
            comparison={quickStats.comparison}
            favoriteCafe={quickStats.favoriteCafe}
          />
        </Animated.ScrollView>

        {/* Bottom Navigation Bar */}
        <BottomTabBar />
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingBottom: 75,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "500",
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  floatingHeaderContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: HEADER_HEIGHT,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 44 : StatusBar.currentHeight || 10,
    zIndex: 10,
  },
  floatingHeaderTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    letterSpacing: 0.5,
    textShadowColor: "rgba(50, 30, 14, 0.7)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  floatingHeaderIcons: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconButton: {
    marginLeft: 18,
    padding: 5,
  },
  iconShadow: {
    textShadowColor: "rgba(50, 30, 14, 0.7)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  scrollContent: {
    paddingTop: HEADER_HEIGHT + 10,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  welcomeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
    textShadowColor: "rgba(50, 30, 14, 0.7)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  logoutButton: {
    backgroundColor: "rgba(139, 69, 19, 0.7)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  logoutText: {
    color: "#FFFFFF",
    fontWeight: "500",
  },
  profileCard: {
    backgroundColor: "rgba(255, 248, 220, 0.85)",
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  profileCardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#8B4513",
    marginBottom: 10,
  },
  profileItem: {
    fontSize: 14,
    color: "#321E0E",
    marginBottom: 5,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: "#8B4513",
    marginVertical: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#8B4513",
    marginBottom: 10,
  },
  activeText: {
    fontWeight: "bold",
    color: "#008000",
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  actionButton: {
    backgroundColor: "#8B4513",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  secondaryButton: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#8B4513",
  },
  secondaryButtonText: {
    color: "#8B4513",
    fontWeight: "bold",
  },
  qrCodeButton: {
    backgroundColor: "#8B4513",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  qrCodeButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginLeft: 8,
  },
  disabledOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  disabledText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 14,
    textAlign: "center",
  },
});
