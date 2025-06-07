import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useLanguage } from "../../../context/LanguageContext";
import { useFirebase } from "../../../context/FirebaseContext";
import { useSubscriptionStatus } from "../../../hooks/useSubscriptionStatus";
import notificationService, {
  NotificationItem,
} from "../../../services/notificationService";
import { ErrorModal } from "../../../components/ErrorComponents";
import { useErrorHandler } from "../../../hooks/useErrorHandler";

export default function NotificationsScreen() {
  const { t } = useLanguage();
  const { user } = useFirebase();
  const subscriptionStatus = useSubscriptionStatus(user?.uid);
  const { errorState, showConfirmModal, hideModal } = useErrorHandler();

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
        showConfirmModal(
          notification.title,
          notification.message +
            "\n\nWould you like to renew your subscription?",
          () => {
            // Navigate to subscriptions screen
            // router.push("/(mainUsers)/subscriptions");
          }
        );
      } else if (notification.type === "daily_update") {
        showConfirmModal(
          notification.title,
          notification.message + "\n\nWould you like to view available plans?",
          () => {
            // Navigate to subscriptions screen
            // router.push("/(mainUsers)/subscriptions");
          }
        );
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

    showConfirmModal(
      "Clear All Notifications",
      "Are you sure you want to clear all notifications? This action cannot be undone.",
      async () => {
        try {
          await notificationService.clearAllNotifications(user.uid!);
          await loadNotifications();
        } catch (error) {
          console.error("Error clearing notifications:", error);
        }
      }
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
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          headerTitle: `${t("notifications")} ${
            unreadCount > 0 ? `(${unreadCount})` : ""
          }`,
          headerStyle: styles.headerStyle,
          headerTitleStyle: styles.headerTitleStyle,
          headerTintColor: "#321E0E",
          headerRight: () => (
            <View style={styles.headerButtons}>
              {notifications.length > 0 && unreadCount > 0 && (
                <TouchableOpacity
                  style={styles.headerButton}
                  onPress={handleMarkAllAsRead}
                >
                  <Text style={styles.headerButtonText}>Mark All Read</Text>
                </TouchableOpacity>
              )}
            </View>
          ),
        }}
      />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B4513" />
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
                color="#CCCCCC"
              />
              <Text style={styles.emptyTitle}>No Notifications</Text>
              <Text style={styles.emptyMessage}>
                You're all caught up! Notifications about your subscription and
                new offers will appear here.
              </Text>

              {/* Manual refresh option */}
              <TouchableOpacity
                style={styles.refreshButton}
                onPress={onRefresh}
              >
                <Ionicons name="refresh-outline" size={20} color="#8B4513" />
                <Text style={styles.refreshButtonText}>Check for Updates</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}

      {/* Error Components */}
      <ErrorModal
        visible={errorState.modal.visible}
        title={errorState.modal.title}
        message={errorState.modal.message}
        type={errorState.modal.type}
        onDismiss={hideModal}
        primaryAction={errorState.modal.primaryAction}
        secondaryAction={errorState.modal.secondaryAction}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  headerStyle: {
    backgroundColor: "#FFFFFF",
  },
  headerTitleStyle: {
    color: "#321E0E",
    fontSize: 18,
    fontWeight: "600",
  },
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerButton: {
    marginLeft: 10,
  },
  headerButtonText: {
    color: "#8B4513",
    fontSize: 14,
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
    color: "#8B4513",
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
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
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
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  unreadNotification: {
    borderLeftWidth: 4,
    borderLeftColor: "#3498DB",
    backgroundColor: "#F8FFFE",
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
    color: "#321E0E",
    marginTop: 20,
    marginBottom: 10,
  },
  emptyMessage: {
    fontSize: 14,
    color: "#8B4513",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 30,
  },
  refreshButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "#8B4513",
    gap: 8,
  },
  refreshButtonText: {
    color: "#8B4513",
    fontWeight: "600",
  },
});
