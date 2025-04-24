import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { useLanguage } from "../../context/LanguageContext";
import ScreenWrapper from "../../components/ScreenWrapper";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
// Assuming we might reuse or adapt the partner header
import CoffeePartnerHeader from "../../components/CoffeePartnerHeader";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width / 2 - 30; // For potential 2-column layout

export default function AdminDashboardScreen() {
  const { t } = useLanguage();
  const router = useRouter();

  // Placeholder navigation functions
  const navigateTo = (path: string) => {
    console.log(`Navigating to ${path}`);
    router.push(path); // Enable actual navigation
    // alert(`Navigare către ${path} (placeholder)`);
  };

  return (
    <ScreenWrapper>
      {/* Using partner header for now, can be customized later */}
      <CoffeePartnerHeader title={"Admin Dashboard"} showBackButton={true} />
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <Text style={styles.welcomeMessage}>
          Panou de Control Administrator
        </Text>

        <View style={styles.gridContainer}>
          {/* Card: Manage Users */}
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigateTo("/(admin)/manage-users")}
          >
            <Ionicons name="people-outline" size={40} color="#3F51B5" />
            {/* TODO: Translation key */}
            <Text style={styles.cardTitle}>Gestionează Utilizatori</Text>
          </TouchableOpacity>

          {/* Card: Manage Cafes */}
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigateTo("(admin)/manage-cafes")}
          >
            <Ionicons name="storefront-outline" size={40} color="#009688" />
            {/* TODO: Translation key */}
            <Text style={styles.cardTitle}>Gestionează Cafenele</Text>
          </TouchableOpacity>

          {/* Card: Manage Subscriptions */}
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigateTo("(admin)/manage-subscriptions")}
          >
            <Ionicons name="card-outline" size={40} color="#FF9800" />
            {/* TODO: Translation key */}
            <Text style={styles.cardTitle}>Gestionează Abonamente</Text>
          </TouchableOpacity>

          {/* Card: View Statistics */}
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigateTo("(admin)/statistics")}
          >
            <Ionicons name="bar-chart-outline" size={40} color="#E91E63" />
            {/* TODO: Translation key */}
            <Text style={styles.cardTitle}>Statistici Generale</Text>
          </TouchableOpacity>

          {/* Card: Settings/Configuration */}
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigateTo("(admin)/app-settings")}
          >
            <Ionicons name="settings-outline" size={40} color="#607D8B" />
            {/* TODO: Translation key */}
            <Text style={styles.cardTitle}>Setări Aplicație</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scrollViewContent: {
    padding: 20,
    paddingBottom: 40,
  },
  welcomeMessage: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 25,
    textAlign: "center",
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    width: CARD_WIDTH,
    minHeight: 150,
    padding: 15,
    marginBottom: 20,
    alignItems: "center",
    justifyContent: "center",
    // Shadow styles (similar to partner dashboard)
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 15,
    color: "#444",
    textAlign: "center",
  },
});
