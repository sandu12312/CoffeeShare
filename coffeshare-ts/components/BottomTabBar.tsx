import React from "react";
import { StyleSheet, View, TouchableOpacity, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, usePathname } from "expo-router";

export default function BottomTabBar() {
  const pathname = usePathname();

  // Helper function to determine if a tab is active
  const isActive = (path: string) => {
    return pathname.includes(path);
  };

  return (
    <View style={styles.bottomNav}>
      <TouchableOpacity
        style={[
          styles.navButton,
          isActive("dashboard") && styles.activeNavButton,
        ]}
        onPress={() => router.push("/(mainUsers)/dashboard")}
      >
        <Ionicons
          name={isActive("dashboard") ? "home" : "home-outline"}
          size={26}
          color="#8B4513"
        />
        <Text style={styles.navText}>Home</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.navButton, isActive("map") && styles.activeNavButton]}
        onPress={() => router.push("/(mainUsers)/map")}
      >
        <Ionicons
          name={isActive("map") ? "map" : "map-outline"}
          size={26}
          color="#8B4513"
        />
        <Text style={styles.navText}>Map</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.qrButton}
        onPress={() => router.push("/(mainUsers)/qr")}
      >
        <Ionicons name="qr-code" size={30} color="#FFFFFF" />
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.navButton,
          isActive("subscriptions") && styles.activeNavButton,
        ]}
        onPress={() => router.push("/(mainUsers)/subscriptions")}
      >
        <Ionicons
          name={isActive("subscriptions") ? "card" : "card-outline"}
          size={26}
          color="#8B4513"
        />
        <Text style={styles.navText}>Subs</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.navButton,
          isActive("profile") && styles.activeNavButton,
        ]}
        onPress={() => router.push("/(mainUsers)/profile")}
      >
        <Ionicons
          name={isActive("profile") ? "person" : "person-outline"}
          size={26}
          color="#8B4513"
        />
        <Text style={styles.navText}>Profile</Text>
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
    height: 70,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "rgba(255, 248, 220, 0.95)", // Light cream, slightly transparent
    borderTopWidth: 1,
    borderTopColor: "rgba(139, 69, 19, 0.1)",
    paddingBottom: 5, // Adjust for safe area if needed
  },
  navButton: {
    alignItems: "center",
    flex: 1,
  },
  activeNavButton: {
    opacity: 0.7, // Visual indicator that we're on this screen
  },
  navText: {
    fontSize: 10,
    color: "#8B4513",
    marginTop: 2,
  },
  qrButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#8B4513",
    justifyContent: "center",
    alignItems: "center",
    bottom: 15, // Raise the button slightly
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
});
