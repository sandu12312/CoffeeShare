import React, { useRef, useState, useEffect, useCallback } from "react";
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
  RefreshControl,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Stack, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import BottomTabBar from "../../components/BottomTabBar";
import { useLanguage } from "../../context/LanguageContext";
import { useFirebase } from "../../context/FirebaseContext";
import SubscriptionCard from "../../components/SubscriptionCard";
import RecentActivityCard from "../../components/RecentActivityCard";

import FavoriteCafesCard from "../../components/FavoriteCafesCard";
import { formatDate } from "../../utils/dateUtils";
import { ActivityType } from "../../types";
import { auth } from "../../config/firebase";
import {
  SubscriptionService,
  UserSubscription,
} from "../../services/subscriptionService";
import { useSubscriptionStatus } from "../../hooks/useSubscriptionStatus";
import cartService from "../../services/cartService";
import notificationService from "../../services/notificationService";
import wishlistService, { WishlistItem } from "../../services/wishlistService";
import userTransactionsService, {
  UserTransaction,
} from "../../services/userTransactionsService";
import TransactionHistoryModal from "../../components/TransactionHistoryModal";
import { ErrorModal, Toast } from "../../components/ErrorComponents";
import { useErrorHandler } from "../../hooks/useErrorHandler";

const HEADER_HEIGHT = 80;

// Formatez activitățile pentru afișare în dashboard - am adăugat suport pentru diferite tipuri de tranzacții
const formatActivityForDisplay = (activity: any, t: Function) => {
  const beansUsed = activity.metadata?.beansUsed || activity.beansUsed || 1;
  const tokenType =
    activity.metadata?.tokenType || activity.tokenType || "instant";
  const qrTokenId = activity.metadata?.qrTokenId || activity.qrTokenId;

  // Determin tipul de tranzacție și descrierea corespunzătoare
  let transactionDescription = "";
  let transactionIcon = "cafe-outline";

  if (tokenType === "checkout") {
    transactionDescription = `Checkout Order - ${beansUsed} beans`;
    transactionIcon = "cart-outline";
  } else {
    transactionDescription = `Coffee Redemption - ${beansUsed} bean${
      beansUsed > 1 ? "s" : ""
    }`;
    transactionIcon = "cafe-outline";
  }

  return {
    id: activity.id,
    cafe:
      activity.cafeName ||
      activity.metadata?.cafeName ||
      t("dashboard.defaultCafeName"),
    date: formatDate(activity.timestamp, true),
    beansUsed,
    tokenType,
    transactionDescription,
    transactionIcon,
    qrTokenId: qrTokenId ? qrTokenId.substring(0, 8) + "..." : null,
  };
};

export default function Dashboard() {
  const { t } = useLanguage();
  const { user, userProfile, logout, getActivityLogs } = useFirebase();
  const { errorState, showError, showInfo, hideToast, hideModal } =
    useErrorHandler();
  const scrollOffsetY = useRef(new Animated.Value(0)).current;
  const lastScrollY = useRef(0);
  const [recentTransactions, setRecentTransactions] = useState<
    UserTransaction[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [favoriteCafes, setFavoriteCafes] = useState<WishlistItem[]>([]);
  const [showTransactionHistory, setShowTransactionHistory] = useState(false);

  // Hook-ul meu custom pentru gestionarea stării abonamentului - îmi simplifica mult logica
  const subscriptionStatus = useSubscriptionStatus(user?.uid);

  const headerTranslateY = scrollOffsetY.interpolate({
    inputRange: [0, HEADER_HEIGHT],
    outputRange: [0, -HEADER_HEIGHT],
    extrapolate: "clamp",
  });

  const fetchData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      await fetchUserTransactions();
      await initializeNotifications();
      await loadUnreadNotifications();
      await loadFavoriteCafes();
    } catch (error) {
      __DEV__ && console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Refresh automat când utilizatorul revine pe dashboard
  useFocusEffect(
    useCallback(() => {
      if (user?.uid) {
        fetchData(false);
      }
    }, [user?.uid, fetchData])
  );

  useEffect(() => {
    if (user?.uid) {
      fetchData(false);
    }
  }, [user?.uid, fetchData]);

  useEffect(() => {
    // Inițializez notificările când se schimbă starea abonamentului
    if (user?.uid && subscriptionStatus.subscription) {
      initializeNotifications();
    }
  }, [user?.uid, subscriptionStatus]);

  const fetchUserTransactions = useCallback(async () => {
    if (!user?.uid) return;

    try {
      const transactions = await userTransactionsService.getUserTransactions(
        user.uid,
        5
      );
      setRecentTransactions(transactions);
    } catch (error: any) {
      __DEV__ && console.error("Error fetching user transactions:", error);
      // Tratez erorile de indexare Firebase - se întâmplă când adaug noi funcții
      if (
        error.message &&
        error.message.includes("index is currently building")
      ) {
        showInfo(
          "Firebase se actualizează. Te rugăm să aștepți câteva minute pentru statistici."
        );
      }
    }
  }, [user?.uid, showInfo, t]);

  const initializeNotifications = useCallback(async () => {
    if (!user?.uid || !subscriptionStatus.subscription) return;

    try {
      await notificationService.initializeNotifications(
        user.uid,
        subscriptionStatus.subscription
      );
      await loadUnreadNotifications();
    } catch (error) {
      __DEV__ && console.error("Error initializing notifications:", error);
    }
  }, [user?.uid, subscriptionStatus.subscription]);

  const loadUnreadNotifications = useCallback(async () => {
    if (!user?.uid) return;

    try {
      const count = await notificationService.getUnreadCount(user.uid);
      setUnreadNotifications(count);
    } catch (error) {
      __DEV__ && console.error("Error loading unread notifications:", error);
    }
  }, [user?.uid]);

  const loadFavoriteCafes = useCallback(async () => {
    if (!user?.uid) return;

    try {
      const favorites = await wishlistService.getFavoriteCafesForDashboard(
        user.uid
      );
      setFavoriteCafes(favorites);
    } catch (error) {
      __DEV__ && console.error("Error loading favorite cafes:", error);
    }
  }, [user?.uid]);

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

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      router.replace("/(auth)/login");
    } catch (error) {
      __DEV__ && console.error("Logout error:", error);
      showError(t("dashboard.logoutError"));
    }
  }, [logout, router, showError, t]);

  // Obțin datele abonamentului pentru afișare
  const getSubscriptionData = () => {
    const beansLeft = subscriptionStatus.beansLeft || 0;
    const beansTotal = subscriptionStatus.beansTotal || 0;
    const subscriptionName =
      subscriptionStatus.subscriptionName || t("profile.noSubscriptionPlan");

    console.log(
      `Dashboard: Subscription data - ${subscriptionName}, ${beansLeft}/${beansTotal} beans, active: ${subscriptionStatus.isActive}`
    );

    return {
      type: subscriptionName,
      expires: subscriptionStatus.expiresAt
        ? formatDate(subscriptionStatus.expiresAt)
        : t("dashboard.subscriptionExpiresN/A"),
      beansLeft,
      beansTotal,
      hasActiveSubscription: subscriptionStatus.isActive,
    };
  };

  // Obțin activitatea recentă din tranzacțiile utilizatorului
  const getRecentActivity = () => {
    if (recentTransactions.length === 0) {
      return [
        {
          id: "no-activity",
          cafe: t("dashboard.noRecentActivity"),
          date: t("dashboard.getActivityPrompt"),
          qrTokenId: null,
        },
      ];
    }

    return recentTransactions
      .slice(0, 3)
      .map((transaction) =>
        userTransactionsService.formatTransactionForDisplay(transaction, t)
      );
  };

  // Funcții pentru gestionarea acțiunilor
  const handleRenewSubscription = () => {
    router.push("/(mainUsers)/subscriptions");
  };

  const handleCafePress = (cafe: any) => {
    console.log("Cafe pressed:", cafe);
    // Navighez la detaliile cafenelei
  };

  const handleViewFullHistory = () => {
    setShowTransactionHistory(true);
  };

  const handleActivityPress = (transaction: any) => {
    console.log("Transaction pressed:", transaction);
    // Aș putea naviga la detaliile tranzacției sau ale cafenelei
    if (transaction.cafeId) {
      router.push(`/(mainUsers)/cafeDetails?cafeId=${transaction.cafeId}`);
    }
  };

  const handleProfilePress = () => {
    router.push("/(mainUsers)/profile");
  };

  const handleNotificationsPress = () => {
    router.push("/(mainUsers)/notifications");
  };

  const handleViewAllFavorites = () => {
    router.push("/(mainUsers)/wishlist");
  };

  const handleFavoriteCafePress = (cafeId: string) => {
    router.push(`/(mainUsers)/cafeDetails?cafeId=${cafeId}`);
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

        {/* Elementele header-ului plutitor animat */}
        <Animated.View
          style={[
            styles.floatingHeaderContainer,
            { transform: [{ translateY: headerTranslateY }] },
          ]}
        >
          <Text style={styles.floatingHeaderTitle}>{t("common.appName")}</Text>
          <View style={styles.floatingHeaderIcons}>
            {/* Butoanele de iconițe */}
            <TouchableOpacity
              style={styles.iconButton}
              onPress={handleNotificationsPress}
            >
              <View style={styles.notificationIconContainer}>
                <Ionicons
                  name="notifications-outline"
                  size={26}
                  color="#FFFFFF"
                  style={styles.iconShadow}
                />
                {unreadNotifications > 0 && (
                  <View style={styles.notificationBadge}>
                    <Text style={styles.notificationBadgeText}>
                      {unreadNotifications > 9 ? "9+" : unreadNotifications}
                    </Text>
                  </View>
                )}
              </View>
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

        {/* Conținutul principal cu scroll */}
        <Animated.ScrollView
          contentContainerStyle={styles.scrollContent}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchData(true)}
              colors={["#8B4513"]}
              tintColor="#8B4513"
            />
          }
        >
          {/* Secțiunea de bun venit pentru utilizator */}
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

          {/* Card-ul abonamentului - folosesc datele abonamentului bazat pe beans */}
          <SubscriptionCard
            type={subscriptionData.type}
            expires={subscriptionData.expires}
            beansLeft={subscriptionData.beansLeft}
            beansTotal={subscriptionData.beansTotal}
            onRenew={handleRenewSubscription}
            isLoading={loading}
          />

          {/* Butonul pentru coș/cod QR - afișez doar dacă utilizatorul are abonament activ cu beans */}
          {subscriptionData.hasActiveSubscription &&
            subscriptionData.beansLeft > 0 && (
              <TouchableOpacity
                style={styles.qrCodeButton}
                onPress={() => router.push("/(mainUsers)/cart")}
              >
                <Ionicons name="cart-outline" size={24} color="#FFFFFF" />
                <Text style={styles.qrCodeButtonText}>View Cart</Text>
              </TouchableOpacity>
            )}

          {/* Card-ul cafenelelor favorite - UI frumos pentru cafenelele favorite */}
          <FavoriteCafesCard
            favoriteCafes={favoriteCafes}
            onViewAll={handleViewAllFavorites}
            onCafePress={handleFavoriteCafePress}
          />

          {/* Card-ul activității recente - folosesc datele reale ale utilizatorului */}
          <RecentActivityCard
            activities={recentActivity.map((activity) => ({
              ...activity,
              qrTokenId: activity.qrTokenId || undefined, // Convert null to undefined
            }))}
            onViewAll={handleViewFullHistory}
            onActivityPress={handleActivityPress}
          />
        </Animated.ScrollView>

        {/* Bara de navigare de jos */}
        <BottomTabBar />

        {/* Componentele pentru erori */}
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

        {/* Modal-ul pentru istoricul tranzacțiilor */}
        <TransactionHistoryModal
          visible={showTransactionHistory}
          onClose={() => setShowTransactionHistory(false)}
          userId={user?.uid || ""}
        />
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
  notificationIconContainer: {
    position: "relative",
  },
  notificationBadge: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "#E74C3C",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  notificationBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
});
