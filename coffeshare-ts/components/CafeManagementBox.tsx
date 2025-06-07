import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  Modal,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import adminService, { CafeData } from "../services/adminService";
import { colors } from "../styles/common";

interface CafeManagementBoxProps {
  onCafeUpdated?: () => void;
}

type CafeStatus =
  | "pending"
  | "active"
  | "inactive"
  | "rejected"
  | "partnership_request";

interface CafeWithRequests extends Omit<CafeData, "status"> {
  _type: "cafe" | "request";
  status:
    | "pending"
    | "active"
    | "inactive"
    | "rejected"
    | "partnership_request";
}

const CafeManagementBox: React.FC<CafeManagementBoxProps> = ({
  onCafeUpdated,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<CafeStatus | "all">(
    "all"
  );
  const [cafes, setCafes] = useState<CafeWithRequests[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCafe, setSelectedCafe] = useState<CafeWithRequests | null>(
    null
  );
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusChangeLoading, setStatusChangeLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [stats, setStats] = useState({
    totalCafes: 0,
    activeCafes: 0,
    pendingCafes: 0,
    inactiveCafes: 0,
    pendingRequests: 0,
  });

  // Form state for editing
  const [editForm, setEditForm] = useState({
    businessName: "",
    contactName: "",
    email: "",
    phone: "",
    address: "",
  });

  const statusOptions: Array<{
    value: CafeStatus | "all";
    label: string;
    color: string;
  }> = [
    { value: "all", label: "All", color: colors.gray_600 },
    { value: "partnership_request", label: "Requests", color: colors.info },
    { value: "pending", label: "Pending", color: colors.warning },
    { value: "active", label: "Active", color: colors.success },
    { value: "inactive", label: "Inactive", color: colors.gray_500 },
    { value: "rejected", label: "Rejected", color: colors.error },
  ];

  const statusChangeOptions = [
    {
      status: "active" as const,
      title: "Active",
      description: "Cafe is active and visible to users",
      icon: "checkmark-circle-outline",
      color: colors.success,
    },
    {
      status: "inactive" as const,
      title: "Inactive",
      description: "Temporarily disable this cafe",
      icon: "pause-circle-outline",
      color: colors.gray_500,
    },
    {
      status: "pending" as const,
      title: "Pending",
      description: "Awaiting activation",
      icon: "time-outline",
      color: colors.warning,
    },
    {
      status: "rejected" as const,
      title: "Rejected",
      description: "Reject this cafe application",
      icon: "close-circle-outline",
      color: colors.error,
    },
  ];

  // Load statistics
  const loadStats = useCallback(async () => {
    try {
      const statistics = await adminService.getCafeStatistics();
      setStats(statistics);
    } catch (error) {
      console.error("Error loading cafe statistics:", error);
    }
  }, []);

  // Load cafes and requests
  const loadCafes = useCallback(async () => {
    setLoading(true);
    try {
      let results: CafeWithRequests[] = [];

      if (searchQuery.trim()) {
        // Search cafes
        const cafeResults = await adminService.searchCafes(searchQuery);
        results = cafeResults.map((cafe) => ({
          ...cafe,
          _type: "cafe" as const,
        }));

        // Also search partnership requests if query might match
        const requests = await adminService.getPartnershipRequests();
        const matchingRequests = requests
          .filter(
            (req) =>
              req.businessName
                .toLowerCase()
                .includes(searchQuery.toLowerCase()) ||
              req.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
              (req.address &&
                req.address.toLowerCase().includes(searchQuery.toLowerCase()))
          )
          .map(
            (req) =>
              ({
                ...req,
                _type: "request" as const,
                status: "partnership_request" as const,
              } as CafeWithRequests)
          );

        results = [...results, ...matchingRequests];
      } else if (selectedStatus === "partnership_request") {
        // Get partnership requests
        const requests = await adminService.getPartnershipRequests();
        results = requests.map(
          (req) =>
            ({
              ...req,
              _type: "request" as const,
              status: "partnership_request" as const,
            } as CafeWithRequests)
        );
      } else if (selectedStatus !== "all") {
        // Get cafes by status
        const cafeResults = await adminService.getCafesByStatus(
          selectedStatus as any
        );
        results = cafeResults.cafes.map((cafe) => ({
          ...cafe,
          _type: "cafe" as const,
        }));
      } else {
        // Get all cafes and requests
        const [cafeResults, requests] = await Promise.all([
          adminService.getAllCafes(),
          adminService.getPartnershipRequests(),
        ]);

        const cafeData = cafeResults.cafes.map(
          (cafe) =>
            ({
              ...cafe,
              _type: "cafe" as const,
            } as CafeWithRequests)
        );
        const requestData = requests.map(
          (req) =>
            ({
              ...req,
              _type: "request" as const,
              status: "partnership_request" as const,
            } as CafeWithRequests)
        );

        results = [...cafeData, ...requestData];
      }

      // Sort by creation date (newest first)
      results.sort((a, b) => {
        const dateA = a.createdAt?.toMillis() || 0;
        const dateB = b.createdAt?.toMillis() || 0;
        return dateB - dateA;
      });

      setCafes(results);
    } catch (error) {
      console.error("Error loading cafes:", error);
      Alert.alert("Error", "Failed to load cafes");
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedStatus]);

  // Refresh data
  const refreshData = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadCafes(), loadStats()]);
    setRefreshing(false);
    onCafeUpdated?.();
  }, [loadCafes, loadStats, onCafeUpdated]);

  // Initial load
  useEffect(() => {
    loadStats();
    loadCafes();
  }, [loadStats, loadCafes]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      loadCafes();
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedStatus]);

  // Handle edit cafe
  const handleEditCafe = (cafe: CafeWithRequests) => {
    if (cafe._type === "request") {
      Alert.alert(
        "Cannot Edit",
        "Partnership requests cannot be edited. Approve or reject them instead."
      );
      return;
    }

    setSelectedCafe(cafe);
    setEditForm({
      businessName: cafe.businessName || "",
      contactName: cafe.contactName || "",
      email: cafe.email || "",
      phone: cafe.phone || "",
      address: cafe.address || "",
    });
    setShowEditModal(true);
  };

  // Handle status change
  const handleStatusChange = (cafe: CafeWithRequests) => {
    if (cafe._type === "request") {
      Alert.alert(
        "Cannot Change Status",
        "Use approve/reject actions for partnership requests."
      );
      return;
    }

    setSelectedCafe(cafe);
    setShowStatusModal(true);
  };

  // Perform status change
  const performStatusChange = async (newStatus: CafeStatus) => {
    if (!selectedCafe || selectedCafe._type === "request") return;

    setStatusChangeLoading(true);
    try {
      await adminService.updateCafeStatus(selectedCafe.id, newStatus as any);
      Alert.alert("Success", `Cafe status updated to ${newStatus}`);
      setShowStatusModal(false);
      refreshData();
    } catch (error) {
      console.error("Error updating cafe status:", error);
      Alert.alert("Error", "Failed to update cafe status");
    } finally {
      setStatusChangeLoading(false);
    }
  };

  // Perform edit save
  const handleSaveEdit = async () => {
    if (!selectedCafe || selectedCafe._type === "request") return;

    if (!editForm.businessName.trim() || !editForm.email.trim()) {
      Alert.alert("Error", "Business name and email are required");
      return;
    }

    setEditLoading(true);
    try {
      await adminService.updateCafe(selectedCafe.id, {
        businessName: editForm.businessName.trim(),
        contactName: editForm.contactName.trim(),
        email: editForm.email.trim(),
        phone: editForm.phone.trim(),
        address: editForm.address.trim(),
      });

      Alert.alert("Success", "Cafe updated successfully");
      setShowEditModal(false);
      refreshData();
    } catch (error) {
      console.error("Error updating cafe:", error);
      Alert.alert("Error", "Failed to update cafe");
    } finally {
      setEditLoading(false);
    }
  };

  // Handle delete cafe
  const handleDeleteCafe = (cafe: CafeWithRequests) => {
    const deleteAction =
      cafe._type === "request"
        ? "delete this partnership request"
        : "delete this cafe";
    const itemType = cafe._type === "request" ? "request" : "cafe";

    Alert.alert(
      "Confirm Delete",
      `Are you sure you want to ${deleteAction}? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              if (cafe._type === "request") {
                await adminService.deletePartnershipRequest(cafe.id);
              } else {
                await adminService.deleteCafe(cafe.id);
              }

              Alert.alert(
                "Success",
                `${
                  itemType.charAt(0).toUpperCase() + itemType.slice(1)
                } deleted successfully`
              );
              refreshData();
            } catch (error) {
              console.error(`Error deleting ${itemType}:`, error);
              Alert.alert("Error", `Failed to delete ${itemType}`);
            }
          },
        },
      ]
    );
  };

  // Handle approve request
  const handleApproveRequest = async (request: CafeWithRequests) => {
    if (request._type !== "request") return;

    try {
      await adminService.transferPartnershipRequestToCafe(request.id);

      // Create partner account
      const password =
        Math.random().toString(36).slice(-12) +
        Math.random().toString(36).toUpperCase().slice(-4) +
        Math.random().toString(36).slice(-8) +
        "!@#$%^&*".charAt(Math.floor(Math.random() * 8));

      await adminService.activateCafePartner(
        request.id,
        request.email,
        password
      );

      Alert.alert(
        "Partner Account Created",
        `Please securely share these credentials with the partner:\n\nEmail: ${request.email}\nPassword: ${password}\n\nMake sure they change their password on first login.`
      );

      refreshData();
    } catch (error) {
      console.error("Error approving request:", error);
      Alert.alert("Error", "Failed to approve request");
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "active":
        return colors.success;
      case "pending":
        return colors.warning;
      case "inactive":
        return colors.gray_500;
      case "rejected":
        return colors.error;
      case "partnership_request":
        return colors.info;
      default:
        return colors.gray_600;
    }
  };

  const getStatusText = (cafe: CafeWithRequests | null): string => {
    if (!cafe) return "Unknown";
    if (cafe._type === "request") return "Partnership Request";
    switch (cafe.status) {
      case "active":
        return "Active";
      case "pending":
        return "Pending";
      case "inactive":
        return "Inactive";
      case "rejected":
        return "Rejected";
      default:
        return "Unknown";
    }
  };

  const renderCafeItem = ({ item }: { item: CafeWithRequests }) => {
    if (!item) return null;

    return (
      <View style={styles.cafeCard}>
        <View style={styles.cafeHeader}>
          <View style={styles.cafeInfo}>
            <Text style={styles.cafeName}>{item.businessName}</Text>
            <Text style={styles.cafeEmail}>{item.email}</Text>
            {item.address && (
              <Text style={styles.cafeAddress}>{item.address}</Text>
            )}
            {item.phone && <Text style={styles.cafePhone}>{item.phone}</Text>}
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(item.status) },
            ]}
          >
            <Text style={styles.statusText}>{getStatusText(item)}</Text>
          </View>
        </View>

        <View style={styles.cafeActions}>
          {item._type === "request" ? (
            <>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  { backgroundColor: colors.success },
                ]}
                onPress={() => handleApproveRequest(item)}
              >
                <Ionicons name="checkmark" size={16} color={colors.white} />
                <Text style={styles.actionButtonText}>Approve</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.error }]}
                onPress={() => handleDeleteCafe(item)}
              >
                <Ionicons name="close" size={16} color={colors.white} />
                <Text style={styles.actionButtonText}>Reject</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  { backgroundColor: colors.primary },
                ]}
                onPress={() => handleEditCafe(item)}
              >
                <Ionicons
                  name="create-outline"
                  size={16}
                  color={colors.white}
                />
                <Text style={styles.actionButtonText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  { backgroundColor: colors.warning },
                ]}
                onPress={() => handleStatusChange(item)}
              >
                <Ionicons
                  name="swap-horizontal-outline"
                  size={16}
                  color={colors.white}
                />
                <Text style={styles.actionButtonText}>Status</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.error }]}
                onPress={() => handleDeleteCafe(item)}
              >
                <Ionicons name="trash-outline" size={16} color={colors.white} />
                <Text style={styles.actionButtonText}>Delete</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    );
  };

  const renderStatsCard = (title: string, value: number, color: string) => (
    <View style={[styles.statsCard, { borderLeftColor: color }]}>
      <Text style={styles.statsValue}>{value}</Text>
      <Text style={styles.statsTitle}>{title}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cafe Management</Text>

      {/* Statistics */}
      <View style={styles.statsContainer}>
        {renderStatsCard("Total", stats.totalCafes, colors.primary)}
        {renderStatsCard("Active", stats.activeCafes, colors.success)}
        {renderStatsCard("Pending", stats.pendingCafes, colors.warning)}
        {renderStatsCard("Requests", stats.pendingRequests, colors.info)}
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons
            name="search-outline"
            size={20}
            color={colors.gray_500}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, email, or address..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Status Filter */}
      <View style={styles.filterContainer}>
        {statusOptions.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.filterButton,
              selectedStatus === option.value && styles.activeFilterButton,
              { borderColor: option.color },
              selectedStatus === option.value && {
                backgroundColor: option.color,
              },
            ]}
            onPress={() => setSelectedStatus(option.value)}
          >
            <Text
              style={[
                styles.filterButtonText,
                selectedStatus === option.value &&
                  styles.activeFilterButtonText,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Cafes List */}
      <View style={styles.listContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading cafes...</Text>
          </View>
        ) : (
          <FlatList
            data={cafes.filter((item) => item != null)}
            renderItem={renderCafeItem}
            keyExtractor={(item, index) => `${item._type}-${item.id}-${index}`}
            refreshing={refreshing}
            onRefresh={refreshData}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons
                  name="storefront-outline"
                  size={64}
                  color={colors.gray_400}
                />
                <Text style={styles.emptyText}>No cafes found</Text>
                <Text style={styles.emptySubtext}>
                  {searchQuery
                    ? "Try adjusting your search"
                    : "No cafes match the current filter"}
                </Text>
              </View>
            }
          />
        )}
      </View>

      {/* Edit Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Cafe</Text>
              <TouchableOpacity
                onPress={() => setShowEditModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Business Name *</Text>
                <TextInput
                  style={styles.textInput}
                  value={editForm.businessName}
                  onChangeText={(text) =>
                    setEditForm({ ...editForm, businessName: text })
                  }
                  placeholder="Enter business name"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Contact Name</Text>
                <TextInput
                  style={styles.textInput}
                  value={editForm.contactName}
                  onChangeText={(text) =>
                    setEditForm({ ...editForm, contactName: text })
                  }
                  placeholder="Enter contact name"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email *</Text>
                <TextInput
                  style={styles.textInput}
                  value={editForm.email}
                  onChangeText={(text) =>
                    setEditForm({ ...editForm, email: text })
                  }
                  placeholder="Enter email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Phone</Text>
                <TextInput
                  style={styles.textInput}
                  value={editForm.phone}
                  onChangeText={(text) =>
                    setEditForm({ ...editForm, phone: text })
                  }
                  placeholder="Enter phone number"
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Address</Text>
                <TextInput
                  style={styles.textInput}
                  value={editForm.address}
                  onChangeText={(text) =>
                    setEditForm({ ...editForm, address: text })
                  }
                  placeholder="Enter address"
                  multiline
                  numberOfLines={3}
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowEditModal(false)}
                disabled={editLoading}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveEdit}
                disabled={editLoading}
              >
                {editLoading ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Text style={styles.saveButtonText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Status Change Modal */}
      <Modal
        visible={showStatusModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowStatusModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Change Cafe Status</Text>
                <Text style={styles.modalSubtitle}>
                  {selectedCafe?.businessName}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowStatusModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              <Text style={styles.currentStatusText}>
                Current Status:{" "}
                <Text
                  style={[
                    styles.currentStatusBadge,
                    {
                      color: getStatusColor(selectedCafe?.status || "pending"),
                    },
                  ]}
                >
                  {selectedCafe ? getStatusText(selectedCafe) : "Unknown"}
                </Text>
              </Text>

              <Text style={styles.sectionTitle}>Select New Status:</Text>

              {statusChangeOptions.map((option) => (
                <TouchableOpacity
                  key={option.status}
                  style={[
                    styles.statusOptionCard,
                    selectedCafe?.status === option.status &&
                      styles.currentStatusCard,
                  ]}
                  onPress={() => performStatusChange(option.status)}
                  disabled={
                    statusChangeLoading ||
                    selectedCafe?.status === option.status
                  }
                >
                  <View style={styles.statusOptionContent}>
                    <View
                      style={[
                        styles.statusIconContainer,
                        { backgroundColor: option.color },
                      ]}
                    >
                      <Ionicons
                        name={option.icon as any}
                        size={24}
                        color={colors.white}
                      />
                    </View>
                    <View style={styles.statusTextContainer}>
                      <Text style={styles.statusOptionTitle}>
                        {option.title}
                      </Text>
                      <Text style={styles.statusOptionDescription}>
                        {option.description}
                      </Text>
                    </View>
                    <View style={styles.statusActionContainer}>
                      {selectedCafe?.status === option.status ? (
                        <Text style={styles.currentStatusIndicator}>
                          Current
                        </Text>
                      ) : (
                        <Ionicons
                          name="chevron-forward"
                          size={20}
                          color={colors.gray_500}
                        />
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowStatusModal(false)}
                disabled={statusChangeLoading}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>

            {statusChangeLoading && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingOverlayText}>
                  Changing status...
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    margin: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  statsCard: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 2,
    borderLeftWidth: 4,
    alignItems: "center",
  },
  statsValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.text,
  },
  statsTitle: {
    fontSize: 12,
    color: colors.gray_600,
    marginTop: 4,
  },
  searchContainer: {
    marginBottom: 12,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: colors.text,
  },
  filterContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 16,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    backgroundColor: colors.background,
  },
  activeFilterButton: {
    borderWidth: 1,
  },
  filterButtonText: {
    fontSize: 12,
    color: colors.text,
  },
  activeFilterButtonText: {
    color: colors.white,
    fontWeight: "bold",
  },
  listContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 8,
    color: colors.gray_600,
  },
  listContent: {
    paddingBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.gray_600,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.gray_500,
    marginTop: 8,
    textAlign: "center",
  },
  cafeCard: {
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cafeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  cafeInfo: {
    flex: 1,
    marginRight: 12,
  },
  cafeName: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 4,
  },
  cafeEmail: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 2,
  },
  cafeAddress: {
    fontSize: 12,
    color: colors.gray_500,
    marginBottom: 2,
  },
  cafePhone: {
    fontSize: 12,
    color: colors.gray_500,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "bold",
    color: colors.white,
  },
  cafeActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.white,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: colors.white,
    borderRadius: 12,
    width: "90%",
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text,
  },
  modalSubtitle: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: 2,
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    padding: 16,
    maxHeight: 400,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.background,
  },
  modalFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelButtonText: {
    fontSize: 14,
    color: colors.textLight,
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.primary,
  },
  saveButtonText: {
    fontSize: 14,
    color: colors.white,
    fontWeight: "600",
  },
  currentStatusText: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 16,
  },
  currentStatusBadge: {
    fontWeight: "bold",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 12,
  },
  statusOptionCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    marginBottom: 8,
  },
  currentStatusCard: {
    backgroundColor: colors.background,
    opacity: 0.6,
  },
  statusOptionContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
  },
  statusIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  statusTextContainer: {
    flex: 1,
  },
  statusOptionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  statusOptionDescription: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 2,
  },
  statusActionContainer: {
    alignItems: "center",
  },
  currentStatusIndicator: {
    fontSize: 12,
    color: colors.gray_500,
    fontWeight: "600",
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
  },
  loadingOverlayText: {
    marginTop: 8,
    color: colors.text,
  },
});

export default CafeManagementBox;
