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
        <Ionicons name="map-outline" size={80} color="#C0C0C0" />
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
          placeholderTextColor="#A08C7D" // Slightly lighter placeholder color
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
    backgroundColor: "#F5F5F5", // Light background for the screen
    paddingBottom: 75, // Adjusted padding for new tab bar height
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#E8E8E8", // Slightly different grey
    justifyContent: "center",
    alignItems: "center",
  },
  mapPlaceholderText: {
    color: "#A0A0A0", // Grey text
    fontSize: 18,
    fontWeight: "500", // Medium weight
    marginTop: 15,
  },
  headerOverlay: {
    position: "absolute",
    top: 60, // Adjusted top position
    left: 15,
    right: 15,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.95)", // More solid white
    borderRadius: 12, // Slightly smaller radius
    paddingHorizontal: 15,
    paddingVertical: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 1, // Add subtle border
    borderColor: "rgba(139, 69, 19, 0.1)",
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
