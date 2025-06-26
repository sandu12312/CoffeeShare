import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  PartnerRegistrationService,
  PendingPartnerRegistration,
} from "../services/partnerRegistrationService";
import Toast from "react-native-toast-message";

interface PendingRegistrationsModalProps {
  visible: boolean;
  onClose: () => void;
}

const PendingRegistrationsModal: React.FC<PendingRegistrationsModalProps> = ({
  visible,
  onClose,
}) => {
  const [pendingRegistrations, setPendingRegistrations] = useState<
    PendingPartnerRegistration[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    pending: 0,
    confirmed: 0,
    expired: 0,
    rejected: 0,
    total: 0,
  });

  // Încarc înregistrările în așteptare
  const loadPendingRegistrations = async () => {
    try {
      setLoading(true);
      const [registrations, registrationStats] = await Promise.all([
        PartnerRegistrationService.getPendingRegistrations(),
        PartnerRegistrationService.getRegistrationStats(),
      ]);

      setPendingRegistrations(registrations);
      setStats(registrationStats);
    } catch (error) {
      console.error("Error loading pending registrations:", error);
      Toast.show({
        type: "error",
        text1: "Loading Error",
        text2: "Failed to load pending registrations",
      });
    } finally {
      setLoading(false);
    }
  };

  // Refresh-ez datele
  const onRefresh = async () => {
    setRefreshing(true);
    await loadPendingRegistrations();
    setRefreshing(false);
  };

  // Încarc datele când se deschide modalul
  useEffect(() => {
    if (visible) {
      loadPendingRegistrations();
    }
  }, [visible]);

  // Gestionez retrimiterea email-ului de confirmare
  const handleResendEmail = async (registrationId: string, email: string) => {
    try {
      const result = await PartnerRegistrationService.resendConfirmationEmail(
        registrationId
      );

      if (result.success) {
        Toast.show({
          type: "success",
          text1: "Email Resent",
          text2: `Confirmation email resent to ${email}`,
        });
      } else {
        Toast.show({
          type: "error",
          text1: "Failed to Resend",
          text2: result.message,
        });
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to resend confirmation email",
      });
    }
  };

  // Gestionez respingerea înregistrării
  const handleRejectRegistration = (
    registrationId: string,
    partnerName: string
  ) => {
    Alert.alert(
      "Reject Registration",
      `Are you sure you want to reject the registration for ${partnerName}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reject",
          style: "destructive",
          onPress: async () => {
            try {
              const result =
                await PartnerRegistrationService.rejectRegistration(
                  registrationId,
                  "Rejected by admin"
                );

              if (result.success) {
                Toast.show({
                  type: "success",
                  text1: "Registration Rejected",
                  text2: `${partnerName}'s registration has been rejected`,
                });
                loadPendingRegistrations(); // Refresh-ez lista
              } else {
                Toast.show({
                  type: "error",
                  text1: "Rejection Failed",
                  text2: result.message,
                });
              }
            } catch (error) {
              Toast.show({
                type: "error",
                text1: "Error",
                text2: "Failed to reject registration",
              });
            }
          },
        },
      ]
    );
  };

  // Gestionez curățarea înregistrărilor expirate
  const handleCleanupExpired = async () => {
    try {
      await PartnerRegistrationService.cleanupExpiredRegistrations();
      Toast.show({
        type: "success",
        text1: "Cleanup Complete",
        text2: "Expired registrations have been cleaned up",
      });
      loadPendingRegistrations(); // Refresh-ez lista
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Cleanup Failed",
        text2: "Failed to clean up expired registrations",
      });
    }
  };

  // Formatez data
  const formatDate = (date: any) => {
    if (!date) return "N/A";
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString() + " " + d.toLocaleTimeString();
  };

  // Verific dacă înregistrarea a expirat
  const isExpired = (expiresAt: any) => {
    const expDate = expiresAt instanceof Date ? expiresAt : expiresAt?.toDate();
    return expDate && new Date() > expDate;
  };

  const renderRegistrationItem = (registration: PendingPartnerRegistration) => {
    const expired = isExpired(registration.expiresAt);

    return (
      <View key={registration.id} style={styles.registrationItem}>
        <View style={styles.registrationHeader}>
          <View style={styles.registrationInfo}>
            <Text style={styles.partnerName}>{registration.name}</Text>
            <Text style={styles.partnerEmail}>{registration.email}</Text>
            <Text style={styles.registrationDate}>
              Requested: {formatDate(registration.createdAt)}
            </Text>
            <Text
              style={[styles.expirationDate, expired && styles.expiredText]}
            >
              Expires: {formatDate(registration.expiresAt)}
              {expired && " (EXPIRED)"}
            </Text>
          </View>
          {expired && (
            <View style={styles.expiredBadge}>
              <Text style={styles.expiredBadgeText}>EXPIRED</Text>
            </View>
          )}
        </View>

        <View style={styles.registrationActions}>
          <TouchableOpacity
            style={styles.resendButton}
            onPress={() =>
              handleResendEmail(registration.id, registration.email)
            }
            disabled={expired}
          >
            <Ionicons name="mail-outline" size={16} color="#2196F3" />
            <Text style={styles.resendButtonText}>Resend Email</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.rejectButton}
            onPress={() =>
              handleRejectRegistration(registration.id, registration.name)
            }
          >
            <Ionicons name="close-outline" size={16} color="#E53935" />
            <Text style={styles.rejectButtonText}>Reject</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.title}>Pending Partner Registrations</Text>
          <TouchableOpacity
            onPress={handleCleanupExpired}
            style={styles.cleanupButton}
          >
            <Ionicons name="trash-outline" size={20} color="#FF9800" />
          </TouchableOpacity>
        </View>

        {/* Statistici */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.pending}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.confirmed}</Text>
            <Text style={styles.statLabel}>Confirmed</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.expired}</Text>
            <Text style={styles.statLabel}>Expired</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.rejected}</Text>
            <Text style={styles.statLabel}>Rejected</Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#8B4513" />
            <Text style={styles.loadingText}>Loading registrations...</Text>
          </View>
        ) : (
          <ScrollView
            style={styles.content}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          >
            {pendingRegistrations.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="mail-open-outline" size={64} color="#DDD" />
                <Text style={styles.emptyText}>No pending registrations</Text>
                <Text style={styles.emptySubtext}>
                  All registration requests have been processed
                </Text>
              </View>
            ) : (
              pendingRegistrations.map(renderRegistrationItem)
            )}
          </ScrollView>
        )}
      </View>
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
  cleanupButton: {
    padding: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    flex: 1,
    textAlign: "center",
  },
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#F8F9FA",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#8B4513",
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    color: "#666",
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 100,
  },
  emptyText: {
    fontSize: 18,
    color: "#666",
    marginTop: 16,
    fontWeight: "500",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    marginTop: 8,
    textAlign: "center",
  },
  registrationItem: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  registrationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  registrationInfo: {
    flex: 1,
  },
  partnerName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  partnerEmail: {
    fontSize: 14,
    color: "#2196F3",
    marginBottom: 4,
  },
  registrationDate: {
    fontSize: 12,
    color: "#666",
    marginBottom: 2,
  },
  expirationDate: {
    fontSize: 12,
    color: "#666",
  },
  expiredText: {
    color: "#E53935",
    fontWeight: "500",
  },
  expiredBadge: {
    backgroundColor: "#FFEBEE",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E53935",
  },
  expiredBadgeText: {
    fontSize: 10,
    color: "#E53935",
    fontWeight: "600",
  },
  registrationActions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  resendButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E3F2FD",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
    justifyContent: "center",
  },
  resendButtonText: {
    color: "#2196F3",
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 4,
  },
  rejectButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFEBEE",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
    marginLeft: 8,
    justifyContent: "center",
  },
  rejectButtonText: {
    color: "#E53935",
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 4,
  },
});

export default PendingRegistrationsModal;
