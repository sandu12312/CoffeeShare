import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  ImageBackground,
} from "react-native";
import { Stack, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useLanguage } from "../../context/LanguageContext";
import { useFirebase } from "../../context/FirebaseContext";
import { useSubscriptionStatus } from "../../hooks/useSubscriptionStatus";
import notificationService, {
  NotificationItem,
} from "../../services/notificationService";
import BottomTabBar from "../../components/BottomTabBar";

export default function NotificationsScreen() {
  const { t } = useLanguage();
  const { user } = useFirebase();
  const subscriptionStatus = useSubscriptionStatus(user?.uid);

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user?.uid) {
      loadNotifications();
      // Initialize notifications (check expiry and send daily updates)
      initializeNotifications();
    }
  }, [user?.uid, subscriptionStatus]);

  const loadNotifications = async () => {
    if (!user?.uid) return;

    try {
      const userNotifications = await notificationService.getNotifications(
        user.uid
      );
      const count = await notificationService.getUnreadCount(user.uid);

      setNotifications(userNotifications);
      setUnreadCount(count);
    } catch (error) {
      console.error("Error loading notifications:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const initializeNotifications = async () => {
    if (!user?.uid || !subscriptionStatus.subscription) return;

    try {
      await notificationService.initializeNotifications(
        user.uid,
        subscriptionStatus.subscription
      );
      // Reload notifications after initialization
      setTimeout(() => loadNotifications(), 1000);
    } catch (error) {
      console.error("Error initializing notifications:", error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadNotifications();
    initializeNotifications();
  };

  const handleNotificationPress = async (notification: NotificationItem) => {
    if (!user?.uid) return;

    try {
      if (!notification.read) {
        await notificationService.markAsRead(user.uid, notification.id);
        await loadNotifications(); // Refresh to show updated read status
      }

      // Handle different notification types
      if (notification.type === "subscription_expiry") {
        Alert.alert(
          notification.title,
          notification.message +
            "\n\nWould you like to renew your subscription?",
          [
            { text: "Later", style: "cancel" },
            {
              text: "Renew Now",
              onPress: () => {
                router.push("/(mainUsers)/subscriptions");
              },
            },
          ]
        );
      } else if (notification.type === "daily_update") {
        Alert.alert(
          notification.title,
          notification.message + "\n\nWould you like to view available plans?",
          [
            { text: "Close", style: "cancel" },
            {
              text: "View Plans",
              onPress: () => {
                router.push("/(mainUsers)/subscriptions");
              },
            },
          ]
        );
      } else if (notification.type === "special_offer") {
        Alert.alert(
          notification.title,
          notification.message + "\n\nDon't miss out on this great deal!",
          [
            { text: "Maybe Later", style: "cancel" },
            {
              text: "Explore Offers",
              onPress: () => {
                router.push("/(mainUsers)/subscriptions");
              },
            },
          ]
        );
      } else if (notification.type === "achievement") {
        Alert.alert(
          notification.title,
          notification.message + "\n\nKeep up the great work! ☕",
          [{ text: "Awesome!", style: "default" }]
        );
      } else if (notification.type === "coffee_tip") {
        Alert.alert(
          notification.title,
          notification.message + "\n\nHappy brewing! ☕",
          [{ text: "Thanks!", style: "default" }]
        );
      } else if (notification.type === "recommendation") {
        Alert.alert(
          notification.title,
          notification.message + "\n\nWould you like to explore more cafes?",
          [
            { text: "Not Now", style: "cancel" },
            {
              text: "Explore Cafes",
              onPress: () => {
                router.push("/(mainUsers)/home");
              },
            },
          ]
        );
      } else if (notification.type === "welcome") {
        Alert.alert(
          notification.title,
          notification.message + "\n\nLet's get you started!",
          [
            { text: "Explore Later", style: "cancel" },
            {
              text: "Get Started",
              onPress: () => {
                router.push("/(mainUsers)/subscriptions");
              },
            },
          ]
        );
      } else {
        // Generic notification handling
        Alert.alert(notification.title, notification.message, [
          { text: "OK", style: "default" },
        ]);
      }
    } catch (error) {
      console.error("Error handling notification press:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user?.uid) return;

    try {
      await notificationService.markAllAsRead(user.uid);
      await loadNotifications();
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const handleClearAll = () => {
    if (!user?.uid) return;

    Alert.alert(
      "Clear All Notifications",
      "Are you sure you want to clear all notifications? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All",
          style: "destructive",
          onPress: async () => {
            try {
              await notificationService.clearAllNotifications(user.uid!);
              await loadNotifications();
            } catch (error) {
              console.error("Error clearing notifications:", error);
            }
          },
        },
      ]
    );
  };

  const getNotificationIcon = (type: string, priority: string) => {
    switch (type) {
      case "subscription_expiry":
        return priority === "high" ? "alert-circle" : "warning-outline";
      case "daily_update":
        return "information-circle-outline";
      case "achievement":
        return "trophy-outline";
      case "coffee_tip":
        return "bulb-outline";
      case "special_offer":
        return "gift-outline";
      case "milestone":
        return "star-outline";
      case "recommendation":
        return "compass-outline";
      case "welcome":
        return "hand-left-outline";
      default:
        return "notifications-outline";
    }
  };

  const getNotificationColor = (type: string, priority: string) => {
    // Special colors for certain types
    switch (type) {
      case "achievement":
        return "#FFD700"; // Gold
      case "coffee_tip":
        return "#8B4513"; // Coffee brown
      case "special_offer":
        return "#FF6B35"; // Orange-red
      case "welcome":
        return "#4CAF50"; // Green
      case "recommendation":
        return "#2196F3"; // Blue
      default:
        // Fallback to priority colors
        switch (priority) {
          case "high":
            return "#E74C3C";
          case "medium":
            return "#F39C12";
          default:
            return "#3498DB";
        }
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) {
      return "Just now";
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
    }
  };

  return (
    <ImageBackground
      source={require("../../assets/images/coffee-beans-textured-background.jpg")}
      style={styles.background}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />

        {/* Custom Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>
            Notifications {unreadCount > 0 ? `(${unreadCount})` : ""}
          </Text>

          <View style={styles.headerActions}>
            {notifications.length > 0 && unreadCount > 0 && (
              <TouchableOpacity
                style={styles.headerButton}
                onPress={handleMarkAllAsRead}
              >
                <Text style={styles.headerButtonText}>Mark All Read</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text style={styles.loadingText}>Loading notifications...</Text>
          </View>
        ) : (
          <ScrollView
            style={styles.scrollView}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          >
            {/* Header Actions */}
            {notifications.length > 0 && (
              <View style={styles.actionsContainer}>
                <Text style={styles.notificationCount}>
                  {notifications.length} notification
                  {notifications.length !== 1 ? "s" : ""}
                  {unreadCount > 0 && ` (${unreadCount} unread)`}
                </Text>
                <TouchableOpacity
                  style={styles.clearAllButton}
                  onPress={handleClearAll}
                >
                  <Ionicons name="trash-outline" size={16} color="#E74C3C" />
                  <Text style={styles.clearAllText}>Clear All</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Notifications List */}
            {notifications.length > 0 ? (
              <View style={styles.notificationsContainer}>
                {notifications.map((notification) => (
                  <TouchableOpacity
                    key={notification.id}
                    style={[
                      styles.notificationCard,
                      !notification.read && styles.unreadNotification,
                    ]}
                    onPress={() => handleNotificationPress(notification)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.notificationContent}>
                      <View style={styles.notificationHeader}>
                        <View style={styles.notificationIconContainer}>
                          <Ionicons
                            name={
                              getNotificationIcon(
                                notification.type,
                                notification.priority
                              ) as any
                            }
                            size={24}
                            color={getNotificationColor(
                              notification.type,
                              notification.priority
                            )}
                          />
                          {!notification.read && (
                            <View style={styles.unreadDot} />
                          )}
                        </View>
                        <View style={styles.notificationDetails}>
                          <Text
                            style={[
                              styles.notificationTitle,
                              !notification.read && styles.unreadTitle,
                            ]}
                          >
                            {notification.title}
                          </Text>
                          <Text style={styles.notificationTime}>
                            {formatTimeAgo(notification.timestamp)}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.notificationMessage}>
                        {notification.message}
                      </Text>
                      {notification.type === "subscription_expiry" &&
                        notification.expiryDate && (
                          <View style={styles.expiryInfo}>
                            <Ionicons
                              name="calendar-outline"
                              size={14}
                              color="#8B4513"
                            />
                            <Text style={styles.expiryText}>
                              Expires:{" "}
                              {notification.expiryDate.toLocaleDateString()}
                            </Text>
                          </View>
                        )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons
                  name="notifications-off-outline"
                  size={80}
                  color="rgba(255, 255, 255, 0.7)"
                />
                <Text style={styles.emptyTitle}>No Notifications</Text>
                <Text style={styles.emptyMessage}>
                  You're all caught up! Notifications about your subscription
                  and new offers will appear here.
                </Text>

                {/* Manual refresh option */}
                <TouchableOpacity
                  style={styles.refreshButton}
                  onPress={onRefresh}
                >
                  <Ionicons name="refresh-outline" size={20} color="#8B4513" />
                  <Text style={styles.refreshButtonText}>
                    Check for Updates
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        )}

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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 15,
    backgroundColor: "rgba(50, 30, 14, 0.8)",
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerButton: {
    marginLeft: 10,
  },
  headerButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#FFFFFF",
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  scrollView: {
    flex: 1,
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    marginHorizontal: 15,
    marginTop: 15,
    borderRadius: 12,
  },
  notificationCount: {
    fontSize: 14,
    color: "#666666",
    fontWeight: "500",
  },
  clearAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  clearAllText: {
    fontSize: 14,
    color: "#E74C3C",
    fontWeight: "500",
  },
  notificationsContainer: {
    padding: 15,
  },
  notificationCard: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  unreadNotification: {
    borderLeftWidth: 4,
    borderLeftColor: "#3498DB",
    backgroundColor: "rgba(255, 255, 255, 1)",
  },
  notificationContent: {
    gap: 10,
  },
  notificationHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  notificationIconContainer: {
    position: "relative",
  },
  unreadDot: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E74C3C",
  },
  notificationDetails: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#321E0E",
    marginBottom: 2,
  },
  unreadTitle: {
    fontWeight: "700",
  },
  notificationTime: {
    fontSize: 12,
    color: "#8B4513",
    opacity: 0.7,
  },
  notificationMessage: {
    fontSize: 14,
    color: "#666666",
    lineHeight: 20,
  },
  expiryInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingTop: 5,
  },
  expiryText: {
    fontSize: 12,
    color: "#8B4513",
    fontWeight: "500",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
    marginTop: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#FFFFFF",
    marginTop: 20,
    marginBottom: 10,
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  emptyMessage: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 30,
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  refreshButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  refreshButtonText: {
    color: "#8B4513",
    fontWeight: "600",
  },
});
