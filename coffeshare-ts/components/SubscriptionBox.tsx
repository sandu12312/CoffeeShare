import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLanguage } from "../context/LanguageContext";

interface SubscriptionBoxProps {
  title: string;
  price: string;
  description: string;
  features: string[];
  isPopular?: boolean;
  onSelect: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  color?: string;
}

export default function SubscriptionBox({
  title,
  price,
  description,
  features,
  isPopular = false,
  onSelect,
  icon = "star-outline",
  color = "#8B4513",
}: SubscriptionBoxProps) {
  const { t } = useLanguage();

  return (
    <View style={[styles.box, { borderColor: color }]}>
      {isPopular && (
        <View style={[styles.popularBadge, { backgroundColor: color }]}>
          <Text style={styles.popularText}>{t("popular")}</Text>
        </View>
      )}

      <View style={styles.header}>
        <Ionicons name={icon} size={24} color={color} />
        <Text style={[styles.title, { color }]}>{title}</Text>
      </View>

      <Text style={styles.price}>{price}</Text>
      <Text style={styles.description}>{description}</Text>

      <View style={styles.featuresContainer}>
        {features.map((feature, index) => (
          <View key={index} style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={16} color={color} />
            <Text style={styles.featureText}>{feature}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.selectButton, { backgroundColor: color }]}
        onPress={onSelect}
      >
        <Text style={styles.selectButtonText}>{t("select")}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: "relative",
  },
  popularBadge: {
    position: "absolute",
    top: -12,
    right: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  popularText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginLeft: 10,
  },
  price: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#321E0E",
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: "#666666",
    marginBottom: 16,
  },
  featuresContainer: {
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    color: "#333333",
    marginLeft: 8,
  },
  selectButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  selectButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});
