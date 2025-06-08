import React, { useState } from "react";
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Linking,
} from "react-native";
import { Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useLanguage } from "../../../context/LanguageContext";

export default function PrivacySecurityScreen() {
  const { t } = useLanguage();

  // Privacy Settings States
  const [dataSharing, setDataSharing] = useState(false);
  const [locationTracking, setLocationTracking] = useState(true);
  const [analyticsData, setAnalyticsData] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);
  const [crashReports, setCrashReports] = useState(true);

  const handleDataDownload = () => {
    Alert.alert(
      "Download Your Data",
      "We'll prepare a download link with all your data and send it to your registered email address within 48 hours.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Request Download",
          onPress: () => {
            // TODO: Implement data download request
            Alert.alert(
              "Request Submitted",
              "You'll receive an email with your data download link within 48 hours."
            );
          },
        },
      ]
    );
  };

  const handleDataDeletion = () => {
    Alert.alert(
      "Delete All Data",
      "This will permanently delete all your data including:\n\n• Profile information\n• Subscription history\n• Coffee redemption history\n• App preferences\n\nThis action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "Final Confirmation",
              "Are you absolutely sure? This will permanently delete your account and all associated data.",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Yes, Delete Everything",
                  style: "destructive",
                  onPress: () => {
                    // TODO: Implement account deletion
                    console.log("Account deletion requested");
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const privacyPolicyContent = `
Last Updated: January 15, 2024

PRIVACY POLICY

1. INFORMATION WE COLLECT

We collect information you provide directly to us, such as when you:
• Create an account
• Purchase a subscription
• Use our services
• Contact our support team

Personal Information includes:
• Name and email address
• Phone number (optional)
• Profile photo (optional)
• Payment information (processed securely)

Automatically Collected Information:
• Device information
• Usage data
• Location data (when permitted)
• Crash reports and performance data

2. HOW WE USE YOUR INFORMATION

We use your information to:
• Provide and improve our services
• Process transactions
• Send important updates
• Provide customer support
• Analyze usage patterns
• Ensure security and prevent fraud

3. INFORMATION SHARING

We do not sell your personal information. We may share information with:
• Service providers who assist our operations
• Legal authorities when required by law
• Business partners for integrated services (with your consent)

4. DATA SECURITY

We implement appropriate security measures to protect your information:
• Encryption of sensitive data
• Secure data transmission
• Regular security audits
• Access controls and monitoring

5. YOUR RIGHTS

You have the right to:
• Access your personal information
• Correct inaccurate information
• Delete your account and data
• Opt-out of marketing communications
• Export your data

6. DATA RETENTION

We retain your information as long as your account is active or as needed to provide services. You can request deletion at any time.

7. CHILDREN'S PRIVACY

Our services are not intended for children under 13. We do not knowingly collect information from children under 13.

8. CHANGES TO THIS POLICY

We may update this policy from time to time. We'll notify you of any significant changes.

9. CONTACT US

For privacy-related questions, contact us at:
Email: privacy@coffeeshare.ro
Address: CoffeeShare Ltd., Bucharest, Romania
  `.trim();

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          headerTitle: t("privacySecurity"),
          headerBackTitle: t("profile"),
          headerStyle: styles.headerStyle,
          headerTitleStyle: styles.headerTitleStyle,
          headerTintColor: "#321E0E",
          headerBackVisible: true,
        }}
      />

      <ScrollView style={styles.scrollView}>
        {/* Privacy Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy Settings</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Location Tracking</Text>
              <Text style={styles.settingDescription}>
                Allow us to use your location to find nearby cafes
              </Text>
            </View>
            <Switch
              value={locationTracking}
              onValueChange={setLocationTracking}
              trackColor={{ false: "#D1D5DB", true: "#8B4513" }}
              thumbColor={locationTracking ? "#FFFFFF" : "#F3F4F6"}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Analytics Data</Text>
              <Text style={styles.settingDescription}>
                Help us improve the app by sharing usage analytics
              </Text>
            </View>
            <Switch
              value={analyticsData}
              onValueChange={setAnalyticsData}
              trackColor={{ false: "#D1D5DB", true: "#8B4513" }}
              thumbColor={analyticsData ? "#FFFFFF" : "#F3F4F6"}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Crash Reports</Text>
              <Text style={styles.settingDescription}>
                Send crash reports to help us fix issues
              </Text>
            </View>
            <Switch
              value={crashReports}
              onValueChange={setCrashReports}
              trackColor={{ false: "#D1D5DB", true: "#8B4513" }}
              thumbColor={crashReports ? "#FFFFFF" : "#F3F4F6"}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Data Sharing</Text>
              <Text style={styles.settingDescription}>
                Share anonymized data with partner cafes
              </Text>
            </View>
            <Switch
              value={dataSharing}
              onValueChange={setDataSharing}
              trackColor={{ false: "#D1D5DB", true: "#8B4513" }}
              thumbColor={dataSharing ? "#FFFFFF" : "#F3F4F6"}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Marketing Emails</Text>
              <Text style={styles.settingDescription}>
                Receive promotional offers and updates
              </Text>
            </View>
            <Switch
              value={marketingEmails}
              onValueChange={setMarketingEmails}
              trackColor={{ false: "#D1D5DB", true: "#8B4513" }}
              thumbColor={marketingEmails ? "#FFFFFF" : "#F3F4F6"}
            />
          </View>
        </View>

        {/* Data Management */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Management</Text>
          <Text style={styles.sectionDescription}>
            Manage your personal data and account information
          </Text>

          <TouchableOpacity
            style={styles.actionItem}
            onPress={handleDataDownload}
          >
            <Ionicons name="download-outline" size={24} color="#3498DB" />
            <View style={styles.actionText}>
              <Text style={styles.actionTitle}>Download My Data</Text>
              <Text style={styles.actionDescription}>
                Get a copy of all your data stored in our system
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => {
              Alert.alert(
                "Data Portability",
                "You can export your data in JSON format. This includes your profile, subscription history, and preferences.",
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Export",
                    onPress: () => console.log("Data export requested"),
                  },
                ]
              );
            }}
          >
            <Ionicons name="folder-outline" size={24} color="#8B4513" />
            <View style={styles.actionText}>
              <Text style={styles.actionTitle}>Export Data</Text>
              <Text style={styles.actionDescription}>
                Export your data to use with other services
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionItem}
            onPress={handleDataDeletion}
          >
            <Ionicons name="trash-outline" size={24} color="#E74C3C" />
            <View style={styles.actionText}>
              <Text style={[styles.actionTitle, styles.dangerText]}>
                Delete All Data
              </Text>
              <Text style={styles.actionDescription}>
                Permanently delete your account and all data
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        </View>

        {/* Security */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>

          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => {
              Alert.alert(
                "Change Password",
                "You will receive an email with instructions to reset your password.",
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Send Email",
                    onPress: () => console.log("Password reset requested"),
                  },
                ]
              );
            }}
          >
            <Ionicons name="key-outline" size={24} color="#8B4513" />
            <View style={styles.actionText}>
              <Text style={styles.actionTitle}>Change Password</Text>
              <Text style={styles.actionDescription}>
                Update your account password
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => {
              Alert.alert(
                "Active Sessions",
                "You are currently logged in on this device only. If you notice any suspicious activity, please change your password immediately."
              );
            }}
          >
            <Ionicons name="phone-portrait-outline" size={24} color="#8B4513" />
            <View style={styles.actionText}>
              <Text style={styles.actionTitle}>Active Sessions</Text>
              <Text style={styles.actionDescription}>
                View devices where you're logged in
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        </View>

        {/* Legal Documents */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Legal Documents</Text>

          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => Linking.openURL("https://www.coffeeshare.ro/terms")}
          >
            <Ionicons name="document-text-outline" size={24} color="#666" />
            <View style={styles.actionText}>
              <Text style={styles.actionTitle}>Terms of Service</Text>
              <Text style={styles.actionDescription}>
                Read our terms and conditions
              </Text>
            </View>
            <Ionicons name="open-outline" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => Linking.openURL("https://www.coffeeshare.ro/gdpr")}
          >
            <Ionicons name="shield-outline" size={24} color="#666" />
            <View style={styles.actionText}>
              <Text style={styles.actionTitle}>GDPR Compliance</Text>
              <Text style={styles.actionDescription}>
                Learn about our GDPR compliance
              </Text>
            </View>
            <Ionicons name="open-outline" size={20} color="#999" />
          </TouchableOpacity>
        </View>

        {/* Privacy Policy */}
        <View style={[styles.section, styles.lastSection]}>
          <Text style={styles.sectionTitle}>Privacy Policy</Text>
          <View style={styles.policyContainer}>
            <Text style={styles.policyText}>{privacyPolicyContent}</Text>
          </View>
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
  section: {
    backgroundColor: "#FFFFFF",
    marginTop: 10,
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  lastSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#321E0E",
    marginBottom: 5,
  },
  sectionDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 15,
    lineHeight: 20,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  settingInfo: {
    flex: 1,
    marginRight: 15,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#321E0E",
  },
  settingDescription: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
    lineHeight: 18,
  },
  actionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  actionText: {
    flex: 1,
    marginLeft: 15,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#321E0E",
  },
  actionDescription: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
    lineHeight: 18,
  },
  dangerText: {
    color: "#E74C3C",
  },
  policyContainer: {
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    padding: 15,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  policyText: {
    fontSize: 12,
    color: "#4A5568",
    lineHeight: 18,
    fontFamily: "monospace",
  },
});
