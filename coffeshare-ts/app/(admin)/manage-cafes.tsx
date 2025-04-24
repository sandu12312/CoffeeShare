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
import { useLanguage } from "../../context/LanguageContext";
import ScreenWrapper from "../../components/ScreenWrapper";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import CoffeePartnerHeader from "../../components/CoffeePartnerHeader";

// --- Dummy Data ---
type CafeStatus = "Active" | "Pending" | "Rejected" | "Blocked";

interface Cafe {
  id: string;
  name: string;
  city: string;
  address: string;
  status: CafeStatus;
  logoUrl?: string; // Optional
}

const DUMMY_CAFES: Cafe[] = [
  {
    id: "c1",
    name: "Cafeneaua Buna",
    city: "București",
    address: "Str. Lalelelor 1",
    status: "Active",
  },
  {
    id: "c2",
    name: "Coffee Spot",
    city: "Cluj-Napoca",
    address: "Piața Unirii 5",
    status: "Blocked",
  },
  {
    id: "c3",
    name: "Aroma Urbană",
    city: "Timișoara",
    address: "Bd. Victoriei 10",
    status: "Pending",
  },
  {
    id: "c4",
    name: "Old Town Cafe",
    city: "Brașov",
    address: "Str. Sforii 2",
    status: "Active",
  },
  {
    id: "c5",
    name: "Espresso Hub",
    city: "Iași",
    address: "Str. Palat 7",
    status: "Rejected",
  },
  {
    id: "c6",
    name: "The Grind House",
    city: "București",
    address: "Calea Dorobanți 55",
    status: "Active",
  },
];
// ------------------

export default function ManageCafesScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const [cafes, setCafes] = useState<Cafe[]>(DUMMY_CAFES);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<CafeStatus | "All">("All");

  const filteredCafes = useMemo(() => {
    return cafes.filter((cafe) => {
      const nameMatch = cafe.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const cityMatch = cafe.city
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const statusMatch =
        filterStatus === "All" || cafe.status === filterStatus;
      return (nameMatch || cityMatch) && statusMatch;
    });
  }, [cafes, searchQuery, filterStatus]);

  // --- Action Handlers ---
  const handleViewEditCafe = (cafe: Cafe) => {
    // TODO: Navigate to Cafe Details/Edit Screen
    Alert.alert(
      "Detalii/Editează Cafenea",
      `Funcționalitate pentru ${cafe.name} în curând!`
    );
  };

  const handleApproveCafe = (cafe: Cafe) => {
    // TODO: Implement approve logic (update state/backend)
    setCafes((prevCafes) =>
      prevCafes.map((c) => (c.id === cafe.id ? { ...c, status: "Active" } : c))
    );
    Alert.alert("Aprobă Cafenea", `Ai aprobat ${cafe.name}. (Simulat)`);
  };

  const handleRejectCafe = (cafe: Cafe) => {
    // TODO: Implement reject logic (update state/backend)
    setCafes((prevCafes) =>
      prevCafes.map((c) =>
        c.id === cafe.id ? { ...c, status: "Rejected" } : c
      )
    );
    Alert.alert("Respinge Cafenea", `Ai respins ${cafe.name}. (Simulat)`);
  };

  const handleToggleBlockCafe = (cafe: Cafe) => {
    // TODO: Implement block/unblock logic (update state/backend)
    const newStatus = cafe.status === "Active" ? "Blocked" : "Active"; // Or Pending if unblocking a blocked one?
    setCafes((prevCafes) =>
      prevCafes.map((c) => (c.id === cafe.id ? { ...c, status: newStatus } : c))
    );
    Alert.alert(
      cafe.status === "Active" || cafe.status === "Pending"
        ? "Blochează Cafenea"
        : "Deblochează Cafenea",
      `Sigur dorești să ${
        cafe.status === "Active" || cafe.status === "Pending"
          ? "blochezi"
          : "deblochezi"
      } ${cafe.name}? (Simulat)`
    );
  };
  // ---------------------

  // --- Render Item ---
  const renderCafeItem = ({ item }: { item: Cafe }) => {
    let statusColor = "#9E9E9E"; // Default Grey
    if (item.status === "Active") statusColor = "#4CAF50"; // Green
    else if (item.status === "Pending") statusColor = "#FF9800"; // Orange
    else if (item.status === "Rejected" || item.status === "Blocked")
      statusColor = "#E53935"; // Red

    return (
      <View style={styles.cafeCard}>
        <View style={styles.cafeInfoContainer}>
          {/* Placeholder Logo */}
          <View style={styles.logoPlaceholder}>
            <Ionicons name="storefront-outline" size={24} color="#FFF" />
          </View>
          <View style={styles.cafeDetails}>
            <Text style={styles.cafeName}>{item.name}</Text>
            <Text style={styles.cafeLocation}>
              {item.city} - {item.address}
            </Text>
            <View style={[styles.badge, { backgroundColor: statusColor }]}>
              <Text style={styles.badgeText}>{item.status}</Text>
            </View>
          </View>
        </View>
        <View style={styles.cafeActions}>
          <TouchableOpacity
            onPress={() => handleViewEditCafe(item)}
            style={styles.actionButton}
          >
            <Ionicons name="eye-outline" size={22} color="#757575" />
          </TouchableOpacity>
          {item.status === "Pending" && (
            <>
              <TouchableOpacity
                onPress={() => handleApproveCafe(item)}
                style={styles.actionButton}
              >
                <Ionicons
                  name="checkmark-circle-outline"
                  size={22}
                  color="#4CAF50"
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleRejectCafe(item)}
                style={styles.actionButton}
              >
                <Ionicons
                  name="close-circle-outline"
                  size={22}
                  color="#E53935"
                />
              </TouchableOpacity>
            </>
          )}
          {(item.status === "Active" || item.status === "Blocked") && (
            <TouchableOpacity
              onPress={() => handleToggleBlockCafe(item)}
              style={styles.actionButton}
            >
              <Ionicons
                name={
                  item.status === "Active"
                    ? "lock-open-outline"
                    : "lock-closed-outline"
                }
                size={22}
                color={item.status === "Active" ? "#FFA000" : "#4CAF50"}
              />
            </TouchableOpacity>
          )}
          {/* Maybe add delete only if Rejected/Blocked? */}
        </View>
      </View>
    );
  };
  // -------------------

  return (
    <ScreenWrapper>
      {/* TODO: Add translation key 'manageCafesTitle' */}
      <CoffeePartnerHeader title={"Gestionează Cafenele"} />

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
            placeholder="Caută după nume sau oraș..."
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
              Active
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setFilterStatus("Pending")}
            style={[
              styles.filterButton,
              filterStatus === "Pending" && styles.filterButtonActive,
            ]}
          >
            <Text
              style={[
                styles.filterButtonText,
                filterStatus === "Pending" && styles.filterButtonTextActive,
              ]}
            >
              În Așteptare
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
              Blocate
            </Text>
          </TouchableOpacity>
          {/* Add Rejected filter if needed */}
        </View>
      </View>

      {/* Cafe List */}
      <FlatList
        data={filteredCafes}
        renderItem={renderCafeItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Ionicons name="sad-outline" size={50} color="#CCC" />
            <Text style={styles.emptyListText}>Nicio cafenea găsită.</Text>
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
    marginBottom: 6,
  },
  badge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
    alignSelf: "flex-start", // Make badge only as wide as text
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "bold",
  },
  cafeActions: {
    flexDirection: "column", // Stack actions vertically
    alignItems: "flex-end",
    marginLeft: 10,
  },
  actionButton: {
    paddingVertical: 4, // Increase vertical tap area
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
// --------------
