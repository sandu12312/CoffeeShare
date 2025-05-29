import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  ScrollView,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { PartnerRegistrationService } from "../services/partnerRegistrationService";
import ScreenWrapper from "../components/ScreenWrapper";

export default function ConfirmRegistrationScreen() {
  const router = useRouter();
  const { token } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userUid, setUserUid] = useState<string | null>(null);

  useEffect(() => {
    if (token && typeof token === "string") {
      confirmRegistration(token);
    } else {
      setError("Invalid confirmation link");
      setLoading(false);
    }
  }, [token]);

  const confirmRegistration = async (confirmationToken: string) => {
    try {
      setLoading(true);
      const result = await PartnerRegistrationService.confirmRegistration(
        confirmationToken
      );

      if (result.success) {
        setConfirmed(true);
        setUserUid(result.userUid || null);
        setError(null);
      } else {
        setError(result.message);
        setConfirmed(false);
      }
    } catch (error) {
      console.error("Error confirming registration:", error);
      setError(
        "An unexpected error occurred while confirming your registration"
      );
      setConfirmed(false);
    } finally {
      setLoading(false);
    }
  };

  const handleContinueToLogin = () => {
    router.replace("/(auth)/login");
  };

  const handleGoToHomepage = () => {
    router.replace("/");
  };

  if (loading) {
    return (
      <ScreenWrapper>
        <View style={styles.container}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#8B4513" />
            <Text style={styles.loadingText}>
              Confirming your registration...
            </Text>
          </View>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.contentContainer}>
          {confirmed ? (
            // Success State
            <View style={styles.successContainer}>
              <View style={styles.iconContainer}>
                <Ionicons name="checkmark-circle" size={80} color="#4CAF50" />
              </View>

              <Text style={styles.successTitle}>Registration Confirmed!</Text>

              <Text style={styles.successMessage}>
                Your CoffeeShare partner account has been successfully
                activated. You can now log in and start managing your cafe.
              </Text>

              <View style={styles.infoBox}>
                <Ionicons
                  name="information-circle-outline"
                  size={20}
                  color="#2196F3"
                />
                <Text style={styles.infoText}>
                  After logging in, you'll be able to:
                  {"\n"}• Set up your cafe profile
                  {"\n"}• Add your coffee menu
                  {"\n"}• Manage customer interactions
                  {"\n"}• View analytics and insights
                </Text>
              </View>

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleContinueToLogin}
              >
                <Ionicons name="log-in-outline" size={20} color="#FFF" />
                <Text style={styles.primaryButtonText}>Continue to Login</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={handleGoToHomepage}
              >
                <Text style={styles.secondaryButtonText}>Go to Homepage</Text>
              </TouchableOpacity>
            </View>
          ) : (
            // Error State
            <View style={styles.errorContainer}>
              <View style={styles.iconContainer}>
                <Ionicons name="alert-circle" size={80} color="#E53935" />
              </View>

              <Text style={styles.errorTitle}>Confirmation Failed</Text>

              <Text style={styles.errorMessage}>{error}</Text>

              <View style={styles.helpBox}>
                <Ionicons
                  name="help-circle-outline"
                  size={20}
                  color="#FF9800"
                />
                <Text style={styles.helpText}>
                  If you believe this is an error, please contact our support
                  team or ask the admin who sent the invitation to resend the
                  confirmation email.
                </Text>
              </View>

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleGoToHomepage}
              >
                <Ionicons name="home-outline" size={20} color="#FFF" />
                <Text style={styles.primaryButtonText}>Go to Homepage</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={handleContinueToLogin}
              >
                <Text style={styles.secondaryButtonText}>Try Login Anyway</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#F8F9FA",
  },
  contentContainer: {
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  successContainer: {
    alignItems: "center",
    width: "100%",
  },
  errorContainer: {
    alignItems: "center",
    width: "100%",
  },
  iconContainer: {
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#4CAF50",
    marginBottom: 16,
    textAlign: "center",
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#E53935",
    marginBottom: 16,
    textAlign: "center",
  },
  successMessage: {
    fontSize: 16,
    color: "#333",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 24,
  },
  errorMessage: {
    fontSize: 16,
    color: "#E53935",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 24,
  },
  infoBox: {
    flexDirection: "row",
    backgroundColor: "#E3F2FD",
    padding: 16,
    borderRadius: 12,
    marginBottom: 32,
    borderLeftWidth: 4,
    borderLeftColor: "#2196F3",
    width: "100%",
  },
  infoText: {
    fontSize: 14,
    color: "#1976D2",
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  helpBox: {
    flexDirection: "row",
    backgroundColor: "#FFF3E0",
    padding: 16,
    borderRadius: 12,
    marginBottom: 32,
    borderLeftWidth: 4,
    borderLeftColor: "#FF9800",
    width: "100%",
  },
  helpText: {
    fontSize: 14,
    color: "#F57C00",
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  primaryButton: {
    backgroundColor: "#8B4513",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginBottom: 16,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  secondaryButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#DDD",
    width: "100%",
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "500",
  },
});
