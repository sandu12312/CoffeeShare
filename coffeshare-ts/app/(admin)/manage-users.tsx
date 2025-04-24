import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  Keyboard,
} from "react-native";
import { useLanguage } from "../../context/LanguageContext"; // Corrected path
import ScreenWrapper from "../../components/ScreenWrapper"; // Corrected path
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import CoffeePartnerHeader from "../../components/CoffeePartnerHeader"; // Corrected path
// import SelectDropdown from 'react-native-select-dropdown'; // Optional: for nicer dropdowns

// --- Dummy Data ---
type UserRole = "User" | "Cafe" | "Admin";
type UserStatus = "Active" | "Blocked";

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  avatarUrl?: string; // Optional
}

const DUMMY_USERS: User[] = [
  {
    id: "1",
    name: "Alex Popescu",
    email: "alex.p@email.com",
    role: "User",
    status: "Active",
  },
  {
    id: "2",
    name: "Cafeneaua Buna",
    email: "contact@cafeabuna.ro",
    role: "Cafe",
    status: "Active",
  },
  {
    id: "3",
    name: "Maria Ionescu",
    email: "maria.i@email.com",
    role: "User",
    status: "Blocked",
  },
  {
    id: "4",
    name: "Admin Principal",
    email: "admin@coffeeshare.app",
    role: "Admin",
    status: "Active",
  },
  {
    id: "5",
    name: "Andrei Vasile",
    email: "andrei.v@email.com",
    role: "User",
    status: "Active",
  },
  {
    id: "6",
    name: "Coffee Spot",
    email: "office@coffeespot.com",
    role: "Cafe",
    status: "Blocked",
  },
  {
    id: "7",
    name: "Georgiana Dinu",
    email: "georgiana.d@email.com",
    role: "User",
    status: "Active",
  },
];
// ------------------

export default function ManageUsersScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>(DUMMY_USERS);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState<UserRole | "All">("All");
  const [filterStatus, setFilterStatus] = useState<UserStatus | "All">("All");

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const nameMatch = user.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const emailMatch = user.email
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const roleMatch = filterRole === "All" || user.role === filterRole;
      const statusMatch =
        filterStatus === "All" || user.status === filterStatus;
      return (nameMatch || emailMatch) && roleMatch && statusMatch;
    });
  }, [users, searchQuery, filterRole, filterStatus]);

  // --- Action Handlers ---
  const handleEditUser = (user: User) => {
    // TODO: Navigate to Edit User Screen
    Alert.alert(
      "Editează Utilizator",
      `Funcționalitate pentru ${user.name} în curând!`
    );
  };

  const handleToggleBlockUser = (user: User) => {
    // TODO: Implement block/unblock logic (update state/backend)
    const newStatus = user.status === "Active" ? "Blocked" : "Active";
    setUsers((prevUsers) =>
      prevUsers.map((u) => (u.id === user.id ? { ...u, status: newStatus } : u))
    );
    Alert.alert(
      user.status === "Active"
        ? "Blochează Utilizator"
        : "Deblochează Utilizator",
      `Sigur dorești să ${
        user.status === "Active" ? "blochezi" : "deblochezi"
      } ${user.name}? (Simulat)`
    );
  };

  const handleDeleteUser = (user: User) => {
    // TODO: Implement delete logic (update state/backend) with confirmation
    Alert.alert(
      "Șterge Utilizator",
      `Sigur dorești să ștergi definitiv ${user.name}? Această acțiune nu poate fi anulată. (Simulat)`,
      [
        { text: "Anulează", style: "cancel" },
        {
          text: "Șterge",
          style: "destructive",
          onPress: () => {
            setUsers((prevUsers) => prevUsers.filter((u) => u.id !== user.id));
            console.log(`Simulated delete for ${user.name}`);
          },
        },
      ]
    );
  };
  // ---------------------

  // --- Render Item ---
  const renderUserItem = ({ item }: { item: User }) => {
    const roleColor =
      item.role === "Admin"
        ? "#E53935"
        : item.role === "Cafe"
        ? "#8B4513"
        : "#3F51B5";
    const statusColor = item.status === "Active" ? "#4CAF50" : "#9E9E9E";

    return (
      <View style={styles.userCard}>
        <View style={styles.userInfoContainer}>
          {/* Placeholder Avatar */}
          <View style={styles.avatarPlaceholder}>
            <Ionicons
              name={
                item.role === "Cafe" ? "storefront-outline" : "person-outline"
              }
              size={20}
              color="#FFF"
            />
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{item.name}</Text>
            <Text style={styles.userEmail}>{item.email}</Text>
            <View style={styles.badgesContainer}>
              <View style={[styles.badge, { backgroundColor: roleColor }]}>
                <Text style={styles.badgeText}>{item.role}</Text>
              </View>
              <View
                style={[
                  styles.badge,
                  { backgroundColor: statusColor, marginLeft: 5 },
                ]}
              >
                <Text style={styles.badgeText}>{item.status}</Text>
              </View>
            </View>
          </View>
        </View>
        <View style={styles.userActions}>
          <TouchableOpacity
            onPress={() => handleEditUser(item)}
            style={styles.actionButton}
          >
            <Ionicons name="pencil-outline" size={22} color="#757575" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleToggleBlockUser(item)}
            style={styles.actionButton}
          >
            <Ionicons
              name={
                item.status === "Active"
                  ? "lock-open-outline"
                  : "lock-closed-outline"
              }
              size={22}
              color={item.status === "Active" ? "#FFA000" : "#E53935"}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleDeleteUser(item)}
            style={styles.actionButton}
          >
            <Ionicons name="trash-outline" size={22} color="#E53935" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };
  // -------------------

  return (
    <ScreenWrapper>
      {/* TODO: Add translation key 'manageUsersTitle' */}
      <CoffeePartnerHeader title={"Gestionează Utilizatori"} />

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
            placeholder="Caută după nume sau email..."
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
        {/* Simple Filter Buttons for now */}
        <View style={styles.filterContainer}>
          <Text style={styles.filterLabel}>Rol:</Text>
          <TouchableOpacity
            onPress={() => setFilterRole("All")}
            style={[
              styles.filterButton,
              filterRole === "All" && styles.filterButtonActive,
            ]}
          >
            <Text
              style={[
                styles.filterButtonText,
                filterRole === "All" && styles.filterButtonTextActive,
              ]}
            >
              Toate
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setFilterRole("User")}
            style={[
              styles.filterButton,
              filterRole === "User" && styles.filterButtonActive,
            ]}
          >
            <Text
              style={[
                styles.filterButtonText,
                filterRole === "User" && styles.filterButtonTextActive,
              ]}
            >
              User
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setFilterRole("Cafe")}
            style={[
              styles.filterButton,
              filterRole === "Cafe" && styles.filterButtonActive,
            ]}
          >
            <Text
              style={[
                styles.filterButtonText,
                filterRole === "Cafe" && styles.filterButtonTextActive,
              ]}
            >
              Cafe
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setFilterRole("Admin")}
            style={[
              styles.filterButton,
              filterRole === "Admin" && styles.filterButtonActive,
            ]}
          >
            <Text
              style={[
                styles.filterButtonText,
                filterRole === "Admin" && styles.filterButtonTextActive,
              ]}
            >
              Admin
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.filterContainer}>
          <Text style={styles.filterLabel}>Status:</Text>
          <TouchableOpacity
            onPress={() => setFilterStatus("All")}
            style={[
              styles.filterButton,
              filterStatus === "All" && styles.filterButtonActive,
            ]}
          >
            <Text
              style={[
                styles.filterButtonText,
                filterStatus === "All" && styles.filterButtonTextActive,
              ]}
            >
              Toate
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setFilterStatus("Active")}
            style={[
              styles.filterButton,
              filterStatus === "Active" && styles.filterButtonActive,
            ]}
          >
            <Text
              style={[
                styles.filterButtonText,
                filterStatus === "Active" && styles.filterButtonTextActive,
              ]}
            >
              Activ
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setFilterStatus("Blocked")}
            style={[
              styles.filterButton,
              filterStatus === "Blocked" && styles.filterButtonActive,
            ]}
          >
            <Text
              style={[
                styles.filterButtonText,
                filterStatus === "Blocked" && styles.filterButtonTextActive,
              ]}
            >
              Blocat
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* User List */}
      <FlatList
        data={filteredUsers}
        renderItem={renderUserItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Ionicons name="sad-outline" size={50} color="#CCC" />
            <Text style={styles.emptyListText}>Niciun utilizator găsit.</Text>
            <Text style={styles.emptyListSubText}>
              Încearcă să ajustezi filtrele.
            </Text>
          </View>
        )}
      />
    </ScreenWrapper>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
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
    marginBottom: 8,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#555",
    marginRight: 10,
    minWidth: 50, // Ensure alignment
  },
  filterButton: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 15,
    backgroundColor: "#E0E0E0",
    marginRight: 8,
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
  userCard: {
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
  userInfoContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  avatarPlaceholder: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: "#BDBDBD",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 13,
    color: "#777",
    marginBottom: 6,
  },
  badgesContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  badge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "bold",
  },
  userActions: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 10,
  },
  actionButton: {
    padding: 6, // Increase tap area
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 80,
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
// --------------
