import React from "react";
import {
  StyleSheet,
  View,
  SafeAreaView,
  TouchableOpacity,
  Text,
  TextInput,
} from "react-native";
// Import MapView types if needed for other parts, otherwise remove/comment out
// import MapView, { PROVIDER_GOOGLE } from "react-native-maps";
import { Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import BottomTabBar from "../../components/BottomTabBar";

export default function MapScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Placeholder for Map View */}
      <View style={styles.mapPlaceholder}>
        <Text style={styles.mapPlaceholderText}>Map Area</Text>
      </View>

      {/* MapView component commented out - uncomment and fix later 
      <MapView
        provider={PROVIDER_GOOGLE} // Use Google Maps on iOS and Android
        style={styles.map}
        initialRegion={{
          latitude: 37.78825, // Placeholder coordinates (San Francisco)
          longitude: -122.4324,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
        showsUserLocation={true}
        showsMyLocationButton={true}
      />
      */}

      {/* Header/Search Bar Overlay */}
      <View style={styles.headerOverlay}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search Cafes..."
          placeholderTextColor="#8B4513"
        />
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="options-outline" size={24} color="#8B4513" />
        </TouchableOpacity>
      </View>

      {/* Bottom Navigation Bar */}
      <BottomTabBar />
    </SafeAreaView>
  );
}

// Reusing and adapting styles from Dashboard
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff", // Add a background color for the SafeAreaView
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#E0E0E0", // Light grey background for placeholder
    justifyContent: "center",
    alignItems: "center",
  },
  mapPlaceholderText: {
    color: "#A0A0A0", // Grey text
    fontSize: 18,
    fontWeight: "bold",
  },
  headerOverlay: {
    position: "absolute",
    top: 50, // Adjust based on status bar height
    left: 20,
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 248, 220, 0.9)", // Light cream, slightly transparent
    borderRadius: 15,
    paddingHorizontal: 15,
    paddingVertical: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#321E0E",
  },
  filterButton: {
    marginLeft: 10,
    padding: 5,
  },
});
