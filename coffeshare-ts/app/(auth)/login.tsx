import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ImageBackground,
  Alert,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Button from "../../components/Button";
import { useFirebase } from "../../context/FirebaseContext";
import { getAuth, signOut } from "firebase/auth";
import { app } from "../../config/firebase";
import { useLanguage, TranslationKey } from "../../context/LanguageContext";
import { roleManagementService } from "../../services/roleManagementService";

const auth = getAuth(app);

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Stări pentru validarea erorilor în timp real
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const { login, sendVerificationEmail } = useFirebase();
  const { t } = useLanguage();

  // Funcții de validare pentru formularul de login
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

  const validatePassword = (password: string) => {
    if (!password) {
      setPasswordError("Password is required");
      return false;
    }
    setPasswordError("");
    return true;
  };

  const handleLogin = async () => {
    // Șterg erorile anterioare
    setEmailError("");
    setPasswordError("");

    // Validez datele de intrare
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);

    if (!isEmailValid || !isPasswordValid) {
      return;
    }

    try {
      setLoading(true);
      const { role } = await login(email, password);

      // Verific dacă email-ul este verificat
      const user = auth.currentUser;
      if (user && !user.emailVerified) {
        Alert.alert(
          t("login.emailNotVerifiedTitle"),
          t("login.emailNotVerifiedMessage"),
          [
            {
              text: t("common.sendEmail"),
              onPress: async () => {
                try {
                  await sendVerificationEmail();
                  Alert.alert(
                    t("login.verificationEmailSentTitle"),
                    t("login.verificationEmailSentMessage")
                  );
                } catch (error) {
                  Alert.alert(
                    t("common.error"),
                    t("login.sendVerificationEmailError")
                  );
                }
              },
            },
            {
              text: t("common.cancel"),
              style: "cancel",
              onPress: () => signOut(auth),
            },
          ]
        );
        setLoading(false);
        return;
      }

      // Redirecționez utilizatorul pe baza rolului din sistemul de administrare
      console.log("Login successful, redirecting user with role:", role);
      switch (role) {
        case "admin":
          router.push("/(admin)/dashboard");
          break;
        case "partner":
          router.push("/(mainCoffeePartners)/dashboard");
          break;
        case "user":
          router.push("/(mainUsers)/dashboard");
          break;
        default:
          // Fallback - tratez rolurile necunoscute ca utilizatori normali
          console.warn(
            "Unknown role detected, defaulting to user dashboard:",
            role
          );
          router.push("/(mainUsers)/dashboard");
      }
    } catch (error: any) {
      console.error("Login error:", error);
      let errorMessageKey: TranslationKey = "login.loginFailedDefault";

      if (error.code === "auth/invalid-credential") {
        errorMessageKey = "login.invalidCredentialsError";
      } else if (error.code === "auth/user-not-found") {
        errorMessageKey = "login.userNotFoundError";
      } else if (error.code === "auth/wrong-password") {
        errorMessageKey = "login.wrongPasswordError";
      } else if (error.code === "auth/too-many-requests") {
        errorMessageKey = "login.tooManyRequestsError";
      }

      Alert.alert(t("login.loginErrorTitle"), t(errorMessageKey));
    } finally {
      if (auth.currentUser?.emailVerified || !auth.currentUser) {
        setLoading(false);
      }
    }
  };

  const handleForgotPassword = () => {
    router.push("/(auth)/forgot_password");
  };

  const handleRegister = () => {
    router.push("/(auth)/register");
  };

  return (
    <ImageBackground
      source={require("../../assets/images/coffee-beans-textured-background.jpg")}
      style={styles.background}
      resizeMode="cover"
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <View style={styles.backButtonContainer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#8B4513" />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.logoContainer}>
            <Text style={styles.logo}>☕</Text>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.welcomeText}>{t("login.welcomeBack")}</Text>
            <Text style={styles.subtitleText}>
              {t("login.signInToContinue")}
            </Text>

            <View style={styles.inputGroup}>
              <View
                style={[
                  styles.inputContainer,
                  emailError ? styles.inputContainerError : null,
                ]}
              >
                <Ionicons name="mail-outline" size={20} color="#8B4513" />
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

            <View style={styles.inputGroup}>
              <View
                style={[
                  styles.inputContainer,
                  passwordError ? styles.inputContainerError : null,
                ]}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color="#8B4513"
                />
                <TextInput
                  style={styles.input}
                  placeholder={t("common.passwordPlaceholder")}
                  placeholderTextColor="#8B4513"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (passwordError) validatePassword(text);
                  }}
                  onBlur={() => validatePassword(password)}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                >
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color="#8B4513"
                  />
                </TouchableOpacity>
              </View>
              {passwordError ? (
                <Text style={styles.errorText}>{passwordError}</Text>
              ) : null}
            </View>

            <TouchableOpacity
              onPress={handleForgotPassword}
              style={styles.forgotPasswordContainer}
            >
              <Text style={styles.forgotPasswordText}>
                {t("login.forgotPasswordLink")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.loginButton}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.loginButtonText}>
                  {t("login.loginButton")}
                </Text>
              )}
            </TouchableOpacity>

            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>
                {t("login.noAccountPrompt")}
              </Text>
              <TouchableOpacity onPress={handleRegister}>
                <Text style={styles.registerLink}>
                  {t("login.registerLink")}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Temporary Admin Upgrade Button - Remove in production! */}
            {email === "maximcapinus@gmail.com" && (
              <TouchableOpacity
                style={[
                  styles.loginButton,
                  { backgroundColor: "#FF6B6B", marginTop: 20 },
                ]}
                onPress={async () => {
                  try {
                    if (auth.currentUser) {
                      await roleManagementService.changeUserRole(
                        auth.currentUser.uid,
                        "admin",
                        {
                          permissions: [
                            "read",
                            "write",
                            "delete",
                            "manage_users",
                            "manage_partners",
                            "system_admin",
                          ],
                          accessLevel: "super",
                        }
                      );
                      Alert.alert(
                        "Success",
                        "You are now an admin! Please log out and log back in."
                      );
                    } else {
                      Alert.alert("Error", "Please login first");
                    }
                  } catch (error) {
                    console.error("Error upgrading to admin:", error);
                    Alert.alert("Error", "Failed to upgrade to admin");
                  }
                }}
              >
                <Text style={styles.loginButtonText}>
                  Make Me Admin (Dev Only)
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },
  backButtonContainer: {
    position: "absolute",
    top: 50,
    left: 20,
    zIndex: 10,
  },
  backButton: {
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderRadius: 12,
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  logo: {
    fontSize: 60,
  },
  formContainer: {
    backgroundColor: "rgba(255, 248, 220, 0.85)",
    borderRadius: 20,
    padding: 20,
    width: "100%",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.5)",
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#321E0E",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitleText: {
    fontSize: 16,
    color: "#8B4513",
    textAlign: "center",
    marginBottom: 30,
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
    borderWidth: 1,
    borderColor: "rgba(139, 69, 19, 0.3)",
  },
  inputContainerError: {
    borderColor: "#FF4444",
    borderWidth: 2,
  },
  input: {
    flex: 1,
    color: "#321E0E",
    paddingVertical: 15,
    paddingHorizontal: 10,
    fontSize: 16,
  },
  eyeIcon: {
    padding: 10,
  },
  errorText: {
    color: "#FF4444",
    fontSize: 12,
    marginTop: 5,
    marginLeft: 5,
    fontWeight: "500",
  },
  forgotPasswordContainer: {
    alignItems: "flex-end",
    marginBottom: 20,
    paddingVertical: 5,
  },
  forgotPasswordText: {
    color: "#8B4513",
    fontSize: 14,
    fontWeight: "500",
    textDecorationLine: "underline",
  },
  loginButton: {
    backgroundColor: "#8B4513",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 20,
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },

  registerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  registerText: {
    color: "#8B4513",
    fontSize: 14,
  },
  registerLink: {
    color: "#321E0E",
    fontSize: 14,
    fontWeight: "bold",
  },
});
