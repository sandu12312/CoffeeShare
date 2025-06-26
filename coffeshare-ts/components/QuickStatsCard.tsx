import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLanguage } from "../context/LanguageContext";

interface QuickStatsCardProps {
  coffeesThisWeek: number;
  comparison: string;
  favoriteCafe: string;
}

export default function QuickStatsCard({
  coffeesThisWeek,
  comparison,
  favoriteCafe,
}: QuickStatsCardProps) {
  const { t } = useLanguage();

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Ionicons name="stats-chart-outline" size={20} color="#8B4513" />
        <Text style={styles.cardTitle}>{t("thisWeeksStats")}</Text>
      </View>
      <Text style={styles.statsText}>
        {t("totalCoffees")}:{" "}
        <Text style={styles.statsValue}>{coffeesThisWeek}</Text> ({comparison})
      </Text>
      <Text style={styles.statsText}>
        {t("favoriteCafe")}:{" "}
        <Text style={styles.statsValue}>{favoriteCafe}</Text>
      </Text>
      {/* Adaug un grafic simplu mai târziu */}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "rgba(255, 255, 255, 0.92)", // Alb puțin mai opac
    borderRadius: 15,
    padding: 18, // Padding crescut
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 }, // Umbră puțin mai mare
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    borderWidth: 1, // Adaug margine subtilă
    borderColor: "rgba(139, 69, 19, 0.1)",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15, // Spațiere crescută
    borderBottomWidth: 1,
    borderBottomColor: "rgba(139, 69, 19, 0.1)",
    paddingBottom: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600", // Puțin mai bold
    color: "#321E0E",
    marginLeft: 8, // Adaug spațiu după iconă
  },
  statsText: {
    fontSize: 15,
    color: "#321E0E",
    marginBottom: 8,
  },
  statsValue: {
    fontWeight: "bold", // Fac valorile statisticilor să iasă în evidență
  },
});
