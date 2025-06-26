import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Switch,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import {
  SubscriptionService,
  SubscriptionPlan,
} from "../services/subscriptionService";

interface AddEditSubscriptionModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editPlan?: SubscriptionPlan | null;
}

interface FormData {
  name: string;
  credits: string;
  price: string;
  description: string;
  popular: boolean;
  tag: string;
}

interface FormErrors {
  name?: string;
  credits?: string;
  price?: string;
}

const AddEditSubscriptionModal: React.FC<AddEditSubscriptionModalProps> = ({
  visible,
  onClose,
  onSuccess,
  editPlan,
}) => {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    credits: "",
    price: "",
    description: "",
    popular: false,
    tag: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  // Inițializez formularul cu datele pentru editare
  useEffect(() => {
    if (editPlan) {
      setFormData({
        name: editPlan.name,
        credits: editPlan.credits.toString(),
        price: editPlan.price.toString(),
        description: editPlan.description || "",
        popular: editPlan.popular || false,
        tag: editPlan.tag || "",
      });
    } else {
      // Resetez formularul pentru plan nou
      setFormData({
        name: "",
        credits: "",
        price: "",
        description: "",
        popular: false,
        tag: "",
      });
    }
    setErrors({});
  }, [editPlan, visible]);

  const handleClose = () => {
    setFormData({
      name: "",
      credits: "",
      price: "",
      description: "",
      popular: false,
      tag: "",
    });
    setErrors({});
    onClose();
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Validare nume
    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    } else if (formData.name.length < 3) {
      newErrors.name = "Name must be at least 3 characters";
    }

    // Validare credite
    if (!formData.credits.trim()) {
      newErrors.credits = "Number of beans is required";
    } else {
      const credits = parseInt(formData.credits);
      if (isNaN(credits) || credits <= 0) {
        newErrors.credits = "Must be a positive number";
      } else if (credits > 1000) {
        newErrors.credits = "Cannot exceed 1000 beans";
      }
    }

    // Validare preț
    if (!formData.price.trim()) {
      newErrors.price = "Price is required";
    } else {
      const price = parseFloat(formData.price);
      if (isNaN(price) || price <= 0) {
        newErrors.price = "Must be a positive number";
      } else if (price > 10000) {
        newErrors.price = "Price seems too high";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const planData: Omit<SubscriptionPlan, "id"> = {
        name: formData.name.trim(),
        credits: parseInt(formData.credits),
        price: parseFloat(formData.price),
        description: formData.description.trim(),
        popular: formData.popular,
        tag: formData.tag.trim() || undefined,
      };

      if (editPlan?.id) {
        // Actualizez planul existent
        await SubscriptionService.updateSubscriptionPlan(editPlan.id, planData);
        Toast.show({
          type: "success",
          text1: "Plan Updated",
          text2: `${planData.name} has been updated successfully`,
        });
      } else {
        // Creez un plan nou
        await SubscriptionService.createSubscriptionPlan(planData);
        Toast.show({
          type: "success",
          text1: "Plan Created",
          text2: `${planData.name} has been created successfully`,
        });
      }

      handleClose();
      onSuccess();
    } catch (error) {
      console.error("Error saving subscription plan:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: editPlan
          ? "Failed to update subscription plan"
          : "Failed to create subscription plan",
      });
    } finally {
      setLoading(false);
    }
  };

  const suggestedTags = ["Most Popular", "Best Value", "New", "Limited Time"];

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>
              {editPlan
                ? "Edit Subscription Plan"
                : "Add New Subscription Plan"}
            </Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Câmp nume */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Plan Name <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, errors.name && styles.inputError]}
                value={formData.name}
                onChangeText={(text) =>
                  setFormData((prev) => ({ ...prev, name: text }))
                }
                placeholder="e.g., Starter Beans, Caffeine Boost"
                placeholderTextColor="#999"
              />
              {errors.name && (
                <Text style={styles.errorText}>{errors.name}</Text>
              )}
            </View>

            {/* Câmp credite */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Number of Beans <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, errors.credits && styles.inputError]}
                value={formData.credits}
                onChangeText={(text) =>
                  setFormData((prev) => ({ ...prev, credits: text }))
                }
                placeholder="e.g., 50, 100, 200"
                placeholderTextColor="#999"
                keyboardType="numeric"
              />
              {errors.credits && (
                <Text style={styles.errorText}>{errors.credits}</Text>
              )}
            </View>

            {/* Câmp preț */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Price (RON) <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.priceInputContainer}>
                <TextInput
                  style={[
                    styles.input,
                    styles.priceInput,
                    errors.price && styles.inputError,
                  ]}
                  value={formData.price}
                  onChangeText={(text) =>
                    setFormData((prev) => ({ ...prev, price: text }))
                  }
                  placeholder="e.g., 49, 69, 89"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                />
                <Text style={styles.currencyText}>RON</Text>
              </View>
              {errors.price && (
                <Text style={styles.errorText}>{errors.price}</Text>
              )}
            </View>

            {/* Câmp descriere */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.description}
                onChangeText={(text) =>
                  setFormData((prev) => ({ ...prev, description: text }))
                }
                placeholder="Brief description of the plan..."
                placeholderTextColor="#999"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {/* Comutator Popular */}
            <View style={styles.switchGroup}>
              <View style={styles.switchLabelContainer}>
                <Text style={styles.label}>Mark as Popular</Text>
                <Text style={styles.switchDescription}>
                  Highlight this plan to users
                </Text>
              </View>
              <Switch
                trackColor={{ false: "#767577", true: "#81C784" }}
                thumbColor={formData.popular ? "#4CAF50" : "#f4f3f4"}
                ios_backgroundColor="#3e3e3e"
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, popular: value }))
                }
                value={formData.popular}
              />
            </View>

            {/* Selectare tag */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Tag (Optional)</Text>
              <View style={styles.tagContainer}>
                {suggestedTags.map((tag) => (
                  <TouchableOpacity
                    key={tag}
                    style={[
                      styles.tagButton,
                      formData.tag === tag && styles.tagButtonActive,
                    ]}
                    onPress={() =>
                      setFormData((prev) => ({
                        ...prev,
                        tag: prev.tag === tag ? "" : tag,
                      }))
                    }
                  >
                    <Text
                      style={[
                        styles.tagText,
                        formData.tag === tag && styles.tagTextActive,
                      ]}
                    >
                      {tag}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput
                style={styles.input}
                value={formData.tag}
                onChangeText={(text) =>
                  setFormData((prev) => ({ ...prev, tag: text }))
                }
                placeholder="Or enter custom tag..."
                placeholderTextColor="#999"
              />
            </View>
          </ScrollView>

          {/* Butoane de acțiune */}
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
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons
                    name={editPlan ? "checkmark" : "add"}
                    size={20}
                    color="#FFF"
                  />
                  <Text style={styles.submitButtonText}>
                    {editPlan ? "Update Plan" : "Create Plan"}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    width: "90%",
    maxWidth: 400,
    maxHeight: "90%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  closeButton: {
    padding: 5,
  },
  scrollContent: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  required: {
    color: "#E53935",
  },
  input: {
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: "#333",
    backgroundColor: "#F8F9FA",
  },
  inputError: {
    borderColor: "#E53935",
  },
  textArea: {
    minHeight: 80,
    paddingTop: 12,
  },
  priceInputContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  priceInput: {
    flex: 1,
    marginRight: 10,
  },
  currencyText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#8B4513",
  },
  errorText: {
    color: "#E53935",
    fontSize: 12,
    marginTop: 5,
  },
  switchGroup: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  switchLabelContainer: {
    flex: 1,
  },
  switchDescription: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  tagContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 10,
  },
  tagButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#DDD",
    marginRight: 8,
    marginBottom: 8,
  },
  tagButtonActive: {
    backgroundColor: "#8B4513",
    borderColor: "#8B4513",
  },
  tagText: {
    fontSize: 12,
    color: "#666",
  },
  tagTextActive: {
    color: "#FFFFFF",
  },
  footer: {
    flexDirection: "row",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
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
    backgroundColor: "#4CAF50",
    paddingVertical: 12,
    borderRadius: 8,
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
  buttonDisabled: {
    opacity: 0.6,
  },
});

export default AddEditSubscriptionModal;
