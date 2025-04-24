import React from "react";
import {
  StyleSheet,
  Text,
  View,
  ImageBackground,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import BottomTabBar from "../../components/BottomTabBar";
import { useLanguage } from "../../context/LanguageContext";

export default function Dashboard() {
  const { t } = useLanguage();

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

  return (
    <ImageBackground
      source={require("../../assets/images/coffee-beans-textured-background.jpg")}
      style={styles.background}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerLogo}>CoffeeShare</Text>
          <View style={styles.headerIcons}>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons
                name="notifications-outline"
                size={26}
                color="#321E0E"
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons
                name="person-circle-outline"
                size={30}
                color="#321E0E"
              />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Subscription Card */}
          <View style={[styles.card, styles.subscriptionCard]}>
            <Text style={styles.cardTitle}>{subscription.type}</Text>
            <Text style={styles.cardSubtitle}>
              Expires: {subscription.expires}
            </Text>
            <View style={styles.coffeeCounter}>
              <Text style={styles.coffeeCount}>
                {subscription.coffeesLeft}/{subscription.coffeesTotal}
              </Text>
              <Text style={styles.coffeeText}> {t("coffeesLeftToday")}</Text>
            </View>
            {/* Add progress bar later */}
            <TouchableOpacity style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>
                {t("renewSubscription")}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Recommended Cafes Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="star-outline" size={20} color="#8B4513" />
              <Text style={styles.cardTitle}>{t("recommendedCafes")}</Text>
            </View>
            {recommendedCafes.map((cafe) => (
              <View key={cafe.id} style={styles.listItem}>
                <View style={styles.listItemContent}>
                  <Text style={styles.listItemTitle}>{cafe.name}</Text>
                  <Text style={styles.listItemSubtitle}>
                    {cafe.distance} - {cafe.rating} ★
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#8B4513" />
              </View>
            ))}
            <TouchableOpacity style={styles.textButton}>
              <Text style={styles.textButtonText}>{t("viewAllCafes")}</Text>
            </TouchableOpacity>
          </View>

          {/* Recent Activity Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="receipt-outline" size={20} color="#8B4513" />
              <Text style={styles.cardTitle}>{t("recentActivity")}</Text>
            </View>
            {recentActivity.map((activity) => (
              <View key={activity.id} style={styles.listItem}>
                <View style={styles.listItemContent}>
                  <Text style={styles.listItemTitle}>{activity.cafe}</Text>
                  <Text style={styles.listItemSubtitle}>{activity.date}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#8B4513" />
              </View>
            ))}
            <TouchableOpacity style={styles.textButton}>
              <Text style={styles.textButtonText}>{t("viewFullHistory")}</Text>
            </TouchableOpacity>
          </View>

          {/* Quick Stats Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="stats-chart-outline" size={20} color="#8B4513" />
              <Text style={styles.cardTitle}>{t("thisWeeksStats")}</Text>
            </View>
            <Text style={styles.statsText}>
              {t("totalCoffees")}:{" "}
              <Text style={styles.statsValue}>
                {quickStats.coffeesThisWeek}
              </Text>{" "}
              ({quickStats.comparison})
            </Text>
            <Text style={styles.statsText}>
              {t("favoriteCafe")}:{" "}
              <Text style={styles.statsValue}>{quickStats.favoriteCafe}</Text>
            </Text>
            {/* Add simple chart later */}
          </View>
        </ScrollView>

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
    paddingBottom: 75, // Adjusted padding for new tab bar height
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 10,
    backgroundColor: "rgba(255, 248, 220, 0.9)", // Light cream, slightly transparent
    borderBottomWidth: 1,
    borderBottomColor: "rgba(139, 69, 19, 0.1)",
  },
  headerLogo: {
    fontSize: 22, // Slightly larger logo text
    fontWeight: "bold",
    color: "#321E0E",
  },
  headerIcons: {
    flexDirection: "row",
  },
  iconButton: {
    marginLeft: 18, // Increased spacing
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 20, // Reduced bottom padding as container handles tab bar space
  },
  card: {
    backgroundColor: "rgba(255, 255, 255, 0.92)", // Slightly more opaque white
    borderRadius: 15,
    padding: 18, // Increased padding
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 }, // Slightly larger shadow
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    borderWidth: 1, // Add subtle border
    borderColor: "rgba(139, 69, 19, 0.1)",
  },
  subscriptionCard: {
    backgroundColor: "rgba(230, 210, 180, 0.95)", // Keep emphasis color
    borderColor: "rgba(139, 69, 19, 0.2)",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15, // Increased spacing
    borderBottomWidth: 1,
    borderBottomColor: "rgba(139, 69, 19, 0.1)",
    paddingBottom: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600", // Slightly bolder
    color: "#321E0E",
    marginLeft: 8, // Add space after icon
  },
  cardSubtitle: {
    fontSize: 14,
    color: "#8B4513",
    marginBottom: 10,
  },
  coffeeCounter: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 15,
  },
  coffeeCount: {
    fontSize: 26, // Larger count
    fontWeight: "bold",
    color: "#321E0E",
  },
  coffeeText: {
    fontSize: 14,
    color: "#8B4513",
    marginLeft: 5,
  },
  primaryButton: {
    backgroundColor: "#8B4513",
    paddingVertical: 14, // Increased padding
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  listItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12, // Increased padding
    borderBottomWidth: 1,
    borderBottomColor: "rgba(139, 69, 19, 0.08)", // Lighter border
  },
  listItemContent: {
    flex: 1, // Allow content to take available space
    marginRight: 10, // Add space before chevron
  },
  listItemTitle: {
    fontSize: 16, // Larger title
    color: "#321E0E",
    marginBottom: 2,
  },
  listItemSubtitle: {
    fontSize: 14,
    color: "#8B4513",
  },
  textButton: {
    marginTop: 15, // Increased spacing
    paddingVertical: 5, // Add padding for easier tapping
    alignItems: "center",
  },
  textButtonText: {
    color: "#8B4513",
    fontSize: 15, // Slightly larger
    fontWeight: "600",
  },
  statsText: {
    fontSize: 15,
    color: "#321E0E",
    marginBottom: 8,
  },
  statsValue: {
    fontWeight: "bold", // Make stats values stand out
  },
});
