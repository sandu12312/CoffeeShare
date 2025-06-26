import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLanguage } from "../context/LanguageContext";

interface SubscriptionBoxProps {
  id: string;
  title: string;
  price: number;
  credits: number;
  description?: string;
  isPopular?: boolean;
  tag?: string;
  isSelected: boolean;
  onSelect: () => void;
  animatedScale?: Animated.Value;
  icon?: keyof typeof Ionicons.glyphMap;
  color?: string;
}

export default function SubscriptionBox({
  id,
  title,
  price,
  credits,
  description,
  isPopular = false,
  tag,
  isSelected,
  onSelect,
  animatedScale,
  icon = "cafe-outline",
  color = "#8B4513",
}: SubscriptionBoxProps) {
  const { t } = useLanguage();

  // Aleg ikoniţa pe baza boabelor/creditelor
  const getIcon = (): keyof typeof Ionicons.glyphMap => {
    if (icon) return icon;
    if (credits <= 50) return "cafe-outline";
    if (credits <= 100) return "cafe";
    return "flame";
  };

  // Aleg culoarea pe baza selecţiei sau popularităţii
  const getCardColor = () => {
    if (isSelected) return color;
    if (isPopular) return "#FF9800";
    return "#E0E0E0";
  };

  return (
    <Animated.View
      style={[
        styles.box,
        {
          transform: [{ scale: animatedScale || 1 }],
          borderColor: isSelected ? color : "#E0E0E0",
        },
      ]}
    >
      {(isPopular || tag) && (
        <View
          style={[
            styles.badge,
            { backgroundColor: isPopular ? "#FF9800" : "#2196F3" },
          ]}
        >
          <Text style={styles.badgeText}>
            {tag || t("subscriptions.popular")}
          </Text>
        </View>
      )}

      <TouchableOpacity onPress={onSelect} activeOpacity={0.8}>
        <View style={styles.iconContainer}>
          <Ionicons
            name={getIcon()}
            size={40}
            color={isSelected ? color : "#666"}
          />
        </View>

        <Text style={[styles.title, isSelected && { color }]}>{title}</Text>

        <View style={styles.beansContainer}>
          <Text style={[styles.beansAmount, isSelected && { color }]}>
            {credits}
          </Text>
          <Text style={styles.beansLabel}>{t("subscriptions.beans")}</Text>
        </View>

        <Text style={styles.price}>
          {price.toFixed(0)} RON
          <Text style={styles.priceLabel}>{t("subscriptions.perMonth")}</Text>
        </Text>

        {description && (
          <Text style={styles.description} numberOfLines={2}>
            {description}
          </Text>
        )}

        <View
          style={[
            styles.selectIndicator,
            isSelected && styles.selectIndicatorActive,
          ]}
        >
          {isSelected && (
            <Ionicons name="checkmark-circle" size={24} color={color} />
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  box: {
    width: "30%",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    borderWidth: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: "relative",
    minHeight: 200,
  },
  badge: {
    position: "absolute",
    top: -8,
    right: -8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    zIndex: 1,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "bold",
  },
  iconContainer: {
    alignItems: "center",
    marginBottom: 8,
    marginTop: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
    color: "#333",
    minHeight: 36,
  },
  beansContainer: {
    alignItems: "center",
    marginBottom: 8,
  },
  beansAmount: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  beansLabel: {
    fontSize: 12,
    color: "#666",
  },
  price: {
    fontSize: 16,
    fontWeight: "600",
    color: "#321E0E",
    textAlign: "center",
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 12,
    fontWeight: "normal",
    color: "#666",
  },
  description: {
    fontSize: 11,
    color: "#666",
    textAlign: "center",
    marginTop: 4,
    lineHeight: 16,
  },
  selectIndicator: {
    position: "absolute",
    bottom: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#F0F0F0",
    alignItems: "center",
    justifyContent: "center",
  },
  selectIndicatorActive: {
    backgroundColor: "transparent",
  },
});
