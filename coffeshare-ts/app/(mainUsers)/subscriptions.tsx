import React from "react";
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import BottomTabBar from "../../components/BottomTabBar";

export default function SubscriptionsScreen() {
  // Placeholder data
  const subscriptions = [
    {
      id: "1",
      name: "Student Pack",
      price: "$9.99",
      coffees: 10,
      period: "month",
    },
    {
      id: "2",
      name: "Coffee Lover",
      price: "$19.99",
      coffees: 25,
      period: "month",
    },
    {
      id: "3",
      name: "Office Team",
      price: "$49.99",
      coffees: 70,
      period: "month",
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Subscriptions</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionTitle}>Available Plans</Text>

        {subscriptions.map((plan) => (
          <View key={plan.id} style={styles.planCard}>
            <View style={styles.planHeader}>
              <Text style={styles.planName}>{plan.name}</Text>
              <Text style={styles.planPrice}>{plan.price}</Text>
            </View>

            <View style={styles.planDetails}>
              <View style={styles.detailItem}>
                <Ionicons name="cafe-outline" size={20} color="#8B4513" />
                <Text style={styles.detailText}>{plan.coffees} coffees</Text>
              </View>
              <View style={styles.detailItem}>
                <Ionicons name="calendar-outline" size={20} color="#8B4513" />
                <Text style={styles.detailText}>per {plan.period}</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.subscribeButton}>
              <Text style={styles.subscribeButtonText}>Subscribe</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      <BottomTabBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    padding: 20,
    paddingTop: 10,
    backgroundColor: "rgba(255, 248, 220, 0.85)",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#321E0E",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 80,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#321E0E",
    marginBottom: 15,
  },
  planCard: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  planHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  planName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#321E0E",
  },
  planPrice: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#8B4513",
  },
  planDetails: {
    marginBottom: 15,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  detailText: {
    fontSize: 14,
    color: "#8B4513",
    marginLeft: 10,
  },
  subscribeButton: {
    backgroundColor: "#8B4513",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  subscribeButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});
