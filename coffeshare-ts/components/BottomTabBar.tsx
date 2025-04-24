import React from "react";
import { StyleSheet, View, TouchableOpacity, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, usePathname } from "expo-router";

export default function BottomTabBar() {
  const pathname = usePathname();

  // Helper function to determine if a tab is active
  const isActive = (path: string) => {
    // More specific check to avoid partial matches (e.g., /map vs /map-details)
    const currentBaseRoute = pathname.split("/").pop();
    return currentBaseRoute === path;
  };

  return (
    <View style={styles.bottomNav}>
      {/* Dashboard Tab */}
      <TouchableOpacity
        style={styles.navButton}
        onPress={() => router.push("/(mainUsers)/dashboard")}
      >
        <View
          style={[
            styles.iconContainer,
            isActive("dashboard") && styles.activeIconContainer,
          ]}
        >
          <Ionicons
            name={isActive("dashboard") ? "home" : "home-outline"}
            size={26}
            color={isActive("dashboard") ? "#FFFFFF" : "#8B4513"}
          />
        </View>
        <Text
          style={[
            styles.navText,
            isActive("dashboard") && styles.activeNavText,
          ]}
        >
          Home
        </Text>
      </TouchableOpacity>

      {/* Map Tab */}
      <TouchableOpacity
        style={styles.navButton}
        onPress={() => router.push("/(mainUsers)/map")}
      >
        <View
          style={[
            styles.iconContainer,
            isActive("map") && styles.activeIconContainer,
          ]}
        >
          <Ionicons
            name={isActive("map") ? "map" : "map-outline"}
            size={26}
            color={isActive("map") ? "#FFFFFF" : "#8B4513"}
          />
        </View>
        <Text style={[styles.navText, isActive("map") && styles.activeNavText]}>
          Map
        </Text>
      </TouchableOpacity>

      {/* QR Code Button */}
      <TouchableOpacity
        style={styles.qrButton}
        onPress={() => router.push("/(mainUsers)/qr")}
      >
        <Ionicons name="qr-code" size={30} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Subscriptions Tab */}
      <TouchableOpacity
        style={styles.navButton}
        onPress={() => router.push("/(mainUsers)/subscriptions")}
      >
        <View
          style={[
            styles.iconContainer,
            isActive("subscriptions") && styles.activeIconContainer,
          ]}
        >
          <Ionicons
            name={isActive("subscriptions") ? "card" : "card-outline"}
            size={26}
            color={isActive("subscriptions") ? "#FFFFFF" : "#8B4513"}
          />
        </View>
        <Text
          style={[
            styles.navText,
            isActive("subscriptions") && styles.activeNavText,
          ]}
        >
          Subs
        </Text>
      </TouchableOpacity>

      {/* Profile Tab */}
      <TouchableOpacity
        style={styles.navButton}
        onPress={() => router.push("/(mainUsers)/profile")}
      >
        <View
          style={[
            styles.iconContainer,
            isActive("profile") && styles.activeIconContainer,
          ]}
        >
          <Ionicons
            name={isActive("profile") ? "person" : "person-outline"}
            size={26}
            color={isActive("profile") ? "#FFFFFF" : "#8B4513"}
          />
        </View>
        <Text
          style={[styles.navText, isActive("profile") && styles.activeNavText]}
        >
          Profile
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 75, // Slightly increased height
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-start", // Align items to the top for better icon spacing
    backgroundColor: "#FFFFFF", // Solid white background
    borderTopWidth: 1,
    borderTopColor: "#E0D6C7", // Lighter border color
    paddingTop: 8, // Add padding top
    paddingBottom: 5, // Keep bottom padding for safe area
    shadowColor: "#000", // Add subtle shadow
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 5,
  },
  navButton: {
    alignItems: "center",
    flex: 1,
    paddingTop: 2, // Add slight padding within the button
  },
  iconContainer: {
    width: 40,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 16,
    marginBottom: 3,
  },
  activeIconContainer: {
    backgroundColor: "#8B4513", // Brown background for active icon
  },
  navText: {
    fontSize: 11, // Slightly larger text
    color: "#8B4513", // Default text color
    fontWeight: "500",
  },
  activeNavText: {
    color: "#321E0E", // Darker text for active
    fontWeight: "600", // Bold text for active
  },
  qrButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#8B4513",
    justifyContent: "center",
    alignItems: "center",
    bottom: 25, // Raise the button more
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 8,
    borderWidth: 2,
    borderColor: "#FFFFFF", // Add white border for definition
  },
});
