import React, { useState } from "react";
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
} from "react-native";
import { Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useLanguage } from "../../../context/LanguageContext";

interface FAQItem {
  question: string;
  answer: string;
}

export default function HelpSupportScreen() {
  const { t } = useLanguage();
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

  const faqData: FAQItem[] = [
    {
      question: "How do I purchase a coffee subscription?",
      answer:
        "You can purchase a coffee subscription by going to the Subscriptions tab in your profile. Choose from our available plans and complete the payment process.",
    },
    {
      question: "How do I redeem my coffee beans?",
      answer:
        "To redeem your coffee beans, visit any participating cafe and show your QR code from the app. The cafe staff will scan it and deduct the appropriate beans from your account.",
    },
    {
      question: "What happens if my subscription expires?",
      answer:
        "When your subscription expires, you won't be able to redeem any remaining beans. However, you can renew your subscription to continue using the service.",
    },
    {
      question: "Can I change my subscription plan?",
      answer:
        "Yes, you can upgrade or downgrade your subscription plan at any time. The changes will take effect on your next billing cycle.",
    },
    {
      question: "How do I find participating cafes?",
      answer:
        "Use the Map tab to find all participating cafes near your location. You can also search for specific cafes or browse by city.",
    },
    {
      question: "What if I have issues with my QR code?",
      answer:
        "If your QR code isn't working, try refreshing the QR code screen or check your internet connection. If the problem persists, contact our support team.",
    },
    {
      question: "How do I update my profile information?",
      answer:
        "Go to Account Settings and select Edit Profile. You can update your name, phone number, and profile picture from there.",
    },
    {
      question: "Can I get a refund for my subscription?",
      answer:
        "Refunds are available within 7 days of purchase if you haven't used any coffee beans. Please contact our support team for refund requests.",
    },
  ];

  const contactOptions = [
    {
      title: "Email Support",
      subtitle: "Get help via email",
      icon: "mail-outline" as const,
      action: () => {
        Linking.openURL(
          "mailto:support@coffeeshare.ro?subject=CoffeeShare Support Request"
        );
      },
    },
    {
      title: "Live Chat",
      subtitle: "Chat with our support team",
      icon: "chatbubble-outline" as const,
      action: () => {
        Alert.alert(
          "Live Chat",
          "Live chat feature is coming soon! Please use email support for now."
        );
      },
    },
    {
      title: "Call Support",
      subtitle: "+40 123 456 789",
      icon: "call-outline" as const,
      action: () => {
        Linking.openURL("tel:+40123456789");
      },
    },
    {
      title: "Visit Our Website",
      subtitle: "www.coffeeshare.ro",
      icon: "globe-outline" as const,
      action: () => {
        Linking.openURL("https://www.coffeeshare.ro");
      },
    },
  ];

  const handleFAQPress = (index: number) => {
    setExpandedFAQ(expandedFAQ === index ? null : index);
  };

  const handleReportBug = () => {
    const subject = "Bug Report - CoffeeShare App";
    const body = `
Please describe the bug you encountered:

Steps to reproduce:
1. 
2. 
3. 

Expected behavior:


Actual behavior:


Device information:
- Device: 
- Operating System: 
- App Version: 
    `.trim();

    Linking.openURL(
      `mailto:bugs@coffeeshare.ro?subject=${encodeURIComponent(
        subject
      )}&body=${encodeURIComponent(body)}`
    );
  };

  const handleFeatureRequest = () => {
    const subject = "Feature Request - CoffeeShare App";
    const body = `
Please describe the feature you would like to see:

How would this feature benefit you:


Additional details:

    `.trim();

    Linking.openURL(
      `mailto:feedback@coffeeshare.ro?subject=${encodeURIComponent(
        subject
      )}&body=${encodeURIComponent(body)}`
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          headerTitle: t("helpSupport"),
          headerStyle: styles.headerStyle,
          headerTitleStyle: styles.headerTitleStyle,
          headerTintColor: "#321E0E",
        }}
      />

      <ScrollView style={styles.scrollView}>
        {/* Quick Help Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Help</Text>

          <TouchableOpacity
            style={styles.quickHelpItem}
            onPress={handleReportBug}
          >
            <Ionicons name="bug-outline" size={24} color="#E74C3C" />
            <View style={styles.quickHelpText}>
              <Text style={styles.quickHelpTitle}>Report a Bug</Text>
              <Text style={styles.quickHelpSubtitle}>
                Found an issue? Let us know
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickHelpItem}
            onPress={handleFeatureRequest}
          >
            <Ionicons name="bulb-outline" size={24} color="#3498DB" />
            <View style={styles.quickHelpText}>
              <Text style={styles.quickHelpTitle}>Feature Request</Text>
              <Text style={styles.quickHelpSubtitle}>Suggest new features</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickHelpItem}
            onPress={() => {
              Alert.alert(
                "App Version",
                "CoffeeShare v1.0.0\nBuild 1001\n\nDeveloped with ❤️ for coffee lovers"
              );
            }}
          >
            <Ionicons
              name="information-circle-outline"
              size={24}
              color="#8B4513"
            />
            <View style={styles.quickHelpText}>
              <Text style={styles.quickHelpTitle}>App Information</Text>
              <Text style={styles.quickHelpSubtitle}>
                Version and build info
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        </View>

        {/* FAQ Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>

          {faqData.map((faq, index) => (
            <View key={index} style={styles.faqItem}>
              <TouchableOpacity
                style={styles.faqQuestion}
                onPress={() => handleFAQPress(index)}
              >
                <Text style={styles.faqQuestionText}>{faq.question}</Text>
                <Ionicons
                  name={expandedFAQ === index ? "chevron-up" : "chevron-down"}
                  size={20}
                  color="#8B4513"
                />
              </TouchableOpacity>

              {expandedFAQ === index && (
                <View style={styles.faqAnswer}>
                  <Text style={styles.faqAnswerText}>{faq.answer}</Text>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Contact Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Support</Text>
          <Text style={styles.sectionSubtitle}>
            Can't find what you're looking for? Our support team is here to
            help!
          </Text>

          {contactOptions.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={styles.contactItem}
              onPress={option.action}
            >
              <Ionicons name={option.icon} size={24} color="#8B4513" />
              <View style={styles.contactText}>
                <Text style={styles.contactTitle}>{option.title}</Text>
                <Text style={styles.contactSubtitle}>{option.subtitle}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Support Hours */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support Hours</Text>

          <View style={styles.hoursContainer}>
            <View style={styles.hoursRow}>
              <Text style={styles.hoursDay}>Monday - Friday</Text>
              <Text style={styles.hoursTime}>9:00 AM - 6:00 PM</Text>
            </View>
            <View style={styles.hoursRow}>
              <Text style={styles.hoursDay}>Saturday</Text>
              <Text style={styles.hoursTime}>10:00 AM - 4:00 PM</Text>
            </View>
            <View style={styles.hoursRow}>
              <Text style={styles.hoursDay}>Sunday</Text>
              <Text style={styles.hoursTime}>Closed</Text>
            </View>
          </View>

          <View style={styles.timezoneNote}>
            <Ionicons name="time-outline" size={16} color="#8B4513" />
            <Text style={styles.timezoneText}>
              All times in Romania (EET/EEST)
            </Text>
          </View>
        </View>

        {/* Additional Resources */}
        <View style={[styles.section, styles.lastSection]}>
          <Text style={styles.sectionTitle}>Additional Resources</Text>

          <TouchableOpacity
            style={styles.resourceItem}
            onPress={() => Linking.openURL("https://www.coffeeshare.ro/terms")}
          >
            <Ionicons name="document-text-outline" size={20} color="#666" />
            <Text style={styles.resourceText}>Terms of Service</Text>
            <Ionicons name="open-outline" size={16} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.resourceItem}
            onPress={() =>
              Linking.openURL("https://www.coffeeshare.ro/privacy")
            }
          >
            <Ionicons name="shield-outline" size={20} color="#666" />
            <Text style={styles.resourceText}>Privacy Policy</Text>
            <Ionicons name="open-outline" size={16} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.resourceItem}
            onPress={() => Linking.openURL("https://www.coffeeshare.ro/blog")}
          >
            <Ionicons name="library-outline" size={20} color="#666" />
            <Text style={styles.resourceText}>Coffee Blog</Text>
            <Ionicons name="open-outline" size={16} color="#999" />
          </TouchableOpacity>
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
  sectionSubtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 15,
    lineHeight: 20,
  },
  quickHelpItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  quickHelpText: {
    flex: 1,
    marginLeft: 15,
  },
  quickHelpTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#321E0E",
  },
  quickHelpSubtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  faqItem: {
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  faqQuestion: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 15,
  },
  faqQuestionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
    color: "#321E0E",
    marginRight: 10,
  },
  faqAnswer: {
    paddingBottom: 15,
    paddingLeft: 10,
  },
  faqAnswerText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  contactText: {
    flex: 1,
    marginLeft: 15,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#321E0E",
  },
  contactSubtitle: {
    fontSize: 14,
    color: "#8B4513",
    marginTop: 2,
  },
  hoursContainer: {
    marginTop: 10,
  },
  hoursRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  hoursDay: {
    fontSize: 16,
    color: "#321E0E",
  },
  hoursTime: {
    fontSize: 16,
    color: "#8B4513",
    fontWeight: "500",
  },
  timezoneNote: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  timezoneText: {
    fontSize: 12,
    color: "#8B4513",
    marginLeft: 5,
    fontStyle: "italic",
  },
  resourceItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  resourceText: {
    flex: 1,
    fontSize: 16,
    color: "#321E0E",
    marginLeft: 12,
  },
});
