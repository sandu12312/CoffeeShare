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
import {
  roleManagementService,
  UserRole,
  UserSearchResult,
} from "../services/roleManagementService";
import { colors } from "../styles/common";

interface UserManagementBoxProps {
  onUserUpdated?: () => void;
}

const UserManagementBox: React.FC<UserManagementBoxProps> = ({
  onUserUpdated,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole | "all">("all");
  const [users, setUsers] = useState<UserSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(
    null
  );
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [roleChangeLoading, setRoleChangeLoading] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalAdmins: 0,
    totalPartners: 0,
    activeUsers: 0,
    pendingPartners: 0,
  });

  const roleOptions: Array<{
    value: UserRole | "all";
    label: string;
    color: string;
  }> = [
    { value: "all", label: "All Users", color: colors.gray_600 },
    { value: "user", label: "Users", color: colors.primary },
    { value: "admin", label: "Admins", color: colors.success },
    { value: "partner", label: "Partners", color: colors.warning },
  ];

  const roleChangeOptions = [
    {
      role: "user" as UserRole,
      title: "Regular User",
      description: "Standard app access with subscription features",
      icon: "person-outline",
      color: colors.primary,
    },
    {
      role: "admin" as UserRole,
      title: "Administrator",
      description: "Full system access with user management capabilities",
      icon: "shield-checkmark-outline",
      color: colors.success,
    },
    {
      role: "partner" as UserRole,
      title: "Coffee Partner",
      description: "Business account with QR scanning and analytics",
      icon: "storefront-outline",
      color: colors.warning,
    },
  ];

  // Load statistics
  const loadStats = useCallback(async () => {
    try {
      const statistics = await roleManagementService.getAllRoleStatistics();
      setStats(statistics);
    } catch (error) {
      console.error("Error loading statistics:", error);
    }
  }, []);

  // Load users based on search and filter
  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      let results: UserSearchResult[] = [];

      if (searchQuery.trim()) {
        // Search by query
        const roleFilter = selectedRole === "all" ? undefined : selectedRole;
        results = await roleManagementService.searchUsers(
          searchQuery,
          roleFilter
        );
      } else if (selectedRole !== "all") {
        // Get users by role
        const response = await roleManagementService.getUsersByRole(
          selectedRole,
          50
        );
        results = response.users;
      } else {
        // Get users from all roles (limited)
        const userResults = await roleManagementService.getUsersByRole(
          "user",
          20
        );
        const adminResults = await roleManagementService.getUsersByRole(
          "admin",
          20
        );
        const partnerResults = await roleManagementService.getUsersByRole(
          "partner",
          20
        );

        results = [
          ...userResults.users,
          ...adminResults.users,
          ...partnerResults.users,
        ];
      }

      // Enhanced deduplication based on UID - keep the most recent or prioritize new collections
      const userMap = new Map<string, UserSearchResult>();

      results.forEach((user) => {
        const existingUser = userMap.get(user.userData.uid);

        if (!existingUser) {
          // First occurrence, add it
          userMap.set(user.userData.uid, user);
        } else {
          // If we have a duplicate, prioritize new collections over legacy
          const isExistingLegacy = existingUser.collection === "users";
          const isCurrentNew = user.collection !== "users";

          if (isExistingLegacy && isCurrentNew) {
            // Replace legacy with new collection entry
            console.log(
              `Replacing legacy user ${user.userData.uid} from ${existingUser.collection} with ${user.collection}`
            );
            userMap.set(user.userData.uid, user);
          } else {
            console.log(
              `Keeping existing user ${user.userData.uid} from ${existingUser.collection}, skipping ${user.collection}`
            );
          }
          // Otherwise keep the existing one
        }
      });

      const deduplicatedResults = Array.from(userMap.values());
      console.log(
        `Loaded ${results.length} users, deduplicated to ${deduplicatedResults.length} unique users`
      );
      setUsers(deduplicatedResults);
    } catch (error) {
      console.error("Error loading users:", error);
      Alert.alert("Error", "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedRole]);

  // Refresh data
  const refreshData = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadUsers(), loadStats()]);
    setRefreshing(false);
    onUserUpdated?.();
  }, [loadUsers, loadStats, onUserUpdated]);

  // Initial load
  useEffect(() => {
    loadStats();
    loadUsers();
  }, [loadStats, loadUsers]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      loadUsers();
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedRole]);

  const handleRoleChange = (user: UserSearchResult) => {
    setSelectedUser(user);
    setShowRoleModal(true);
  };

  const handleRoleChangeComplete = () => {
    setShowRoleModal(false);
    setSelectedUser(null);
    refreshData();
  };

  const performRoleChange = async (newRole: UserRole) => {
    if (!selectedUser) return;

    setRoleChangeLoading(true);
    try {
      let additionalData: any = {};

      switch (newRole) {
        case "admin":
          additionalData = {
            permissions: ["read", "write", "manage_users"],
            accessLevel: "standard",
          };
          break;
        case "partner":
          additionalData = {
            businessName: selectedUser.userData.displayName || "Business",
            verificationStatus: "pending",
          };
          break;
        case "user":
          // No additional data needed for regular users
          break;
      }

      await roleManagementService.changeUserRole(
        selectedUser.userData.uid,
        newRole,
        additionalData
      );

      Alert.alert(
        "Success",
        `User role changed to ${
          roleChangeOptions.find((r) => r.role === newRole)?.title
        }`
      );
      handleRoleChangeComplete();
    } catch (error) {
      console.error("Error changing role:", error);
      Alert.alert("Error", "Failed to change user role");
    } finally {
      setRoleChangeLoading(false);
    }
  };

  const handleDeleteUser = (user: UserSearchResult) => {
    Alert.alert(
      "Confirm Delete",
      `Are you sure you want to delete ${
        user.userData.displayName || user.userData.email
      }?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await roleManagementService.deleteUser(user.userData.uid);
              Alert.alert("Success", "User deleted successfully");
              refreshData();
            } catch (error) {
              console.error("Error deleting user:", error);
              Alert.alert("Error", "Failed to delete user");
            }
          },
        },
      ]
    );
  };

  const getRoleColor = (role: UserRole): string => {
    switch (role) {
      case "admin":
        return colors.success;
      case "partner":
        return colors.warning;
      case "user":
      default:
        return colors.primary;
    }
  };

  const getRoleBadgeText = (role: UserRole): string => {
    switch (role) {
      case "admin":
        return "Admin";
      case "partner":
        return "Partner";
      case "user":
      default:
        return "User";
    }
  };

  const renderUserItem = ({ item }: { item: UserSearchResult }) => (
    <View style={styles.userItem}>
      <View style={styles.userInfo}>
        <View style={styles.userHeader}>
          <Text style={styles.userName}>
            {item.userData.displayName || "No Name"}
          </Text>
          <View
            style={[
              styles.roleBadge,
              { backgroundColor: getRoleColor(item.role) },
            ]}
          >
            <Text style={styles.roleBadgeText}>
              {getRoleBadgeText(item.role)}
            </Text>
          </View>
        </View>

        <Text style={styles.userEmail}>{item.userData.email}</Text>

        <View style={styles.userMeta}>
          <Text style={styles.metaText}>
            Status:{" "}
            <Text
              style={{
                color:
                  item.userData.status === "active"
                    ? colors.success
                    : colors.error,
              }}
            >
              {item.userData.status}
            </Text>
          </Text>
          {item.userData.lastLogin && (
            <Text style={styles.metaText}>
              Last login:{" "}
              {new Date(item.userData.lastLogin.toDate()).toLocaleDateString()}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.userActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => handleRoleChange(item)}
        >
          <Ionicons name="person-outline" size={16} color={colors.white} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteUser(item)}
        >
          <Ionicons name="trash-outline" size={16} color={colors.white} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStatsCard = (title: string, value: number, color: string) => (
    <View style={[styles.statsCard, { borderLeftColor: color }]}>
      <Text style={styles.statsValue}>{value}</Text>
      <Text style={styles.statsTitle}>{title}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>User Management</Text>

      {/* Statistics */}
      <View style={styles.statsContainer}>
        {renderStatsCard("Total Users", stats.totalUsers, colors.primary)}
        {renderStatsCard("Admins", stats.totalAdmins, colors.success)}
        {renderStatsCard("Partners", stats.totalPartners, colors.warning)}
        {renderStatsCard("Active", stats.activeUsers, colors.info)}
      </View>

      {/* Search and Filters */}
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
            placeholder="Search by name or email..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Role Filter */}
      <View style={styles.filterContainer}>
        {roleOptions.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.filterButton,
              selectedRole === option.value && styles.activeFilterButton,
              { borderColor: option.color },
              selectedRole === option.value && {
                backgroundColor: option.color,
              },
            ]}
            onPress={() => setSelectedRole(option.value)}
          >
            <Text
              style={[
                styles.filterButtonText,
                selectedRole === option.value && styles.activeFilterButtonText,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Users List */}
      <View style={styles.listContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading users...</Text>
          </View>
        ) : (
          <FlatList
            data={users}
            renderItem={renderUserItem}
            keyExtractor={(item, index) =>
              `${item.userData.uid}-${item.role}-${item.collection}-${index}`
            }
            refreshing={refreshing}
            onRefresh={refreshData}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons
                  name="people-outline"
                  size={64}
                  color={colors.gray_400}
                />
                <Text style={styles.emptyText}>No users found</Text>
                <Text style={styles.emptySubtext}>
                  {searchQuery
                    ? "Try adjusting your search"
                    : "No users match the current filter"}
                </Text>
              </View>
            }
          />
        )}
      </View>

      {/* Large Role Change Modal */}
      <Modal
        visible={showRoleModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowRoleModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Change User Role</Text>
                <Text style={styles.modalSubtitle}>
                  {selectedUser?.userData.displayName ||
                    selectedUser?.userData.email}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowRoleModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              <Text style={styles.currentRoleText}>
                Current Role:{" "}
                <Text
                  style={[
                    styles.currentRoleBadge,
                    { color: getRoleColor(selectedUser?.role || "user") },
                  ]}
                >
                  {getRoleBadgeText(selectedUser?.role || "user")}
                </Text>
              </Text>

              <Text style={styles.sectionTitle}>Select New Role:</Text>

              {roleChangeOptions.map((option) => (
                <TouchableOpacity
                  key={option.role}
                  style={[
                    styles.roleOptionCard,
                    selectedUser?.role === option.role &&
                      styles.currentRoleCard,
                  ]}
                  onPress={() => performRoleChange(option.role)}
                  disabled={
                    roleChangeLoading || selectedUser?.role === option.role
                  }
                >
                  <View style={styles.roleOptionContent}>
                    <View
                      style={[
                        styles.roleIconContainer,
                        { backgroundColor: option.color },
                      ]}
                    >
                      <Ionicons
                        name={option.icon as any}
                        size={24}
                        color={colors.white}
                      />
                    </View>
                    <View style={styles.roleTextContainer}>
                      <Text style={styles.roleOptionTitle}>{option.title}</Text>
                      <Text style={styles.roleOptionDescription}>
                        {option.description}
                      </Text>
                    </View>
                    <View style={styles.roleActionContainer}>
                      {selectedUser?.role === option.role ? (
                        <Text style={styles.currentRoleIndicator}>Current</Text>
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
                onPress={() => setShowRoleModal(false)}
                disabled={roleChangeLoading}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>

            {roleChangeLoading && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingOverlayText}>Changing role...</Text>
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
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
  },
  filterContainer: {
    flexDirection: "row",
    marginBottom: 16,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  activeFilterButton: {
    borderWidth: 0,
  },
  filterButtonText: {
    fontSize: 14,
    color: colors.gray_600,
  },
  activeFilterButtonText: {
    color: colors.white,
    fontWeight: "600",
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.gray_600,
  },
  userItem: {
    flexDirection: "row",
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    alignItems: "center",
  },
  userInfo: {
    flex: 1,
  },
  userHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    flex: 1,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.white,
  },
  userEmail: {
    fontSize: 14,
    color: colors.gray_600,
    marginBottom: 8,
  },
  userMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  metaText: {
    fontSize: 12,
    color: colors.gray_500,
  },
  userActions: {
    flexDirection: "row",
    marginLeft: 12,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  editButton: {
    backgroundColor: colors.primary,
  },
  deleteButton: {
    backgroundColor: colors.error,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.gray_500,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.gray_400,
    textAlign: "center",
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    backgroundColor: colors.white,
    borderRadius: 16,
    width: "95%",
    height: "85%",
    maxWidth: 600,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 2,
  },
  modalSubtitle: {
    fontSize: 14,
    color: colors.gray_600,
  },
  closeButton: {
    padding: 6,
    borderRadius: 15,
    backgroundColor: colors.background,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  currentRoleText: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 16,
    textAlign: "center",
  },
  currentRoleBadge: {
    fontSize: 16,
    fontWeight: "700",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 16,
    textAlign: "center",
  },
  roleOptionCard: {
    padding: 16,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: colors.background,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    minHeight: 70,
  },
  currentRoleCard: {
    borderColor: colors.gray_400,
    backgroundColor: colors.gray_400 + "20",
    opacity: 0.6,
  },
  roleOptionContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  roleIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  roleTextContainer: {
    flex: 1,
  },
  roleOptionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 4,
  },
  roleOptionDescription: {
    fontSize: 14,
    color: colors.gray_600,
    lineHeight: 18,
  },
  roleActionContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingLeft: 16,
  },
  currentRoleIndicator: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.success,
    backgroundColor: colors.success + "20",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  cancelButton: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderWidth: 2,
    borderColor: colors.gray_500,
    borderRadius: 12,
    alignSelf: "center",
  },
  cancelButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 16,
  },
  loadingOverlayText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
});

export default UserManagementBox;
