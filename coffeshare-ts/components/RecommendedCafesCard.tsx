import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLanguage } from "../context/LanguageContext";

interface Cafe {
  id: string;
  name: string;
  distance: string;
  rating: number;
}

interface RecommendedCafesCardProps {
  cafes: Cafe[];
  onViewAll: () => void;
  onCafePress: (cafe: Cafe) => void;
}

export default function RecommendedCafesCard({
  cafes,
  onViewAll,
  onCafePress,
}: RecommendedCafesCardProps) {
  const { t } = useLanguage();

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Ionicons name="star-outline" size={20} color="#8B4513" />
        <Text style={styles.cardTitle}>{t("recommendedCafes")}</Text>
      </View>
      {cafes.map((cafe) => (
        <TouchableOpacity
          key={cafe.id}
          style={styles.listItem}
          onPress={() => onCafePress(cafe)}
        >
          <View style={styles.listItemContent}>
            <Text style={styles.listItemTitle}>{cafe.name}</Text>
            <Text style={styles.listItemSubtitle}>
              {cafe.distance} - {cafe.rating} ★
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#8B4513" />
        </TouchableOpacity>
      ))}
      <TouchableOpacity style={styles.textButton} onPress={onViewAll}>
        <Text style={styles.textButtonText}>{t("viewAllCafes")}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
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
});
