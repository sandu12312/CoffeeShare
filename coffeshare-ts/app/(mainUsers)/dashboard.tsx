import React, { useRef } from "react";
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
} from "react-native";
import { Stack, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import BottomTabBar from "../../components/BottomTabBar";
import { useLanguage } from "../../context/LanguageContext";
import SubscriptionCard from "../../components/SubscriptionCard";
import RecommendedCafesCard from "../../components/RecommendedCafesCard";
import RecentActivityCard from "../../components/RecentActivityCard";
import QuickStatsCard from "../../components/QuickStatsCard";

const HEADER_HEIGHT = 80;

export default function Dashboard() {
  const { t } = useLanguage();
  const scrollOffsetY = useRef(new Animated.Value(0)).current;
  const lastScrollY = useRef(0);

  // Calculate header translateY based on scroll
  const headerTranslateY = scrollOffsetY.interpolate({
    inputRange: [0, HEADER_HEIGHT],
    outputRange: [0, -HEADER_HEIGHT],
    extrapolate: "clamp",
  });

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollOffsetY } } }],
    {
      useNativeDriver: true, // Use native driver for performance
      listener: (event: any) => {
        const currentScrollY = event.nativeEvent.contentOffset.y;
        // Optional: Logic based on scroll direction can be added here if needed
        lastScrollY.current = currentScrollY;
      },
    }
  );

  // Placeholder data - replace with actual data later
  const subscription = {
    type: "Student Pack",
    expires: "Oct 31, 2024",
    coffeesLeft: 1,
    coffeesTotal: 2,
  };
  const recommendedCafes = [
    { id: "1", name: "Cafe Central", distance: "300m", rating: 4.5 },
    { id: "2", name: "Morning Brew", distance: "500m", rating: 4.8 },
    { id: "3", name: "The Grind House", distance: "1.2km", rating: 4.2 },
  ];
  const recentActivity = [
    { id: "1", cafe: "Cafe Central", date: "Today, 10:30 AM" },
    { id: "2", cafe: "Morning Brew", date: "Yesterday, 4:15 PM" },
    { id: "3", cafe: "Cafe Central", date: "Sep 28, 8:00 AM" },
  ];
  const quickStats = {
    coffeesThisWeek: 8,
    comparison: "+15%",
    favoriteCafe: "Cafe Central",
  };

  // Handler functions
  const handleRenewSubscription = () => {
    router.push("/(mainUsers)/subscriptions");
  };

  const handleViewAllCafes = () => {
    router.push("/(mainUsers)/map");
  };

  const handleCafePress = (cafe: any) => {
    console.log("Cafe pressed:", cafe);
    // Navigate to cafe details
  };

  const handleViewFullHistory = () => {
    console.log("View full history");
    // Navigate to history screen
  };

  const handleActivityPress = (activity: any) => {
    console.log("Activity pressed:", activity);
    // Navigate to activity details
  };

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
          <Text style={styles.floatingHeaderTitle}>CoffeeShare</Text>
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
            <TouchableOpacity style={styles.iconButton}>
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
          scrollEventThrottle={16} // Optimize scroll event frequency
          showsVerticalScrollIndicator={false}
        >
          {/* Subscription Card */}
          <SubscriptionCard
            type={subscription.type}
            expires={subscription.expires}
            coffeesLeft={subscription.coffeesLeft}
            coffeesTotal={subscription.coffeesTotal}
            onRenew={handleRenewSubscription}
          />

          {/* Recommended Cafes Card */}
          <RecommendedCafesCard
            cafes={recommendedCafes}
            onViewAll={handleViewAllCafes}
            onCafePress={handleCafePress}
          />

          {/* Recent Activity Card */}
          <RecentActivityCard
            activities={recentActivity}
            onViewAll={handleViewFullHistory}
            onActivityPress={handleActivityPress}
          />

          {/* Quick Stats Card */}
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
  floatingHeaderContainer: {
    position: "absolute",
    top: 0, // Start at the very top
    left: 0,
    right: 0,
    height: HEADER_HEIGHT,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 44 : StatusBar.currentHeight || 10, // Padding for status bar area inside the header
    zIndex: 10,
    // Background can be added here if needed over the ImageBackground, e.g., slightly darker transparent gradient
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
    paddingTop: HEADER_HEIGHT + 10, // Ensure content starts below floating header
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
});
