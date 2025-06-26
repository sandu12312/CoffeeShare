import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ScrollView,
} from "react-native";
import { Link, usePathname } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useLanguage } from "../context/LanguageContext";

const AdminSidebar = () => {
  const { t } = useLanguage();
  const pathname = usePathname();

  const menuItems = [
    {
      icon: "grid-outline",
      label: "Dashboard",
      href: "/(admin)/dashboard",
    },
    {
      icon: "cafe-outline",
      label: "Manage Cafes",
      href: "/(admin)/manage-cafes",
    },
    {
      icon: "add-circle-outline",
      label: "Add Cafe Location",
      href: "/(admin)/add-cafe-location",
    },
    {
      icon: "people-outline",
      label: "Manage Users",
      href: "/(admin)/manage-users",
    },
    {
      icon: "card-outline",
      label: "Subscriptions",
      href: "/(admin)/manage-subscriptions",
    },
    {
      icon: "bar-chart-outline",
      label: "Statistics",
      href: "/(admin)/statistics",
    },
    {
      icon: "settings-outline",
      label: "Settings",
      href: "/(admin)/app-settings",
    },
  ];

  return (
    <View style={styles.container}>
      {/* Header panoul admin */}
      <View style={styles.header}>
        <Text style={styles.title}>CoffeShare</Text>
        <Text style={styles.subtitle}>Admin Panel</Text>
      </View>

      {/* Container pentru meniu */}
      <ScrollView style={styles.menuContainer}>
        {menuItems.map((item, index) => {
          const isActive = pathname === item.href;
          return (
            <Link href={item.href} key={index} asChild>
              <TouchableOpacity
                style={[styles.menuItem, isActive && styles.activeMenuItem]}
              >
                <Ionicons
                  name={item.icon as any}
                  size={22}
                  color={isActive ? "#FFFFFF" : "#8B4513"}
                />
                <Text
                  style={[
                    styles.menuItemText,
                    isActive && styles.activeMenuItemText,
                  ]}
                >
                  {item.label}
                </Text>
                {isActive && <View style={styles.activeIndicator} />}
              </TouchableOpacity>
            </Link>
          );
        })}
      </ScrollView>

      {/* Footer cu butonul de ieșire */}
      <View style={styles.footer}>
        <Link href="/(mainUsers)/dashboard" asChild>
          <TouchableOpacity style={styles.footerButton}>
            <Ionicons name="exit-outline" size={20} color="#8B4513" />
            <Text style={styles.footerButtonText}>Exit Admin</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 250,
    backgroundColor: "#FFFFFF",
    borderRightWidth: 1,
    borderRightColor: "#ECECEC",
    flexDirection: "column",
    height: "100%",
  },
  header: {
    padding: 20,
    paddingTop: Platform.OS === "ios" ? 60 : 50,
    borderBottomWidth: 1,
    borderBottomColor: "#ECECEC",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#8B4513",
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 5,
  },
  menuContainer: {
    flex: 1,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    paddingLeft: 25,
    position: "relative",
  },
  activeMenuItem: {
    backgroundColor: "#8B4513",
  },
  menuItemText: {
    fontSize: 16,
    marginLeft: 15,
    color: "#333",
  },
  activeMenuItemText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  activeIndicator: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 5,
    backgroundColor: "#8B4513",
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#ECECEC",
  },
  footerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderWidth: 1,
    borderColor: "#8B4513",
    borderRadius: 8,
  },
  footerButtonText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#8B4513",
    fontWeight: "500",
  },
});

export default AdminSidebar;
