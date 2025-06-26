import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLanguage } from "../context/LanguageContext";

interface SubscriptionCardProps {
  type: string;
  expires: string;
  beansLeft: number;
  beansTotal: number;
  onRenew: () => void;
  isLoading?: boolean;
}

export default function SubscriptionCard({
  type,
  expires,
  beansLeft,
  beansTotal,
  onRenew,
  isLoading = false,
}: SubscriptionCardProps) {
  const { t } = useLanguage();

  const progress = beansTotal > 0 ? (beansLeft / beansTotal) * 100 : 0;

  // Randez ikonițele de boabe pe baza raportului dintre boabele rămase și totalul de boabe
  const renderBeanIcons = () => {
    const totalIcons = 5; // Numărul maxim de ikoniţe de afişat
    const filledIcons = Math.min(
      totalIcons,
      Math.floor((beansLeft / beansTotal) * totalIcons) || 0
    );

    const icons = [];

    for (let i = 0; i < totalIcons; i++) {
      icons.push(
        <Ionicons
          key={i}
          name="cafe"
          size={18}
          color={i < filledIcons ? "#FFFFFF" : "rgba(255, 255, 255, 0.3)"}
          style={[styles.beanIcon, i >= filledIcons && { opacity: 0.4 }]}
        />
      );
    }

    return <View style={styles.beanIconsContainer}>{icons}</View>;
  };

  if (isLoading) {
    return (
      <View style={styles.card}>
        <ActivityIndicator size="large" color="#FFFFFF" />
        <Text style={styles.loadingText}>{t("common.loading")}</Text>
      </View>
    );
  }

  const noSubscription = !type || type === t("dashboard.noSubscription");

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Ionicons name="cafe" size={24} color="#FFFFFF" />
        <Text style={styles.cardTitle}>{type}</Text>
      </View>
      <Text style={styles.expiresText}>
        {t("subscriptions.expires")}: {expires}
      </Text>

      <View style={styles.coffeeInfoContainer}>
        <View style={styles.coffeeCounter}>
          <Text style={styles.coffeeCount}>{beansLeft}</Text>
          <Text style={styles.coffeeTotal}> / {beansTotal}</Text>
        </View>
        <Text style={styles.coffeeText}>
          {t("subscriptions.beansRemaining")}
        </Text>
      </View>

      {!noSubscription && renderBeanIcons()}

      <View style={styles.progressContainer}>
        <View style={styles.progressBarBackground}>
          <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
        </View>
        {progress <= 25 && (
          <Text style={styles.lowBeansWarning}>
            {t("subscriptions.lowOnBeans")}
          </Text>
        )}
      </View>

      <TouchableOpacity
        style={[
          styles.renewButton,
          noSubscription && styles.getSubscriptionButton,
        ]}
        onPress={onRenew}
      >
        <Text style={styles.renewButtonText}>
          {noSubscription
            ? t("subscriptions.getSubscription")
            : t("subscriptions.renewSubscription")}
        </Text>
        <Ionicons
          name={
            noSubscription ? "add-circle-outline" : "refresh-circle-outline"
          }
          size={20}
          color="#8B4513"
        />
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
    minHeight: 200,
    justifyContent: "center",
  },
  loadingText: {
    color: "#FFFFFF",
    textAlign: "center",
    marginTop: 10,
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
  beanIconsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 10,
  },
  beanIcon: {
    marginHorizontal: 4,
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    borderRadius: 4,
    overflow: "hidden",
    marginTop: 4,
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 4,
  },
  lowBeansWarning: {
    color: "#FFF8DC",
    fontSize: 12,
    fontWeight: "bold",
    marginTop: 6,
    textAlign: "right",
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
  getSubscriptionButton: {
    backgroundColor: "#FFF8E0",
  },
  renewButtonText: {
    color: "#8B4513",
    fontSize: 16,
    fontWeight: "bold",
    marginRight: 8,
  },
});
