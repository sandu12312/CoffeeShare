import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ImageBackground,
  Alert,
  ActivityIndicator,
} from "react-native";
import React, { useState } from "react";
import { Stack, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useFirebase } from "../../context/FirebaseContext";
import { useLanguage, TranslationKey } from "../../context/LanguageContext";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  // Stare pentru validarea erorilor în timp real
  const [emailError, setEmailError] = useState("");

  const { resetPassword } = useFirebase();
  const { t } = useLanguage();

  // Funcție de validare pentru email
  const validateEmail = (email: string) => {
    if (!email) {
      setEmailError("Email is required");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError("Please enter a valid email");
      return false;
    }
    setEmailError("");
    return true;
  };

  const handleResetPassword = async () => {
    // Șterg erorile anterioare
    setEmailError("");

    // Validez datele de intrare
    const isEmailValid = validateEmail(email);

    if (!isEmailValid) {
      return;
    }

    try {
      setLoading(true);
      await resetPassword(email);
      setIsSubmitted(true);
    } catch (error: any) {
      console.error("Password reset error:", error);
      let errorMessageKey: TranslationKey =
        "forgotPassword.failedToSendDefault";

      if (error.code === "auth/user-not-found") {
        errorMessageKey = "forgotPassword.userNotFoundError";
      } else if (error.code === "auth/invalid-email") {
        errorMessageKey = "forgotPassword.invalidEmailError";
      }

      Alert.alert(t("forgotPassword.errorTitle"), t(errorMessageKey));
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    router.push("/(auth)/login");
  };

  return (
    <ImageBackground
      source={require("../../assets/images/coffee-beans-textured-background.jpg")}
      style={styles.container}
      resizeMode="cover"
    >
      <StatusBar style="light" />
      <Stack.Screen options={{ headerShown: false }} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView contentContainerStyle={styles.scrollView}>
          <View style={styles.logoContainer}>
            <Image
              source={require("../../assets/images/logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.appName}>{t("common.appName")}</Text>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.welcomeText}>{t("forgotPassword.title")}</Text>
            <Text style={styles.subtitleText}>
              {t(
                isSubmitted
                  ? "forgotPassword.subtitleSubmitted"
                  : "forgotPassword.subtitleInitial"
              )}
            </Text>

            {!isSubmitted ? (
              <>
                <View style={styles.inputGroup}>
                  <View
                    style={[
                      styles.inputContainer,
                      emailError ? styles.inputContainerError : null,
                    ]}
                  >
                    <Ionicons
                      name="mail-outline"
                      size={20}
                      color="#8B4513"
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder={t("common.emailPlaceholder")}
                      placeholderTextColor="#8B4513"
                      value={email}
                      onChangeText={(text) => {
                        setEmail(text);
                        if (emailError) validateEmail(text);
                      }}
                      onBlur={() => validateEmail(email)}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>
                  {emailError ? (
                    <Text style={styles.errorText}>{emailError}</Text>
                  ) : null}
                </View>

                <TouchableOpacity
                  style={styles.resetButton}
                  onPress={handleResetPassword}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.resetButtonText}>
                      {t("forgotPassword.resetButton")}
                    </Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.successContainer}>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={60}
                  color="#8B4513"
                  style={styles.successIcon}
                />
                <Text style={styles.successText}>
                  {t("forgotPassword.successMessage")}
                </Text>
              </View>
            )}

            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>
                {t("forgotPassword.rememberPasswordPrompt")}
              </Text>
              <TouchableOpacity onPress={handleBackToLogin}>
                <Text style={styles.loginLink}>
                  {t("forgotPassword.backToLoginLink")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flexGrow: 1,
    justifyContent: "center",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  logo: {
    width: 100,
    height: 100,
  },
  appName: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginTop: 10,
  },
  formContainer: {
    backgroundColor: "rgba(255, 248, 220, 0.75)",
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.5)",
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#321E0E",
    marginBottom: 5,
    textAlign: "center",
  },
  subtitleText: {
    fontSize: 16,
    color: "#8B4513",
    marginBottom: 20,
    textAlign: "center",
  },
  inputGroup: {
    marginBottom: 15,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderRadius: 10,
    paddingHorizontal: 15,
    height: 50,
    borderWidth: 1,
    borderColor: "rgba(139, 69, 19, 0.3)",
  },
  inputContainerError: {
    borderColor: "#FF4444",
    borderWidth: 2,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: "#321E0E",
    fontSize: 16,
  },
  errorText: {
    color: "#FF4444",
    fontSize: 12,
    marginTop: 5,
    marginLeft: 5,
    fontWeight: "500",
  },
  resetButton: {
    backgroundColor: "#8B4513",
    borderRadius: 10,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  resetButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  successContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  successIcon: {
    marginBottom: 15,
  },
  successText: {
    color: "#321E0E",
    fontSize: 16,
    textAlign: "center",
    lineHeight: 22,
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 10,
  },
  loginText: {
    color: "#8B4513",
    fontSize: 14,
  },
  loginLink: {
    color: "#321E0E",
    fontSize: 14,
    fontWeight: "bold",
  },
});
