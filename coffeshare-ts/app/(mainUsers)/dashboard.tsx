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

export default function Dashboard() {
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
              <Text style={styles.coffeeText}> coffees left today</Text>
            </View>
            {/* Add progress bar later */}
            <TouchableOpacity style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>Renew Subscription</Text>
            </TouchableOpacity>
          </View>

          {/* Recommended Cafes Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Recommended Cafes</Text>
            {/* Replace with horizontal carousel later */}
            {recommendedCafes.map((cafe) => (
              <View key={cafe.id} style={styles.cafeItem}>
                <Text style={styles.cafeName}>{cafe.name}</Text>
                <Text style={styles.cafeDetails}>
                  {cafe.distance} - {cafe.rating} ★
                </Text>
              </View>
            ))}
            <TouchableOpacity style={styles.textButton}>
              <Text style={styles.textButtonText}>View All Cafes</Text>
            </TouchableOpacity>
          </View>

          {/* Recent Activity Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Recent Activity</Text>
            {recentActivity.map((activity) => (
              <View key={activity.id} style={styles.activityItem}>
                <Text style={styles.activityCafe}>{activity.cafe}</Text>
                <Text style={styles.activityDate}>{activity.date}</Text>
              </View>
            ))}
            <TouchableOpacity style={styles.textButton}>
              <Text style={styles.textButtonText}>View Full History</Text>
            </TouchableOpacity>
          </View>

          {/* Quick Stats Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>This Week's Stats</Text>
            <Text style={styles.statsText}>
              Total Coffees: {quickStats.coffeesThisWeek} (
              {quickStats.comparison})
            </Text>
            <Text style={styles.statsText}>
              Favorite Cafe: {quickStats.favoriteCafe}
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
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 10, // Adjust as needed for status bar height
    paddingBottom: 10,
    backgroundColor: "rgba(255, 248, 220, 0.85)", // Light cream, slightly transparent
  },
  headerLogo: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#321E0E",
  },
  headerIcons: {
    flexDirection: "row",
  },
  iconButton: {
    marginLeft: 15,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 80, // Ensure content doesn't hide behind bottom nav
  },
  card: {
    backgroundColor: "rgba(255, 255, 255, 0.9)", // Semi-transparent white
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  subscriptionCard: {
    backgroundColor: "rgba(230, 210, 180, 0.95)", // Slightly darker cream for emphasis
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#321E0E",
    marginBottom: 10,
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
    fontSize: 24,
    fontWeight: "bold",
    color: "#321E0E",
  },
  coffeeText: {
    fontSize: 14,
    color: "#8B4513",
  },
  primaryButton: {
    backgroundColor: "#8B4513",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  cafeItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(139, 69, 19, 0.1)",
  },
  cafeName: {
    fontSize: 15,
    color: "#321E0E",
  },
  cafeDetails: {
    fontSize: 14,
    color: "#8B4513",
  },
  textButton: {
    marginTop: 10,
    alignItems: "center",
  },
  textButtonText: {
    color: "#8B4513",
    fontSize: 14,
    fontWeight: "500",
  },
  activityItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(139, 69, 19, 0.1)",
  },
  activityCafe: {
    fontSize: 15,
    color: "#321E0E",
  },
  activityDate: {
    fontSize: 14,
    color: "#8B4513",
  },
  statsText: {
    fontSize: 15,
    color: "#321E0E",
    marginBottom: 5,
  },
});
