import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  Keyboard,
  ActivityIndicator,
} from "react-native";
import { useLanguage } from "../../context/LanguageContext";
import ScreenWrapper from "../../components/ScreenWrapper";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import CoffeePartnerHeader from "../../components/CoffeePartnerHeader";
import adminService, { CafeData } from "../../services/adminService";
import { Timestamp } from "firebase/firestore"; // Import Timestamp

// Combined type for list items
interface ListItemBase {
  _type: "request" | "cafe";
  id: string;
  businessName: string;
  email: string;
  createdAt: Timestamp; // Ensure createdAt is available for sorting
  address?: string;
  phone?: string;
  contactName?: string;
}

interface RequestListItem extends ListItemBase {
  _type: "request";
  status: "partnership_request";
}

interface CafeListItem extends ListItemBase, CafeData {
  _type: "cafe";
  // Inherits status: 'pending' | 'active' | 'inactive' | 'rejected' from CafeData
}

type ListItem = RequestListItem | CafeListItem;

type CafeStatusFilter =
  | "all"
  | "pending"
  | "active"
  | "inactive"
  | "rejected"
  | "partnership_request";

export default function ManageCafesScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const [allEntries, setAllEntries] = useState<ListItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<CafeStatusFilter>("all");
  const [loading, setLoading] = useState(true);
  const [actionInProgressId, setActionInProgressId] = useState<string | null>(
    null
  );

  // Load requests and cafes
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch both partnership requests and cafes in parallel
      const [requestsResult, cafesResult] = await Promise.all([
        adminService.getPartnershipRequests().catch((error) => {
          console.error("Error fetching partnership requests:", error);
          return []; // Return empty array on error
        }),
        filterStatus === "all" || filterStatus === "partnership_request"
          ? adminService.getAllCafes().catch((error) => {
              console.error("Error fetching all cafes:", error);
              return { cafes: [], lastVisible: null }; // Return empty result on error
            })
          : adminService.getCafesByStatus(filterStatus).catch((error) => {
              console.error(`Error fetching ${filterStatus} cafes:`, error);
              return { cafes: [], lastVisible: null }; // Return empty result on error
            }),
      ]);

      // Combine and sort by creation date
      const requests = requestsResult.map((request) => ({
        ...request,
        _type: "request" as const,
        status: "partnership_request" as const,
      }));

      const cafes = cafesResult.cafes.map((cafe) => ({
        ...cafe,
        _type: "cafe" as const,
      }));

      // Filter based on status if needed
      let filteredCafes = cafes;
      if (filterStatus === "partnership_request") {
        // If filtering for partnership requests, only show requests
        filteredCafes = [];
      } else if (filterStatus !== "all") {
        // If filtering for a specific cafe status, filter the cafes
        filteredCafes = cafes.filter((cafe) => cafe.status === filterStatus);
      }

      const combinedItems = [...requests, ...filteredCafes].sort((a, b) => {
        const dateA = a.createdAt || Timestamp.now();
        const dateB = b.createdAt || Timestamp.now();
        return dateB.toMillis() - dateA.toMillis();
      });

      // Filter based on search query if provided
      const searchFilteredItems = searchQuery
        ? combinedItems.filter(
            (item) =>
              item.businessName
                .toLowerCase()
                .includes(searchQuery.toLowerCase()) ||
              (item.address &&
                item.address.toLowerCase().includes(searchQuery.toLowerCase()))
          )
        : combinedItems;

      setAllEntries(searchFilteredItems);
    } catch (error) {
      console.error("Error loading data:", error);
      Alert.alert("Error", "Failed to load data. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, [filterStatus, searchQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter logic based on filterStatus and searchQuery
  const filteredEntries = useMemo(() => {
    let filtered = allEntries;

    // Apply status filter
    if (filterStatus !== "all") {
      filtered = filtered.filter((entry) => entry.status === filterStatus);
    }

    // Apply search query filter
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter((entry) => {
        const nameMatch = entry.businessName.toLowerCase().includes(lowerQuery);
        const addressMatch = entry.address
          ? entry.address.toLowerCase().includes(lowerQuery)
          : false;
        const emailMatch = entry.email.toLowerCase().includes(lowerQuery); // Include email in search
        return nameMatch || addressMatch || emailMatch;
      });
    }

    return filtered;
  }, [allEntries, filterStatus, searchQuery]);

  // --- Action Handlers ---

  // Handler for approving a PARTNERSHIP REQUEST (transfers it to an ACTIVE cafe)
  const handleApproveRequest = async (request: ListItem) => {
    setActionInProgressId(request.id);
    try {
      await adminService.transferPartnershipRequestToCafe(request.id);
      Alert.alert(
        "Success",
        `${request.businessName} approved and added as an active cafe.`
      );
      loadData(); // Refresh data
    } catch (error) {
      console.error("Error approving request:", error);
      Alert.alert("Error", "Failed to approve request. Please try again.");
      setActionInProgressId(null);
    }
  };

  // Handler for rejecting a PARTNERSHIP REQUEST (deletes it)
  const handleRejectRequest = async (request: ListItem) => {
    setActionInProgressId(request.id);
    Alert.alert(
      "Confirm Reject",
      `Are you sure you want to reject the request from ${request.businessName}? This will delete the request.`,
      [
        {
          text: "Cancel",
          style: "cancel",
          onPress: () => setActionInProgressId(null),
        },
        {
          text: "Reject & Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await adminService.deletePartnershipRequest(request.id);
              Alert.alert(
                "Success",
                `Request from ${request.businessName} rejected and deleted.`
              );
              loadData(); // Refresh data
            } catch (error) {
              console.error("Error rejecting request:", error);
              Alert.alert(
                "Error",
                "Failed to reject request. Please try again."
              );
            } finally {
              setActionInProgressId(null);
            }
          },
        },
      ]
    );
  };

  // Handler for activating a PENDING CAFE
  const handleActivateCafe = async (cafe: ListItem) => {
    if (!cafe.email || !cafe.contactName) {
      Alert.alert(
        "Error",
        "Cannot activate cafe: Missing email or contact name."
      );
      return;
    }
    setActionInProgressId(cafe.id);
    try {
      console.log(
        `Activating cafe: ${cafe.id} with email: ${cafe.email} and contact: ${cafe.contactName}`
      );
      await adminService.activateCafePartner(
        cafe.id,
        cafe.email,
        cafe.contactName
      );
      Alert.alert(
        "Success",
        `${cafe.businessName} has been activated successfully.`
      );
      loadData(); // Refresh data
    } catch (error: any) {
      console.error("Error activating cafe:", error);
      Alert.alert(
        "Activation Failed",
        error.message || "Could not activate the cafe partner."
      );
      setActionInProgressId(null);
    }
  };

  // Handler for rejecting a PENDING CAFE
  const handleRejectPendingCafe = async (cafe: ListItem) => {
    setActionInProgressId(cafe.id);
    try {
      await adminService.updateCafeStatus(cafe.id, "rejected");
      Alert.alert("Success", `${cafe.businessName} has been rejected.`);
      loadData(); // Refresh data
    } catch (error) {
      console.error("Error rejecting cafe:", error);
      Alert.alert("Error", "Failed to reject cafe. Please try again.");
      setActionInProgressId(null);
    }
  };

  // Handler for blocking/unblocking an ACTIVE/INACTIVE CAFE
  const handleToggleBlockCafe = async (cafe: ListItem) => {
    setActionInProgressId(cafe.id);
    const newStatus = cafe.status === "active" ? "inactive" : "active";
    try {
      await adminService.updateCafeStatus(cafe.id, newStatus);
      Alert.alert(
        "Success",
        `${cafe.businessName} has been ${
          newStatus === "active" ? "unblocked" : "blocked"
        }.`
      );
      loadData(); // Refresh data
    } catch (error) {
      console.error("Error toggling cafe status:", error);
      Alert.alert("Error", "Failed to update cafe status. Please try again.");
      setActionInProgressId(null);
    }
  };

  // Handler for viewing/editing (placeholder)
  const handleViewEdit = (item: ListItem) => {
    Alert.alert(
      `View/Edit ${item._type === "request" ? "Request" : "Cafe"}`,
      `Details for ${item.businessName}. Functionality coming soon.`
    );
  };

  // ---------------------

  // --- Render Item ---
  const renderItem = ({ item }: { item: ListItem }) => {
    const isRequest = item._type === "request";
    const isPendingCafe = item._type === "cafe" && item.status === "pending";
    const isActiveOrInactiveCafe =
      item._type === "cafe" &&
      (item.status === "active" || item.status === "inactive");
    const isRejected = item.status === "rejected"; // Covers both rejected requests (deleted) and rejected cafes

    let statusText = "Unknown";
    let statusColor = "#9E9E9E"; // Default Grey

    if (isRequest) {
      statusText = "Partnership Request";
      statusColor = "#03A9F4"; // Blue for Requests
    } else if (item.status === "active") {
      statusText = "Active Cafe";
      statusColor = "#4CAF50"; // Green
    } else if (item.status === "pending") {
      statusText = "Pending Activation";
      statusColor = "#FF9800"; // Orange
    } else if (item.status === "rejected") {
      statusText = "Rejected";
      statusColor = "#E53935"; // Red
    } else if (item.status === "inactive") {
      statusText = "Inactive/Blocked";
      statusColor = "#757575"; // Darker Grey
    }

    const isActionInProgress = actionInProgressId === item.id;

    return (
      <View style={styles.cafeCard}>
        <View style={styles.cafeInfoContainer}>
          {/* Placeholder Logo */}
          <View style={styles.logoPlaceholder}>
            <Ionicons
              name={isRequest ? "document-text-outline" : "storefront-outline"}
              size={24}
              color="#FFF"
            />
          </View>
          <View style={styles.cafeDetails}>
            <Text style={styles.cafeName}>{item.businessName}</Text>
            <Text style={styles.cafeLocation}>
              {item.address || "No address provided"}
            </Text>
            <Text style={styles.cafeContact}>
              {item.email} {item.phone ? `| ${item.phone}` : ""}
            </Text>
            <View style={[styles.badge, { backgroundColor: statusColor }]}>
              <Text style={styles.badgeText}>{statusText}</Text>
            </View>
            {/* Display creation date */}
            <Text style={styles.creationDate}>
              Created:{" "}
              {item.createdAt
                ? item.createdAt.toDate().toLocaleDateString()
                : "N/A"}
            </Text>
          </View>
        </View>
        <View style={styles.cafeActions}>
          {/* View/Edit Button - Placeholder for now */}
          {!isRequest && ( // Maybe hide for requests initially?
            <TouchableOpacity
              onPress={() => handleViewEdit(item)}
              style={styles.actionButton}
              disabled={isActionInProgress}
            >
              <Ionicons name="eye-outline" size={22} color="#757575" />
            </TouchableOpacity>
          )}

          {/* Actions for Partnership Requests */}
          {isRequest && (
            <>
              <TouchableOpacity
                onPress={() => handleApproveRequest(item)}
                style={styles.actionButton}
                disabled={isActionInProgress}
              >
                {isActionInProgress ? (
                  <ActivityIndicator size="small" color="#4CAF50" />
                ) : (
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={22}
                    color="#4CAF50"
                  />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleRejectRequest(item)}
                style={styles.actionButton}
                disabled={isActionInProgress}
              >
                {isActionInProgress ? (
                  <ActivityIndicator size="small" color="#E53935" />
                ) : (
                  <Ionicons
                    name="close-circle-outline"
                    size={22}
                    color="#E53935"
                  />
                )}
              </TouchableOpacity>
            </>
          )}

          {/* Actions for Pending Cafes */}
          {isPendingCafe && (
            <>
              <TouchableOpacity
                onPress={() => handleActivateCafe(item)}
                style={styles.actionButton}
                disabled={isActionInProgress}
              >
                {isActionInProgress ? (
                  <ActivityIndicator size="small" color="#4CAF50" />
                ) : (
                  <Ionicons
                    name="person-add-outline" // Icon for activating partner account
                    size={22}
                    color="#4CAF50"
                  />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleRejectPendingCafe(item)}
                style={styles.actionButton}
                disabled={isActionInProgress}
              >
                {isActionInProgress ? (
                  <ActivityIndicator size="small" color="#E53935" />
                ) : (
                  <Ionicons
                    name="close-circle-outline"
                    size={22}
                    color="#E53935"
                  />
                )}
              </TouchableOpacity>
            </>
          )}

          {/* Actions for Active/Inactive Cafes */}
          {isActiveOrInactiveCafe && (
            <TouchableOpacity
              onPress={() => handleToggleBlockCafe(item)}
              style={styles.actionButton}
              disabled={isActionInProgress}
            >
              {isActionInProgress ? (
                <ActivityIndicator size="small" color="#FFA000" />
              ) : (
                <Ionicons
                  name={
                    item.status === "active"
                      ? "lock-open-outline" // Unblock icon
                      : "lock-closed-outline" // Block icon
                  }
                  size={22}
                  color={item.status === "active" ? "#FFA000" : "#4CAF50"} // Orange for Block, Green for Unblock
                />
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };
  // -------------------

  return (
    <ScreenWrapper>
      <CoffeePartnerHeader title={"Manage Cafes & Requests"} />

      {/* Search and Filter Bar */}
      <View style={styles.controlsContainer}>
        <View style={styles.searchContainer}>
          <Ionicons
            name="search-outline"
            size={20}
            color="#888"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, address, or email..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
            returnKeyType="search"
            onSubmitEditing={() => Keyboard.dismiss()}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery("")}
              style={styles.clearIconContainer}
            >
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>
        {/* Status Filters */}
        <View style={styles.filterContainer}>
          <Text style={styles.filterLabel}>Filter:</Text>
          {/* Dynamically create filter buttons */}
          {(
            [
              "all",
              "partnership_request",
              "pending",
              "active",
              "inactive",
              "rejected",
            ] as const
          ).map((status) => {
            let text = "Unknown";
            switch (status) {
              case "all":
                text = "All";
                break;
              case "partnership_request":
                text = "Requests";
                break;
              case "pending":
                text = "Pending Cafes";
                break;
              case "active":
                text = "Active";
                break;
              case "inactive":
                text = "Inactive";
                break;
              case "rejected":
                text = "Rejected";
                break;
            }
            return (
              <TouchableOpacity
                key={status}
                onPress={() => setFilterStatus(status)}
                style={[
                  styles.filterButton,
                  filterStatus === status && styles.filterButtonActive,
                ]}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    filterStatus === status && styles.filterButtonTextActive,
                  ]}
                >
                  {text}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B4513" />
          <Text style={styles.loadingText}>Loading data...</Text>
        </View>
      ) : filteredEntries.length > 0 ? (
        <FlatList
          data={filteredEntries}
          renderItem={renderItem}
          keyExtractor={(item) => item._type + "_" + item.id} // Ensure unique key
          contentContainerStyle={styles.listContainer}
          extraData={actionInProgressId} // Re-render items when action state changes
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="documents-outline" size={60} color="#AAA" />
          <Text style={styles.emptyListText}>No entries found</Text>
          <Text style={styles.emptyListSubText}>
            {searchQuery
              ? "Try a different search term"
              : filterStatus === "all"
              ? "There are no cafes or partnership requests."
              : `There are no entries with the status "${filterStatus}".`}
          </Text>
        </View>
      )}
    </ScreenWrapper>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  controlsContainer: {
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 15,
    backgroundColor: "#F8F8F8",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "#DDD",
    marginBottom: 15,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 15,
    color: "#333",
  },
  clearIconContainer: {
    padding: 5,
  },
  filterContainer: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap", // Allow buttons to wrap
    marginBottom: 8,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#555",
    marginRight: 10,
    marginBottom: 5, // Add margin for wrapped layout
  },
  filterButton: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 15,
    backgroundColor: "#E0E0E0",
    marginRight: 8,
    marginBottom: 5, // Add margin for wrapped layout
  },
  filterButtonActive: {
    backgroundColor: "#4E342E", // Dark brown for active filter
  },
  filterButtonText: {
    fontSize: 13,
    color: "#444",
  },
  filterButtonTextActive: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  listContainer: {
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 20,
  },
  cafeCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    marginBottom: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  cafeInfoContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  logoPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: "#C0A080", // A coffee-like color
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  cafeDetails: {
    flex: 1,
  },
  cafeName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 3,
  },
  cafeLocation: {
    fontSize: 13,
    color: "#777",
    marginBottom: 3,
  },
  cafeContact: {
    fontSize: 12,
    color: "#999",
    marginBottom: 6,
  },
  badge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
    alignSelf: "flex-start", // Make badge only as wide as text
    marginBottom: 4, // Add space below badge
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "bold",
  },
  creationDate: {
    // Style for creation date
    fontSize: 11,
    color: "#AAAAAA",
    marginTop: 2,
  },
  cafeActions: {
    flexDirection: "column", // Stack actions vertically
    alignItems: "flex-end",
    marginLeft: 10,
    justifyContent: "space-around", // Distribute space between buttons
    minHeight: 80, // Ensure enough height for buttons
  },
  actionButton: {
    paddingVertical: 6, // Increase vertical tap area slightly
    paddingHorizontal: 5,
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
  emptyListSubText: {
    textAlign: "center",
    marginTop: 5,
    fontSize: 14,
    color: "#AAA",
  },
});
