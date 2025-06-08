import React from "react";
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Image,
} from "react-native";
import { Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useLanguage } from "../../../context/LanguageContext";

export default function AboutScreen() {
  const { t } = useLanguage();

  const teamMembers = [
    {
      name: "Alexandru Gheorghita",
      role: "Lead Developer & Founder",
      description:
        "Full-stack developer with passion for coffee and technology",
    },
    {
      name: "CoffeeShare Team",
      role: "Development Team",
      description: "Dedicated team making coffee accessible to everyone",
    },
  ];

  const acknowledgments = [
    "React Native Community",
    "Expo Framework",
    "Firebase Team",
    "All coffee lovers who inspired this app",
  ];

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          headerTitle: "About CoffeeShare",
          headerStyle: styles.headerStyle,
          headerTitleStyle: styles.headerTitleStyle,
          headerTintColor: "#321E0E",
        }}
      />

      <ScrollView style={styles.scrollView}>
        {/* App Logo and Info */}
        <View style={styles.appSection}>
          <View style={styles.logoContainer}>
            <View style={styles.logoPlaceholder}>
              <Ionicons name="cafe" size={48} color="#FFFFFF" />
            </View>
          </View>

          <Text style={styles.appName}>CoffeeShare</Text>
          <Text style={styles.tagline}>Your Coffee, Your Way, Every Day</Text>

          <View style={styles.versionInfo}>
            <Text style={styles.versionText}>Version 1.0.0</Text>
            <Text style={styles.buildText}>Build 1001 • January 2024</Text>
          </View>
        </View>

        {/* Mission Statement */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Our Mission</Text>
          <Text style={styles.missionText}>
            CoffeeShare was born from a simple idea: making great coffee more
            accessible and affordable for everyone. We believe that a perfect
            cup of coffee shouldn't be a luxury, but a daily pleasure that
            connects communities and fuels dreams.
          </Text>
        </View>

        {/* Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What We Offer</Text>

          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <Ionicons name="card-outline" size={24} color="#8B4513" />
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>Flexible Subscriptions</Text>
                <Text style={styles.featureDescription}>
                  Choose from various coffee plans that fit your lifestyle
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <Ionicons name="map-outline" size={24} color="#8B4513" />
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>Partner Network</Text>
                <Text style={styles.featureDescription}>
                  Access hundreds of partner cafes across Romania
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <Ionicons name="qr-code-outline" size={24} color="#8B4513" />
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>Easy Redemption</Text>
                <Text style={styles.featureDescription}>
                  Simple QR code system for quick coffee redemption
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <Ionicons name="analytics-outline" size={24} color="#8B4513" />
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>Smart Tracking</Text>
                <Text style={styles.featureDescription}>
                  Track your coffee consumption and discover new favorites
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Team */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Meet the Team</Text>

          {teamMembers.map((member, index) => (
            <View key={index} style={styles.teamMember}>
              <View style={styles.memberAvatar}>
                <Ionicons name="person" size={24} color="#8B4513" />
              </View>
              <View style={styles.memberInfo}>
                <Text style={styles.memberName}>{member.name}</Text>
                <Text style={styles.memberRole}>{member.role}</Text>
                <Text style={styles.memberDescription}>
                  {member.description}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Company Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Company Information</Text>

          <View style={styles.companyInfo}>
            <View style={styles.infoRow}>
              <Ionicons name="business-outline" size={20} color="#8B4513" />
              <Text style={styles.infoText}>CoffeeShare SRL</Text>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={20} color="#8B4513" />
              <Text style={styles.infoText}>Bucharest, Romania</Text>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={20} color="#8B4513" />
              <Text style={styles.infoText}>Founded in 2024</Text>
            </View>

            <TouchableOpacity
              style={styles.infoRow}
              onPress={() => Linking.openURL("mailto:info@coffeeshare.ro")}
            >
              <Ionicons name="mail-outline" size={20} color="#8B4513" />
              <Text style={[styles.infoText, styles.linkText]}>
                info@coffeeshare.ro
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.infoRow}
              onPress={() => Linking.openURL("https://www.coffeeshare.ro")}
            >
              <Ionicons name="globe-outline" size={20} color="#8B4513" />
              <Text style={[styles.infoText, styles.linkText]}>
                www.coffeeshare.ro
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Acknowledgments */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Special Thanks</Text>
          <Text style={styles.acknowledgeIntro}>
            This app wouldn't be possible without the amazing open-source
            community and our supporters:
          </Text>

          <View style={styles.acknowledgmentsList}>
            {acknowledgments.map((item, index) => (
              <View key={index} style={styles.acknowledgmentItem}>
                <Ionicons name="heart" size={16} color="#E74C3C" />
                <Text style={styles.acknowledgmentText}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Legal Links */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Legal</Text>

          <TouchableOpacity
            style={styles.legalLink}
            onPress={() => Linking.openURL("https://www.coffeeshare.ro/terms")}
          >
            <Text style={styles.legalLinkText}>Terms of Service</Text>
            <Ionicons name="open-outline" size={16} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.legalLink}
            onPress={() =>
              Linking.openURL("https://www.coffeeshare.ro/privacy")
            }
          >
            <Text style={styles.legalLinkText}>Privacy Policy</Text>
            <Ionicons name="open-outline" size={16} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.legalLink}
            onPress={() =>
              Linking.openURL("https://www.coffeeshare.ro/licenses")
            }
          >
            <Text style={styles.legalLinkText}>Open Source Licenses</Text>
            <Ionicons name="open-outline" size={16} color="#999" />
          </TouchableOpacity>
        </View>

        {/* Copyright */}
        <View style={[styles.section, styles.lastSection]}>
          <Text style={styles.copyrightText}>
            © 2024 CoffeeShare SRL. All rights reserved.
          </Text>
          <Text style={styles.copyrightSubtext}>
            Made with ❤️ and lots of ☕ in Romania
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  headerStyle: {
    backgroundColor: "#FFFFFF",
  },
  headerTitleStyle: {
    color: "#321E0E",
    fontSize: 18,
    fontWeight: "600",
  },
  scrollView: {
    flex: 1,
  },
  appSection: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 30,
    paddingHorizontal: 20,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  logoContainer: {
    marginBottom: 20,
  },
  logoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#8B4513",
    justifyContent: "center",
    alignItems: "center",
  },
  appName: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#321E0E",
    marginBottom: 5,
  },
  tagline: {
    fontSize: 16,
    color: "#8B4513",
    fontStyle: "italic",
    marginBottom: 20,
  },
  versionInfo: {
    alignItems: "center",
  },
  versionText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#321E0E",
  },
  buildText: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  section: {
    backgroundColor: "#FFFFFF",
    marginTop: 10,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  lastSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#321E0E",
    marginBottom: 15,
  },
  missionText: {
    fontSize: 16,
    color: "#4A5568",
    lineHeight: 24,
    textAlign: "justify",
  },
  featuresList: {
    gap: 15,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 15,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#321E0E",
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  teamMember: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 20,
    gap: 15,
  },
  memberAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#FFF8F0",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#E0D6C7",
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#321E0E",
    marginBottom: 2,
  },
  memberRole: {
    fontSize: 14,
    color: "#8B4513",
    fontWeight: "600",
    marginBottom: 4,
  },
  memberDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 18,
  },
  companyInfo: {
    gap: 12,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  infoText: {
    fontSize: 16,
    color: "#321E0E",
  },
  linkText: {
    color: "#8B4513",
    textDecorationLine: "underline",
  },
  acknowledgeIntro: {
    fontSize: 14,
    color: "#666",
    marginBottom: 15,
    lineHeight: 20,
  },
  acknowledgmentsList: {
    gap: 8,
  },
  acknowledgmentItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  acknowledgmentText: {
    fontSize: 14,
    color: "#4A5568",
  },
  legalLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  legalLinkText: {
    fontSize: 16,
    color: "#321E0E",
  },
  copyrightText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 5,
  },
  copyrightSubtext: {
    fontSize: 12,
    color: "#8B4513",
    textAlign: "center",
    fontStyle: "italic",
  },
});
