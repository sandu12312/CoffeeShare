import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLanguage } from "../context/LanguageContext";

interface SubscriptionCardProps {
  type: string;
  expires: string;
  coffeesLeft: number;
  coffeesTotal: number;
  onRenew: () => void;
}

export default function SubscriptionCard({
  type,
  expires,
  coffeesLeft,
  coffeesTotal,
  onRenew,
}: SubscriptionCardProps) {
  const { t } = useLanguage();

  const progress = coffeesTotal > 0 ? (coffeesLeft / coffeesTotal) * 100 : 0;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Ionicons name="star-outline" size={24} color="#FFFFFF" />
        <Text style={styles.cardTitle}>{type}</Text>
      </View>
      <Text style={styles.expiresText}>Expires: {expires}</Text>

      <View style={styles.coffeeInfoContainer}>
        <View style={styles.coffeeCounter}>
          <Text style={styles.coffeeCount}>{coffeesLeft}</Text>
          <Text style={styles.coffeeTotal}> / {coffeesTotal}</Text>
        </View>
        <Text style={styles.coffeeText}>{t("coffeesLeftToday")}</Text>
      </View>

      <View style={styles.progressBarBackground}>
        <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
      </View>

      <TouchableOpacity style={styles.renewButton} onPress={onRenew}>
        <Text style={styles.renewButtonText}>{t("renewSubscription")}</Text>
        <Ionicons name="refresh-circle-outline" size={20} color="#8B4513" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#8B4513",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginLeft: 10,
  },
  expiresText: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: 18,
  },
  coffeeInfoContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  coffeeCounter: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  coffeeCount: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  coffeeTotal: {
    fontSize: 18,
    color: "rgba(255, 255, 255, 0.8)",
    marginLeft: 2,
  },
  coffeeText: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    alignSelf: "flex-end",
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 20,
    marginTop: 4,
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 4,
  },
  renewButton: {
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  renewButtonText: {
    color: "#8B4513",
    fontSize: 16,
    fontWeight: "bold",
    marginRight: 8,
  },
});
