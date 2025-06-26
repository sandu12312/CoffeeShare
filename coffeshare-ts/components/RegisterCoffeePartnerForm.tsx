import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { doc, setDoc, serverTimestamp, collection } from "firebase/firestore";
import { db } from "../config/firebase";
import Toast from "react-native-toast-message";

interface RegisterCoffeePartnerFormProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

const RegisterCoffeePartnerForm: React.FC<RegisterCoffeePartnerFormProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Resetez formularul când se închide modalul
  const handleClose = () => {
    setFormData({
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    });
    setErrors({});
    onClose();
  };

  // Generez o parolă puternică
  const generateStrongPassword = () => {
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const numbers = "0123456789";
    const symbols = "!@#$%^&*()_+-=[]{}|;:,.<>?";

    let password = "";

    // Mă asigur că am cel puțin un caracter din fiecare categorie
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];

    // Completez restul cu caractere aleatorii din toate categoriile
    const allChars = lowercase + uppercase + numbers + symbols;
    for (let i = 4; i < 16; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    // Amestec parola
    password = password
      .split("")
      .sort(() => 0.5 - Math.random())
      .join("");

    setFormData((prev) => ({ ...prev, password, confirmPassword: password }));
  };

  // Generez token de confirmare
  const generateConfirmationToken = (): string => {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  };

  // Obțin puterea parolei
  const getPasswordStrength = (password: string) => {
    if (password.length === 0) return { strength: 0, label: "", color: "#DDD" };

    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score < 3) return { strength: 1, label: "Weak", color: "#E53935" };
    if (score < 5) return { strength: 2, label: "Medium", color: "#FF9800" };
    return { strength: 3, label: "Strong", color: "#4CAF50" };
  };

  // Validez formularul
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Validare nume
    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    // Validare email
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    // Validare parolă
    if (!formData.password.trim()) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters long";
    }

    // Validare confirmare parolă
    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Trimit email de confirmare
  const sendConfirmationEmail = async (
    email: string,
    name: string,
    confirmationToken: string
  ) => {
    try {
      // Într-o implementare reală, aceasta ar apela o Firebase Function sau EmailJS
      // Deocamdată, voi loga doar conținutul email-ului
      const confirmationLink = `https://yourdomain.com/confirm-partner-registration?token=${confirmationToken}`;

      console.log("Confirmation email would be sent to:", email);
      console.log("Email content:", {
        to: email,
        subject: "CoffeeShare - Confirm Your Partner Registration",
        body: `
          Dear ${name},
          
          You have been invited to join CoffeeShare as a coffee partner by our admin team.
          
          To activate your account and start managing your cafe, please click the confirmation link below:
          
          ${confirmationLink}
          
          This link will expire in 48 hours for security reasons.
          
          After confirming, you'll be able to:
          - Log in to your partner dashboard
          - Add your cafe details and menu
          - Start managing customer interactions
          
          If you didn't expect this invitation or have any questions, please contact our support team.
          
          Welcome to the CoffeeShare community!
          
          Best regards,
          The CoffeeShare Team
        `,
      });

      Toast.show({
        type: "success",
        text1: "Confirmation Email Sent",
        text2: `Registration request sent to ${email}`,
      });
    } catch (error) {
      console.error("Error sending confirmation email:", error);
      Toast.show({
        type: "error",
        text1: "Email Error",
        text2: "Failed to send confirmation email",
      });
      throw error;
    }
  };

  // Gestionez trimiterea formularului
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Generez token de confirmare
      const confirmationToken = generateConfirmationToken();

      // Stochez înregistrarea în așteptare în Firestore
      const pendingRegistrationRef = doc(
        collection(db, "pendingPartnerRegistrations")
      );
      await setDoc(pendingRegistrationRef, {
        name: formData.name,
        email: formData.email,
        password: formData.password, // În producție, aceasta ar trebui să fie criptată
        confirmationToken: confirmationToken,
        status: "pending",
        createdAt: serverTimestamp(),
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 de ore de acum
        createdBy: "admin", // Ar putea fi dinamic pe baza utilizatorului admin curent
      });

      // Trimit email de confirmare
      await sendConfirmationEmail(
        formData.email,
        formData.name,
        confirmationToken
      );

      // Afișez mesajul de succes
      Toast.show({
        type: "success",
        text1: "Registration Request Sent",
        text2: `Confirmation email sent to ${formData.name}`,
      });

      Alert.alert(
        "Registration Request Sent",
        `A confirmation email has been sent to ${formData.email}.\n\nThe partner must click the confirmation link within 48 hours to activate their account.\n\nCredentials that will be activated:\nEmail: ${formData.email}\nPassword: ${formData.password}`,
        [
          {
            text: "OK",
            onPress: () => {
              handleClose();
              onSuccess();
            },
          },
        ]
      );
    } catch (error) {
      console.error("Error sending registration request:", error);
      Toast.show({
        type: "error",
        text1: "Request Failed",
        text2: `Failed to send registration request: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      });
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = getPasswordStrength(formData.password);

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.title}>Send Partner Registration Request</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.subtitle}>
            Send a registration invitation to a new coffee partner
          </Text>

          <View style={styles.infoBox}>
            <Ionicons
              name="information-circle-outline"
              size={20}
              color="#2196F3"
            />
            <Text style={styles.infoText}>
              The partner will receive a confirmation email and must accept the
              invitation within 48 hours to activate their account.
            </Text>
          </View>

          {/* Name Field */}
          <View style={styles.inputContainer}>
            <Ionicons
              name="person-outline"
              size={20}
              color="#8B4513"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              placeholderTextColor="#8B4513"
              value={formData.name}
              onChangeText={(text) =>
                setFormData((prev) => ({ ...prev, name: text }))
              }
              autoCapitalize="words"
            />
          </View>
          {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}

          {/* Email Field */}
          <View style={styles.inputContainer}>
            <Ionicons
              name="mail-outline"
              size={20}
              color="#8B4513"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Email Address"
              placeholderTextColor="#8B4513"
              value={formData.email}
              onChangeText={(text) =>
                setFormData((prev) => ({
                  ...prev,
                  email: text.toLowerCase().trim(),
                }))
              }
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

          {/* Password Field */}
          <View style={styles.inputContainer}>
            <Ionicons
              name="lock-closed-outline"
              size={20}
              color="#8B4513"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#8B4513"
              value={formData.password}
              onChangeText={(text) =>
                setFormData((prev) => ({ ...prev, password: text }))
              }
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={20}
                color="#8B4513"
              />
            </TouchableOpacity>
          </View>
          {errors.password && (
            <Text style={styles.errorText}>{errors.password}</Text>
          )}

          {/* Confirm Password Field */}
          <View style={styles.inputContainer}>
            <Ionicons
              name="lock-closed-outline"
              size={20}
              color="#8B4513"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Confirm Password"
              placeholderTextColor="#8B4513"
              value={formData.confirmPassword}
              onChangeText={(text) =>
                setFormData((prev) => ({ ...prev, confirmPassword: text }))
              }
              secureTextEntry={!showConfirmPassword}
            />
            <TouchableOpacity
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              <Ionicons
                name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                size={20}
                color="#8B4513"
              />
            </TouchableOpacity>
          </View>
          {errors.confirmPassword && (
            <Text style={styles.errorText}>{errors.confirmPassword}</Text>
          )}

          {/* Generate Password Button */}
          <TouchableOpacity
            style={styles.generatePasswordButton}
            onPress={generateStrongPassword}
          >
            <Ionicons name="key-outline" size={20} color="#FFF" />
            <Text style={styles.generatePasswordText}>
              Generate Strong Password
            </Text>
          </TouchableOpacity>

          {/* Password Strength Indicator */}
          {formData.password.length > 0 && (
            <View style={styles.passwordStrengthContainer}>
              <View style={styles.passwordStrengthBar}>
                <View
                  style={[
                    styles.passwordStrengthFill,
                    {
                      width: `${(passwordStrength.strength / 3) * 100}%`,
                      backgroundColor: passwordStrength.color,
                    },
                  ]}
                />
              </View>
              <Text
                style={[
                  styles.passwordStrengthText,
                  { color: passwordStrength.color },
                ]}
              >
                {passwordStrength.label}
              </Text>
            </View>
          )}

          <Text style={styles.noteText}>
            A confirmation email will be sent to the partner. They must accept
            the invitation to activate their account.
          </Text>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleClose}
            disabled={loading}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text style={styles.loadingText}>Sending Request...</Text>
              </View>
            ) : (
              <>
                <Ionicons name="mail-outline" size={20} color="#FFF" />
                <Text style={styles.submitButtonText}>
                  Send Registration Request
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  closeButton: {
    padding: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  infoBox: {
    flexDirection: "row",
    backgroundColor: "#E3F2FD",
    padding: 15,
    borderRadius: 10,
    marginBottom: 25,
    borderLeftWidth: 4,
    borderLeftColor: "#2196F3",
  },
  infoText: {
    fontSize: 14,
    color: "#1976D2",
    marginLeft: 10,
    flex: 1,
    lineHeight: 20,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 10,
    marginBottom: 15,
    paddingHorizontal: 15,
    height: 50,
    borderWidth: 1,
    borderColor: "rgba(139, 69, 19, 0.3)",
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
    color: "#E53935",
    fontSize: 14,
    marginBottom: 10,
    marginLeft: 5,
  },
  generatePasswordButton: {
    backgroundColor: "#8B4513",
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 15,
  },
  generatePasswordText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 8,
  },
  passwordStrengthContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  passwordStrengthBar: {
    flex: 1,
    height: 4,
    backgroundColor: "#E0E0E0",
    borderRadius: 2,
    marginRight: 10,
  },
  passwordStrengthFill: {
    height: "100%",
    borderRadius: 2,
  },
  passwordStrengthText: {
    fontSize: 12,
    fontWeight: "500",
    minWidth: 60,
  },
  noteText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    fontStyle: "italic",
    marginTop: 20,
  },
  footer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    backgroundColor: "#FFF",
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#DDD",
    alignItems: "center",
    marginRight: 10,
  },
  cancelButtonText: {
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
  },
  submitButton: {
    flex: 2,
    backgroundColor: "#2196F3",
    paddingVertical: 15,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  submitButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    color: "#FFFFFF",
    marginLeft: 10,
    fontSize: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});

export default RegisterCoffeePartnerForm;
