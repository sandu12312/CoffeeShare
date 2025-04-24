import React from "react";
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
} from "react-native";
import { Stack, router, Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import BottomTabBar from "../../components/BottomTabBar";
import { useLanguage } from "../../context/LanguageContext";

type IconName = keyof typeof Ionicons.glyphMap;

interface MenuItem {
  title: string;
  icon: IconName;
  onPress: () => void;
}

export default function ProfileScreen() {
  const { t } = useLanguage();

  // Placeholder user data
  const user = {
    name: "Alex Johnson",
    email: "alex.johnson@example.com",
    memberSince: "January 2023",
    totalCoffees: 42,
    favoriteCafe: "Cafe Central",
  };

  const handleLogout = () => {
    // Add actual logout logic here (e.g., clear tokens, reset state)
    console.log("Logging out...");
    // Navigate to the login screen after logout
    router.replace("/(auth)/login");
  };

  const menuItems: MenuItem[] = [
    {
      title: t("accountSettings"),
      icon: "person-outline",
      onPress: () => router.push("/AccountSettings"),
    },
    {
      title: t("language"),
      icon: "language-outline",
      onPress: () => router.push("/AccountSettings/Language"),
    },
    {
      title: t("notifications"),
      icon: "notifications-outline",
      onPress: () => router.push("/AccountSettings/Notifications"),
    },
    {
      title: t("privacy"),
      icon: "shield-outline",
      onPress: () => router.push("/AccountSettings/Privacy"),
    },
    {
      title: t("help"),
      icon: "help-circle-outline",
      onPress: () => router.push("/AccountSettings/Help"),
    },
    {
      title: t("about"),
      icon: "information-circle-outline",
      onPress: () => router.push("/AccountSettings/About"),
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.customHeader}>
        <Text style={styles.customHeaderTitle}>{t("profile")}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Image
              source={require("../../assets/images/logo.png")}
              style={styles.avatar}
            />
          </View>
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
          <Text style={styles.memberSince}>
            {t("memberSince")} {user.memberSince}
          </Text>
        </View>

        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Ionicons
              name="cafe-outline"
              size={24}
              color="#8B4513"
              style={styles.statIcon}
            />
            <Text style={styles.statValue}>{user.totalCoffees}</Text>
            <Text style={styles.statLabel}>{t("totalCoffees")}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons
              name="star-outline"
              size={24}
              color="#8B4513"
              style={styles.statIcon}
            />
            <Text
              style={styles.statValue}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {user.favoriteCafe}
            </Text>
            <Text style={styles.statLabel}>{t("favoriteCafe")}</Text>
          </View>
        </View>

        <View style={styles.settingsCard}>
          <View style={styles.menuContainer}>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.menuItem}
                onPress={item.onPress}
              >
                <View style={styles.menuItemLeft}>
                  <Ionicons name={item.icon} size={24} color="#8B4513" />
                  <Text style={styles.menuItemText}>{item.title}</Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#CCCCCC" />
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.settingItem} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={22} color="#C0392B" />
            <Text style={[styles.settingText, styles.logoutText]}>
              {t("logout")}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <BottomTabBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    paddingBottom: 75,
  },
  customHeader: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 10,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0D6C7",
    alignItems: "center",
  },
  customHeaderTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: "#321E0E",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 20,
  },
  profileHeader: {
    alignItems: "center",
    marginBottom: 25,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(139, 69, 19, 0.1)",
  },
  avatarContainer: {
    width: 110,
    height: 110,
    borderRadius: 55,
    overflow: "hidden",
    marginBottom: 15,
    borderWidth: 3,
    borderColor: "#8B4513",
    backgroundColor: "#E0D6C7",
  },
  avatar: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#321E0E",
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 16,
    color: "#8B4513",
    marginBottom: 8,
  },
  memberSince: {
    fontSize: 14,
    color: "#8B4513",
    opacity: 0.8,
  },
  statsCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    paddingVertical: 15,
    marginBottom: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 3,
    borderWidth: 1,
    borderColor: "rgba(139, 69, 19, 0.1)",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 10,
  },
  statIcon: {
    marginBottom: 5,
  },
  statDivider: {
    width: 1,
    backgroundColor: "rgba(139, 69, 19, 0.15)",
    marginVertical: 5,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#321E0E",
    marginBottom: 5,
    textAlign: "center",
  },
  statLabel: {
    fontSize: 13,
    color: "#8B4513",
    textAlign: "center",
  },
  settingsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: "rgba(139, 69, 19, 0.1)",
    marginBottom: 20,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(139, 69, 19, 0.08)",
  },
  settingText: {
    flex: 1,
    fontSize: 16,
    color: "#321E0E",
    marginLeft: 15,
  },
  logoutText: {
    color: "#C0392B",
    fontWeight: "500",
  },
  menuContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 20,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  menuItemText: {
    fontSize: 16,
    color: "#1A1A1A",
    marginLeft: 12,
  },
});
