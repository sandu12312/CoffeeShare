import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ScreenWrapper from "../../components/ScreenWrapper";
import CoffeePartnerHeader from "../../components/CoffeePartnerHeader";
import adminService, { AdminUserData } from "../../services/adminService";
import { formatDate } from "../../utils/dateUtils";

export default function ManageUsersScreen() {
  const [users, setUsers] = useState<AdminUserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<
    "all" | "active" | "suspended" | "blocked"
  >("all");

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const { users: fetchedUsers } = await adminService.getAllUsers();
      setUsers(fetchedUsers);
    } catch (error) {
      console.error("Error loading users:", error);
      Alert.alert("Error", "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadUsers();
      return;
    }

    try {
      setLoading(true);
      const searchResults = await adminService.searchUsers(searchQuery);
      setUsers(searchResults);
    } catch (error) {
      console.error("Error searching users:", error);
      Alert.alert("Error", "Failed to search users");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadUsers();
    setRefreshing(false);
  };

  const handleStatusChange = async (
    userId: string,
    newStatus: "active" | "suspended" | "blocked"
  ) => {
    try {
      await adminService.changeUserStatus(userId, newStatus);
      Alert.alert("Success", "User status updated successfully");
      loadUsers(); // Reload users to reflect changes
    } catch (error) {
      console.error("Error updating user status:", error);
      Alert.alert("Error", "Failed to update user status");
    }
  };

  const filteredUsers = users.filter((user) => {
    if (filter === "all") return true;
    return user.status === filter;
  });

  return (
    <ScreenWrapper>
      <CoffeePartnerHeader title="Manage Users" showBackButton={true} />

      {/* Search and Filter Section */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search users..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
          />
          <TouchableOpacity onPress={handleSearch} style={styles.searchButton}>
            <Ionicons name="search" size={24} color="#8B4513" />
          </TouchableOpacity>
        </View>

        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              filter === "all" && styles.filterButtonActive,
            ]}
            onPress={() => setFilter("all")}
          >
            <Text
              style={[
                styles.filterText,
                filter === "all" && styles.filterTextActive,
              ]}
            >
              All
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              filter === "active" && styles.filterButtonActive,
            ]}
            onPress={() => setFilter("active")}
          >
            <Text
              style={[
                styles.filterText,
                filter === "active" && styles.filterTextActive,
              ]}
            >
              Active
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              filter === "suspended" && styles.filterButtonActive,
            ]}
            onPress={() => setFilter("suspended")}
          >
            <Text
              style={[
                styles.filterText,
                filter === "suspended" && styles.filterTextActive,
              ]}
            >
              Suspended
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Users List */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {loading ? (
          <ActivityIndicator
            size="large"
            color="#8B4513"
            style={styles.loader}
          />
        ) : filteredUsers.length > 0 ? (
          filteredUsers.map((user) => (
            <View key={user.id} style={styles.userCard}>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>
                  {user.displayName || "Unnamed User"}
                </Text>
                <Text style={styles.userEmail}>{user.email}</Text>
                <Text style={styles.userRole}>Role: {user.role}</Text>
                <Text style={styles.userDate}>
                  Registered: {formatDate(user.registrationDate)}
                </Text>
              </View>

              <View style={styles.userActions}>
                <TouchableOpacity
                  style={[
                    styles.statusButton,
                    user.status === "active" && styles.statusButtonActive,
                  ]}
                  onPress={() => handleStatusChange(user.id, "active")}
                >
                  <Text style={styles.statusButtonText}>Active</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.statusButton,
                    user.status === "suspended" && styles.statusButtonSuspended,
                  ]}
                  onPress={() => handleStatusChange(user.id, "suspended")}
                >
                  <Text style={styles.statusButtonText}>Suspend</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.statusButton,
                    user.status === "blocked" && styles.statusButtonBlocked,
                  ]}
                  onPress={() => handleStatusChange(user.id, "blocked")}
                >
                  <Text style={styles.statusButtonText}>Block</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.noUsersText}>No users found</Text>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  searchContainer: {
    padding: 15,
    backgroundColor: "#fff",
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  searchButton: {
    padding: 10,
  },
  filterContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: "#f5f5f5",
    marginHorizontal: 5,
    alignItems: "center",
  },
  filterButtonActive: {
    backgroundColor: "#8B4513",
  },
  filterText: {
    color: "#666",
    fontSize: 14,
  },
  filterTextActive: {
    color: "#fff",
  },
  scrollView: {
    flex: 1,
  },
  loader: {
    marginTop: 20,
  },
  userCard: {
    backgroundColor: "#fff",
    margin: 10,
    padding: 15,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userInfo: {
    marginBottom: 10,
  },
  userName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  userEmail: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  userRole: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  userDate: {
    fontSize: 12,
    color: "#999",
    marginTop: 2,
  },
  userActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  statusButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: "#f5f5f5",
    marginHorizontal: 5,
    alignItems: "center",
  },
  statusButtonActive: {
    backgroundColor: "#4CAF50",
  },
  statusButtonSuspended: {
    backgroundColor: "#FFC107",
  },
  statusButtonBlocked: {
    backgroundColor: "#F44336",
  },
  statusButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
  },
  noUsersText: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 16,
    color: "#666",
  },
});
