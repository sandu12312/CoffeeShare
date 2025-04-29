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
import { useLanguage } from "../../context/LanguageContext";

export default function SubscriptionsScreen() {
  const { t } = useLanguage();

  // Placeholder data
  const subscriptions = [
    {
      id: "1",
      name: "Student Pack",
      price: "$9.99",
      coffees: 10,
      period: t("monthly"),
      popular: false,
    },
    {
      id: "2",
      name: "Coffee Lover",
      price: "$19.99",
      coffees: 25,
      period: t("monthly"),
      popular: true,
    },
    {
      id: "3",
      name: "Office Team",
      price: "$49.99",
      coffees: 70,
      period: t("monthly"),
      popular: false,
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t("subscriptions")}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.pageSubtitle}>{t("choosePerfectPlan")}</Text>

        {subscriptions.map((plan) => (
          <View
            key={plan.id}
            style={[styles.planCard, plan.popular && styles.popularPlanCard]}
          >
            {plan.popular && (
              <View style={styles.popularBadge}>
                <Text style={styles.popularBadgeText}>{t("mostPopular")}</Text>
              </View>
            )}
            <View style={styles.planHeader}>
              <Text style={styles.planName}>{plan.name}</Text>
              <Text style={styles.planPrice}>{plan.price}</Text>
            </View>

            <View style={styles.planDetails}>
              <View style={styles.detailItem}>
                <Ionicons name="cafe-outline" size={20} color="#8B4513" />
                <Text style={styles.detailText}>
                  {t("profile.coffeesCount", { count: plan.coffees })}
                </Text>
              </View>
              <View style={styles.detailItem}>
                <Ionicons name="calendar-outline" size={20} color="#8B4513" />
                <Text style={styles.detailText}>
                  {t("subscriptions.perPeriod", { period: plan.period })}
                </Text>
              </View>
            </View>

            <TouchableOpacity style={styles.subscribeButton}>
              <Text style={styles.subscribeButtonText}>{t("selectPlan")}</Text>
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
    backgroundColor: "#F5F5F5", // Consistent background
    paddingBottom: 75, // Account for tab bar
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 10,
    backgroundColor: "#FFFFFF", // White header background
    borderBottomWidth: 1,
    borderBottomColor: "#E0D6C7",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: "#321E0E",
    textAlign: "center", // Center title
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 20,
  },
  pageSubtitle: {
    fontSize: 16,
    color: "#8B4513",
    textAlign: "center",
    marginBottom: 25, // Increased spacing
  },
  planCard: {
    backgroundColor: "#FFFFFF", // White cards
    borderRadius: 15,
    padding: 20, // Increased padding
    marginBottom: 20, // Consistent spacing
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 3,
    borderWidth: 1,
    borderColor: "rgba(139, 69, 19, 0.1)",
    position: "relative", // For badge positioning
  },
  popularPlanCard: {
    borderColor: "#8B4513", // Highlight popular plan
    borderWidth: 2,
  },
  popularBadge: {
    position: "absolute",
    top: -12,
    alignSelf: "center",
    backgroundColor: "#8B4513",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  popularBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  planHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15, // Increased spacing
  },
  planName: {
    fontSize: 20, // Larger plan name
    fontWeight: "bold",
    color: "#321E0E",
  },
  planPrice: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#8B4513",
  },
  planDetails: {
    marginBottom: 20, // Increased spacing
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8, // Slightly increased spacing
  },
  detailText: {
    fontSize: 15, // Slightly larger text
    color: "#8B4513",
    marginLeft: 10,
  },
  subscribeButton: {
    backgroundColor: "#8B4513",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  subscribeButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});
