import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Switch,
} from "react-native";
import { useLanguage } from "../../context/LanguageContext";
import ScreenWrapper from "../../components/ScreenWrapper";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import CoffeePartnerHeader from "../../components/CoffeePartnerHeader";

// --- Dummy Data ---
type SubscriptionStatus = "Active" | "Inactive";

interface SubscriptionPlan {
  id: string;
  name: string;
  priceMonthly: number;
  priceYearly?: number; // Optional yearly price
  coffeesPerDay: number | "Unlimited";
  description: string;
  status: SubscriptionStatus;
}

const DUMMY_SUBSCRIPTIONS: SubscriptionPlan[] = [
  {
    id: "sub1",
    name: "Student Pack",
    priceMonthly: 50,
    coffeesPerDay: 2,
    description: "Perfect pentru studenți, acces la majoritatea cafenelelor.",
    status: "Active",
  },
  {
    id: "sub2",
    name: "Elite",
    priceMonthly: 90,
    priceYearly: 900,
    coffeesPerDay: 3,
    description: "Acces la produse premium și oferte speciale.",
    status: "Active",
  },
  {
    id: "sub3",
    name: "Premium",
    priceMonthly: 150,
    priceYearly: 1500,
    coffeesPerDay: "Unlimited",
    description: "Cafele nelimitate și acces VIP.",
    status: "Active",
  },
  {
    id: "sub4",
    name: "Weekend Warrior",
    priceMonthly: 40,
    coffeesPerDay: 2, // Only on Sat/Sun - logic implied
    description: "Două cafele pe zi în weekend.",
    status: "Inactive",
  },
];
// ------------------

export default function ManageSubscriptionsScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const [subscriptions, setSubscriptions] =
    useState<SubscriptionPlan[]>(DUMMY_SUBSCRIPTIONS);

  // --- Action Handlers ---
  const handleAddSubscription = () => {
    // TODO: Navigate to Add/Edit Subscription screen
    Alert.alert("Adaugă Abonament", "Funcționalitate în curând!");
  };

  const handleEditSubscription = (sub: SubscriptionPlan) => {
    // TODO: Navigate to Add/Edit Subscription screen with data
    Alert.alert(
      "Editează Abonament",
      `Funcționalitate pentru ${sub.name} în curând!`
    );
  };

  const handleToggleStatus = (sub: SubscriptionPlan) => {
    // TODO: Implement status toggle logic (update state/backend)
    const newStatus = sub.status === "Active" ? "Inactive" : "Active";
    setSubscriptions((prevSubs) =>
      prevSubs.map((s) => (s.id === sub.id ? { ...s, status: newStatus } : s))
    );
    Alert.alert(
      sub.status === "Active"
        ? "Dezactivează Abonament"
        : "Activează Abonament",
      `Ai ${sub.status === "Active" ? "dezactivat" : "activat"} ${
        sub.name
      }. (Simulat)`
    );
  };
  // ---------------------

  // --- Render Item ---
  const renderSubscriptionItem = ({ item }: { item: SubscriptionPlan }) => {
    const statusColor = item.status === "Active" ? "#4CAF50" : "#9E9E9E";
    const coffeesText =
      item.coffeesPerDay === "Unlimited"
        ? "Nelimitat"
        : `${item.coffeesPerDay}`;

    return (
      <View style={styles.subCard}>
        <View style={styles.subInfoContainer}>
          <Text style={styles.subName}>{item.name}</Text>
          <Text style={styles.subDetails}>
            Preț: ${item.priceMonthly}/lună{" "}
            {item.priceYearly ? `($${item.priceYearly}/an)` : ""}
          </Text>
          <Text style={styles.subDetails}>Cafele: {coffeesText}/zi</Text>
          <Text style={styles.subDescription}>{item.description}</Text>
          <View style={[styles.badge, { backgroundColor: statusColor }]}>
            <Text style={styles.badgeText}>{item.status}</Text>
          </View>
        </View>
        <View style={styles.subActions}>
          <TouchableOpacity
            onPress={() => handleEditSubscription(item)}
            style={styles.actionButton}
          >
            <Ionicons name="pencil-outline" size={22} color="#757575" />
          </TouchableOpacity>
          <Switch
            trackColor={{ false: "#767577", true: "#81C784" }} // Lighter green for active track
            thumbColor={item.status === "Active" ? "#4CAF50" : "#f4f3f4"}
            ios_backgroundColor="#3e3e3e"
            onValueChange={() => handleToggleStatus(item)} // Use the handler
            value={item.status === "Active"}
            style={styles.switchStyle}
          />
        </View>
      </View>
    );
  };
  // -------------------

  return (
    <ScreenWrapper>
      {/* TODO: Add translation key 'manageSubscriptionsTitle' */}
      <CoffeePartnerHeader title={"Gestionează Abonamente"} />

      {/* Add Subscription Button */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={handleAddSubscription}
      >
        <Ionicons name="add-circle-outline" size={22} color="#FFFFFF" />
        {/* TODO: Add translation key 'addNewSubscription' */}
        <Text style={styles.addButtonText}>Adaugă Abonament Nou</Text>
      </TouchableOpacity>

      {/* Subscription List */}
      <FlatList
        data={subscriptions}
        renderItem={renderSubscriptionItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Ionicons name="sad-outline" size={50} color="#CCC" />
            <Text style={styles.emptyListText}>
              Niciun abonament configurat.
            </Text>
          </View>
        )}
      />
    </ScreenWrapper>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  addButton: {
    backgroundColor: "#4CAF50", // Green for add
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    marginHorizontal: 15,
    marginTop: 15,
    marginBottom: 5,
    borderRadius: 8,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  listContainer: {
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 20,
  },
  subCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    marginBottom: 12,
    padding: 15,
    flexDirection: "row",
    alignItems: "flex-start", // Align items to the top
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  subInfoContainer: {
    flex: 1,
    marginRight: 10,
  },
  subName: {
    fontSize: 17,
    fontWeight: "700",
    color: "#333",
    marginBottom: 5,
  },
  subDetails: {
    fontSize: 14,
    color: "#555",
    marginBottom: 4,
  },
  subDescription: {
    fontSize: 13,
    color: "#777",
    marginBottom: 8,
    fontStyle: "italic",
  },
  badge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
    alignSelf: "flex-start",
    marginTop: 5,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "bold",
  },
  subActions: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 60, // Ensure space for switch and button
  },
  actionButton: {
    padding: 6,
    marginBottom: 10, // Space between edit and switch
  },
  switchStyle: {
    transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }], // Make switch slightly smaller
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 80,
    paddingHorizontal: 20,
  },
  emptyListText: {
    textAlign: "center",
    marginTop: 15,
    fontSize: 17,
    fontWeight: "600",
    color: "#888",
  },
});
// --------------
