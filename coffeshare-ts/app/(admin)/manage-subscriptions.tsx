import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useLanguage } from "../../context/LanguageContext";
import ScreenWrapper from "../../components/ScreenWrapper";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import CoffeePartnerHeader from "../../components/CoffeePartnerHeader";
import AddEditSubscriptionModal from "../../components/AddEditSubscriptionModal";
import {
  SubscriptionService,
  SubscriptionPlan,
} from "../../services/subscriptionService";
import Toast from "react-native-toast-message";
import { ErrorModal } from "../../components/ErrorComponents";
import { useErrorHandler } from "../../hooks/useErrorHandler";

export default function ManageSubscriptionsScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const { errorState, showConfirmModal, hideModal } = useErrorHandler();
  const [subscriptions, setSubscriptions] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);

  // Load subscription plans on mount
  useEffect(() => {
    loadSubscriptions();
  }, []);

  // Load subscription plans from Firebase
  const loadSubscriptions = async () => {
    try {
      setLoading(true);
      const plans = await SubscriptionService.getAllSubscriptionPlans();
      setSubscriptions(plans);
    } catch (error) {
      console.error("Error loading subscriptions:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to load subscription plans",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadSubscriptions();
    setRefreshing(false);
  };

  // Handle add new subscription
  const handleAddSubscription = () => {
    setEditingPlan(null);
    setShowAddEditModal(true);
  };

  // Handle edit subscription
  const handleEditSubscription = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setShowAddEditModal(true);
  };

  // Handle toggle status
  const handleToggleStatus = async (plan: SubscriptionPlan) => {
    try {
      const newStatus = !plan.isActive;
      await SubscriptionService.updateSubscriptionPlan(plan.id!, {
        isActive: newStatus,
      });

      // Update local state
      setSubscriptions((prevSubs) =>
        prevSubs.map((s) =>
          s.id === plan.id ? { ...s, isActive: newStatus } : s
        )
      );

      Toast.show({
        type: "success",
        text1: newStatus ? "Plan Activated" : "Plan Deactivated",
        text2: `${plan.name} has been ${
          newStatus ? "activated" : "deactivated"
        }`,
      });
    } catch (error) {
      console.error("Error toggling plan status:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to update plan status",
      });
    }
  };

  // Handle delete subscription
  const handleDeleteSubscription = (plan: SubscriptionPlan) => {
    showConfirmModal(
      "Delete Subscription Plan",
      `Are you sure you want to delete "${plan.name}"? This action cannot be undone.`,
      async () => {
        try {
          await SubscriptionService.deleteSubscriptionPlan(plan.id!);

          Toast.show({
            type: "success",
            text1: "Plan Deleted",
            text2: `${plan.name} has been deleted`,
          });

          // Reload subscriptions
          loadSubscriptions();
        } catch (error) {
          console.error("Error deleting plan:", error);
          Toast.show({
            type: "error",
            text1: "Error",
            text2: "Failed to delete plan",
          });
        }
      }
    );
  };

  // Handle modal success
  const handleModalSuccess = () => {
    loadSubscriptions();
  };

  // Format price
  const formatPrice = (price: number) => {
    return `${price.toFixed(2)} RON`;
  };

  // Render subscription item
  const renderSubscriptionItem = ({ item }: { item: SubscriptionPlan }) => {
    const statusColor = item.isActive ? "#4CAF50" : "#9E9E9E";

    return (
      <View style={styles.subCard}>
        <View style={styles.subInfoContainer}>
          <View style={styles.nameContainer}>
            <Text style={styles.subName}>{item.name}</Text>
            {item.popular && (
              <View style={styles.popularBadge}>
                <Text style={styles.popularText}>POPULAR</Text>
              </View>
            )}
            {item.tag && (
              <View style={styles.tagBadge}>
                <Text style={styles.tagText}>{item.tag}</Text>
              </View>
            )}
          </View>
          <Text style={styles.subDetails}>
            Price: {formatPrice(item.price)}/month
          </Text>
          <Text style={styles.subDetails}>Beans: {item.credits} credits</Text>
          {item.description && (
            <Text style={styles.subDescription}>{item.description}</Text>
          )}
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>
              {item.isActive ? "Active" : "Inactive"}
            </Text>
          </View>
        </View>
        <View style={styles.subActions}>
          <TouchableOpacity
            onPress={() => handleEditSubscription(item)}
            style={styles.actionButton}
          >
            <Ionicons name="pencil-outline" size={22} color="#757575" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleDeleteSubscription(item)}
            style={styles.actionButton}
          >
            <Ionicons name="trash-outline" size={22} color="#E53935" />
          </TouchableOpacity>
          <Switch
            trackColor={{ false: "#767577", true: "#81C784" }}
            thumbColor={item.isActive ? "#4CAF50" : "#f4f3f4"}
            ios_backgroundColor="#3e3e3e"
            onValueChange={() => handleToggleStatus(item)}
            value={item.isActive || false}
            style={styles.switchStyle}
          />
        </View>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <ScreenWrapper>
        <CoffeePartnerHeader title={"Manage Subscriptions"} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B4513" />
          <Text style={styles.loadingText}>Loading subscription plans...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <CoffeePartnerHeader title={"Manage Subscriptions"} />

      {/* Add Subscription Button */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={handleAddSubscription}
      >
        <Ionicons name="add-circle-outline" size={22} color="#FFFFFF" />
        <Text style={styles.addButtonText}>Add New Subscription Plan</Text>
      </TouchableOpacity>

      {/* Subscription List */}
      <FlatList
        data={subscriptions}
        renderItem={renderSubscriptionItem}
        keyExtractor={(item) => item.id || ""}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Ionicons name="albums-outline" size={50} color="#CCC" />
            <Text style={styles.emptyListText}>
              No subscription plans created yet.
            </Text>
            <Text style={styles.emptySubtext}>
              Create your first plan to start offering subscriptions!
            </Text>
          </View>
        )}
      />

      {/* Add/Edit Modal */}
      <AddEditSubscriptionModal
        visible={showAddEditModal}
        onClose={() => {
          setShowAddEditModal(false);
          setEditingPlan(null);
        }}
        onSuccess={handleModalSuccess}
        editPlan={editingPlan}
      />

      {/* Error Components */}
      <ErrorModal
        visible={errorState.modal.visible}
        title={errorState.modal.title}
        message={errorState.modal.message}
        type={errorState.modal.type}
        onDismiss={hideModal}
        primaryAction={errorState.modal.primaryAction}
        secondaryAction={errorState.modal.secondaryAction}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#8B4513",
  },
  addButton: {
    backgroundColor: "#4CAF50",
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
    alignItems: "flex-start",
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
  nameContainer: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    marginBottom: 5,
  },
  subName: {
    fontSize: 17,
    fontWeight: "700",
    color: "#333",
    marginRight: 8,
  },
  popularBadge: {
    backgroundColor: "#FF9800",
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    marginRight: 6,
  },
  popularText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "bold",
  },
  tagBadge: {
    backgroundColor: "#2196F3",
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  tagText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "600",
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
  statusBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
    alignSelf: "flex-start",
    marginTop: 5,
  },
  statusText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "bold",
  },
  subActions: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 80,
  },
  actionButton: {
    padding: 6,
    marginBottom: 5,
  },
  switchStyle: {
    transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }],
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
  emptySubtext: {
    textAlign: "center",
    marginTop: 8,
    fontSize: 14,
    color: "#AAA",
  },
});
