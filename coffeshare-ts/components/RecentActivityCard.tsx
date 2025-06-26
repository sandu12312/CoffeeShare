import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLanguage } from "../context/LanguageContext";

interface Activity {
  id: string;
  cafe: string;
  date: string;
  beansUsed?: number;
  tokenType?: "instant" | "checkout";
  transactionDescription?: string;
  transactionIcon?: string;
  qrTokenId?: string;
}

interface RecentActivityCardProps {
  activities: Activity[];
  onViewAll: () => void;
  onActivityPress: (activity: Activity) => void;
}

export default function RecentActivityCard({
  activities,
  onViewAll,
  onActivityPress,
}: RecentActivityCardProps) {
  const { t } = useLanguage();

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Ionicons name="receipt-outline" size={20} color="#8B4513" />
        <Text style={styles.cardTitle}>{t("recentActivity")}</Text>
      </View>
      {activities.map((activity) => (
        <TouchableOpacity
          key={activity.id}
          style={styles.listItem}
          onPress={() => onActivityPress(activity)}
        >
          <View style={styles.listItemIcon}>
            <Ionicons
              name={(activity.transactionIcon as any) || "cafe-outline"}
              size={24}
              color="#8B4513"
            />
          </View>
          <View style={styles.listItemContent}>
            <Text style={styles.listItemTitle}>{activity.cafe}</Text>
            <Text style={styles.listItemSubtitle}>
              {activity.transactionDescription || activity.date}
            </Text>
            <Text style={styles.listItemDate}>{activity.date}</Text>
          </View>
          <View style={styles.listItemBeans}>
            <View style={styles.beansContainer}>
              <Ionicons name="ellipse" size={12} color="#8B4513" />
              <Text style={styles.beansText}>{activity.beansUsed || 1}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#8B4513" />
          </View>
        </TouchableOpacity>
      ))}
      <TouchableOpacity style={styles.textButton} onPress={onViewAll}>
        <Text style={styles.textButtonText}>{t("viewFullHistory")}</Text>
      </TouchableOpacity>
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
  listItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12, // Padding crescut
    borderBottomWidth: 1,
    borderBottomColor: "rgba(139, 69, 19, 0.08)", // Margine mai deschisă
  },
  listItemIcon: {
    width: 40,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  listItemContent: {
    flex: 1, // Permit conținutului să ocupe spațiul disponibil
    marginRight: 10, // Adaug spațiu înainte de chevron
  },
  listItemTitle: {
    fontSize: 16, // Titlu mai mare
    color: "#321E0E",
    marginBottom: 2,
    fontWeight: "600",
  },
  listItemSubtitle: {
    fontSize: 13,
    color: "#8B4513",
    fontWeight: "500",
    marginBottom: 2,
  },
  listItemDate: {
    fontSize: 12,
    color: "#999",
  },
  listItemBeans: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  beansContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F4EF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  beansText: {
    fontSize: 12,
    color: "#8B4513",
    fontWeight: "600",
  },
  textButton: {
    marginTop: 15, // Spațiere crescută
    paddingVertical: 5, // Adaug padding pentru tap mai ușor
    alignItems: "center",
  },
  textButtonText: {
    color: "#8B4513",
    fontSize: 15, // Puțin mai mare
    fontWeight: "600",
  },
});
