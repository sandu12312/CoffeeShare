import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
  Switch,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  roleManagementService,
  UserRole,
  UserSearchResult,
} from "../services/roleManagementService";
import { colors } from "../styles/common";

interface RoleChangeModalProps {
  visible: boolean;
  user: UserSearchResult | null;
  onClose: () => void;
  onComplete: () => void;
}

const RoleChangeModal: React.FC<RoleChangeModalProps> = ({
  visible,
  user,
  onClose,
  onComplete,
}) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>("user");
  const [loading, setLoading] = useState(false);

  // Admin specific fields
  const [permissions, setPermissions] = useState<string[]>(["read"]);
  const [accessLevel, setAccessLevel] = useState<"super" | "standard">(
    "standard"
  );

  // Partner specific fields
  const [businessName, setBusinessName] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [businessPhone, setBusinessPhone] = useState("");
  const [verificationStatus, setVerificationStatus] = useState<
    "pending" | "verified" | "rejected"
  >("pending");

  React.useEffect(() => {
    if (user) {
      setSelectedRole(user.role);

      // Type-safe access to role-specific properties
      const userData = user.userData as any; // Using any for now since userData can have different shapes

      setBusinessName(userData.businessName || "");
      setBusinessAddress(userData.businessAddress || "");
      setBusinessPhone(userData.businessPhone || "");

      if (user.role === "admin") {
        setPermissions(userData.permissions || ["read"]);
        setAccessLevel(userData.accessLevel || "standard");
      }

      if (user.role === "partner") {
        setVerificationStatus(userData.verificationStatus || "pending");
      }
    }
  }, [user]);

  const availablePermissions = [
    { key: "read", label: "Read" },
    { key: "write", label: "Write" },
    { key: "delete", label: "Delete" },
    { key: "manage_users", label: "Manage Users" },
    { key: "manage_partners", label: "Manage Partners" },
    { key: "system_admin", label: "System Admin" },
  ];

  const roleOptions = [
    { value: "user" as UserRole, label: "Regular User", color: colors.primary },
    {
      value: "admin" as UserRole,
      label: "Administrator",
      color: colors.success,
    },
    {
      value: "partner" as UserRole,
      label: "Coffee Partner",
      color: colors.warning,
    },
  ];

  const handlePermissionToggle = (permission: string) => {
    setPermissions((prev) =>
      prev.includes(permission)
        ? prev.filter((p) => p !== permission)
        : [...prev, permission]
    );
  };

  const handleSubmit = async () => {
    if (!user) return;

    // Validation
    if (selectedRole === "partner" && !businessName.trim()) {
      Alert.alert("Error", "Business name is required for partners");
      return;
    }

    if (selectedRole === "admin" && permissions.length === 0) {
      Alert.alert(
        "Error",
        "At least one permission is required for administrators"
      );
      return;
    }

    setLoading(true);
    try {
      let additionalData: any = {};

      switch (selectedRole) {
        case "admin":
          additionalData = {
            permissions,
            accessLevel,
          };
          break;
        case "partner":
          additionalData = {
            businessName: businessName.trim(),
            businessAddress: businessAddress.trim(),
            businessPhone: businessPhone.trim(),
            verificationStatus,
          };
          break;
        case "user":
          // Keep existing user data like preferences, stats, subscription
          additionalData = {
            preferences: (user.userData as any).preferences || {},
            stats: (user.userData as any).stats || {},
            subscription: (user.userData as any).subscription || {},
          };
          break;
      }

      await roleManagementService.changeUserRole(
        user.userData.uid,
        selectedRole,
        additionalData
      );

      Alert.alert(
        "Success",
        `User role changed to ${
          roleOptions.find((r) => r.value === selectedRole)?.label
        }`,
        [{ text: "OK", onPress: onComplete }]
      );
    } catch (error) {
      console.error("Error changing user role:", error);
      Alert.alert("Error", "Failed to change user role. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const renderRoleSpecificFields = () => {
    switch (selectedRole) {
      case "admin":
        return (
          <View style={styles.roleFields}>
            <Text style={styles.sectionTitle}>Administrator Settings</Text>

            <View style={styles.field}>
              <Text style={styles.label}>Access Level</Text>
              <View style={styles.accessLevelContainer}>
                <TouchableOpacity
                  style={[
                    styles.accessLevelButton,
                    accessLevel === "standard" &&
                      styles.accessLevelButtonActive,
                  ]}
                  onPress={() => setAccessLevel("standard")}
                >
                  <Text
                    style={[
                      styles.accessLevelText,
                      accessLevel === "standard" &&
                        styles.accessLevelTextActive,
                    ]}
                  >
                    Standard
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.accessLevelButton,
                    accessLevel === "super" && styles.accessLevelButtonActive,
                  ]}
                  onPress={() => setAccessLevel("super")}
                >
                  <Text
                    style={[
                      styles.accessLevelText,
                      accessLevel === "super" && styles.accessLevelTextActive,
                    ]}
                  >
                    Super Admin
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Permissions</Text>
              {availablePermissions.map((permission) => (
                <View key={permission.key} style={styles.permissionItem}>
                  <Text style={styles.permissionLabel}>{permission.label}</Text>
                  <Switch
                    value={permissions.includes(permission.key)}
                    onValueChange={() => handlePermissionToggle(permission.key)}
                    trackColor={{ false: colors.border, true: colors.primary }}
                    thumbColor={
                      permissions.includes(permission.key)
                        ? colors.background
                        : colors.textLight
                    }
                  />
                </View>
              ))}
            </View>
          </View>
        );

      case "partner":
        return (
          <View style={styles.roleFields}>
            <Text style={styles.sectionTitle}>
              Partner Business Information
            </Text>

            <View style={styles.field}>
              <Text style={styles.label}>Business Name *</Text>
              <TextInput
                style={styles.input}
                value={businessName}
                onChangeText={setBusinessName}
                placeholder="Enter business name"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Business Address</Text>
              <TextInput
                style={styles.input}
                value={businessAddress}
                onChangeText={setBusinessAddress}
                placeholder="Enter business address"
                multiline
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Business Phone</Text>
              <TextInput
                style={styles.input}
                value={businessPhone}
                onChangeText={setBusinessPhone}
                placeholder="Enter business phone"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Verification Status</Text>
              <View style={styles.statusContainer}>
                {(["pending", "verified", "rejected"] as const).map(
                  (status) => (
                    <TouchableOpacity
                      key={status}
                      style={[
                        styles.statusButton,
                        verificationStatus === status &&
                          styles.statusButtonActive,
                        { borderColor: getStatusColor(status) },
                        verificationStatus === status && {
                          backgroundColor: getStatusColor(status),
                        },
                      ]}
                      onPress={() => setVerificationStatus(status)}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          verificationStatus === status &&
                            styles.statusTextActive,
                        ]}
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  )
                )}
              </View>
            </View>
          </View>
        );

      default:
        return (
          <View style={styles.roleFields}>
            <Text style={styles.sectionTitle}>Regular User</Text>
            <Text style={styles.description}>
              This user will have standard access to the app with
              subscription-based features.
            </Text>
          </View>
        );
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "verified":
        return colors.success;
      case "rejected":
        return colors.error;
      case "pending":
      default:
        return colors.warning;
    }
  };

  if (!user) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Change User Role</Text>
              <Text style={styles.subtitle}>
                {user.userData.displayName || user.userData.email}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            {/* Current Role Info */}
            <View style={styles.currentRoleInfo}>
              <Text style={styles.currentRoleLabel}>Current Role:</Text>
              <View
                style={[
                  styles.currentRoleBadge,
                  {
                    backgroundColor: roleOptions.find(
                      (r) => r.value === user.role
                    )?.color,
                  },
                ]}
              >
                <Text style={styles.currentRoleText}>
                  {roleOptions.find((r) => r.value === user.role)?.label}
                </Text>
              </View>
            </View>

            {/* Role Selection */}
            <View style={styles.field}>
              <Text style={styles.label}>New Role</Text>
              <View style={styles.roleSelection}>
                {roleOptions.map((role) => (
                  <TouchableOpacity
                    key={role.value}
                    style={[
                      styles.roleOption,
                      selectedRole === role.value && styles.roleOptionActive,
                      { borderColor: role.color },
                      selectedRole === role.value && {
                        backgroundColor: role.color,
                      },
                    ]}
                    onPress={() => setSelectedRole(role.value)}
                  >
                    <Text
                      style={[
                        styles.roleOptionText,
                        selectedRole === role.value &&
                          styles.roleOptionTextActive,
                      ]}
                    >
                      {role.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Role-specific fields */}
            {renderRoleSpecificFields()}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.submitButton]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color={colors.background} />
              ) : (
                <Text style={styles.submitButtonText}>Change Role</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    backgroundColor: colors.background,
    borderRadius: 12,
    width: "90%",
    maxHeight: "80%",
    maxWidth: 500,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: 4,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  currentRoleInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    padding: 12,
    backgroundColor: colors.border + "30",
    borderRadius: 8,
  },
  currentRoleLabel: {
    fontSize: 14,
    color: colors.textLight,
    marginRight: 8,
  },
  currentRoleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  currentRoleText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.background,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 8,
  },
  roleSelection: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  roleOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 2,
    minWidth: 120,
    alignItems: "center",
  },
  roleOptionActive: {
    borderWidth: 0,
  },
  roleOptionText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.textLight,
  },
  roleOptionTextActive: {
    color: colors.background,
    fontWeight: "600",
  },
  roleFields: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 16,
  },
  description: {
    fontSize: 14,
    color: colors.textLight,
    lineHeight: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.text,
  },
  accessLevelContainer: {
    flexDirection: "row",
    gap: 8,
  },
  accessLevelButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },
  accessLevelButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  accessLevelText: {
    fontSize: 14,
    color: colors.textLight,
  },
  accessLevelTextActive: {
    color: colors.background,
    fontWeight: "600",
  },
  permissionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  permissionLabel: {
    fontSize: 14,
    color: colors.text,
  },
  statusContainer: {
    flexDirection: "row",
    gap: 8,
  },
  statusButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: "center",
  },
  statusButtonActive: {
    borderWidth: 0,
  },
  statusText: {
    fontSize: 12,
    color: colors.textLight,
  },
  statusTextActive: {
    color: colors.background,
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: colors.border,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textLight,
  },
  submitButton: {
    backgroundColor: colors.primary,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.background,
  },
});

export default RoleChangeModal;
