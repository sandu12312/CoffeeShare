import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Keyboard,
  ActivityIndicator,
  ImageBackground,
} from "react-native";
import { useLanguage } from "../../context/LanguageContext";
import ScreenWrapper from "../../components/ScreenWrapper";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import CoffeePartnerHeader from "../../components/CoffeePartnerHeader";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  writeBatch,
  serverTimestamp,
  Timestamp,
  limit,
  updateDoc,
} from "firebase/firestore";
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { db, auth } from "../../config/firebase";
import * as Animatable from "react-native-animatable";
import { LinearGradient } from "expo-linear-gradient";
import { ErrorModal, Toast, Snackbar } from "../../components/ErrorComponents";
import { useErrorHandler } from "../../hooks/useErrorHandler";

// Type definition for partnership requests
interface PartnershipRequest {
  id: string;
  businessName: string;
  contactName: string;
  email: string;
  phone?: string;
  address?: string;
  message?: string;
  status: "pending" | "approved" | "rejected";
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

// Constants for collection names
const PARTNERSHIP_REQUESTS_COLLECTION = "partnership_requests";
const LEGACY_REQUESTS_COLLECTION = "cafesPending";
const CAFES_COLLECTION = "cafes";
const USERS_COLLECTION = "users";

// Cafe Partner Management Screen
export default function ManageCafesScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const {
    errorState,
    showError,
    showSuccess,
    showConfirmModal,
    showErrorModal,
    hideToast,
    hideModal,
    hideSnackbar,
    showUndoSnackbar,
  } = useErrorHandler();
  const [requests, setRequests] = useState<PartnershipRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionInProgressId, setActionInProgressId] = useState<string | null>(
    null
  );

  // #1: ABSTRACTED FUNCTIONS FOR CAFE MANAGEMENT

  /**
   * Generate a secure random password with mixed characters
   */
  const generateSecurePassword = (): string => {
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const numbers = "0123456789";
    const symbols = "!@#$%^&*()_+~`|}{[]:;?><,./-=";

    // Create an array of character sets to ensure at least one from each
    const charSets = [lowercase, uppercase, numbers, symbols];

    // Initialize password with one char from each set
    let password = "";
    charSets.forEach((set) => {
      password += set.charAt(Math.floor(Math.random() * set.length));
    });

    // Fill remainder with random chars from all sets
    const allChars = charSets.join("");
    while (password.length < 16) {
      password += allChars.charAt(Math.floor(Math.random() * allChars.length));
    }

    // Shuffle the password to avoid predictable pattern
    return password
      .split("")
      .sort(() => 0.5 - Math.random())
      .join("");
  };

  /**
   * Create a user profile in Firestore for the new partner
   */
  const createUserProfile = async (
    uid: string,
    email: string,
    displayName: string
  ): Promise<boolean> => {
    try {
      console.log(`[ManageCafes] Creating user profile for ${email}`);

      const userRef = doc(db, USERS_COLLECTION, uid);
      await setDoc(userRef, {
        uid: uid,
        email: email,
        displayName: displayName,
        role: "partner",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        preferences: {
          notificationsEnabled: true,
        },
        status: "active",
      });

      console.log(
        `[ManageCafes] Successfully created user profile for ${email}`
      );
      return true;
    } catch (error) {
      console.error(
        `[ManageCafes] Failed to create user profile for ${email}:`,
        error
      );
      return false;
    }
  };

  /**
   * Create a cafe document in Firestore
   */
  const createCafeDocument = async (
    uid: string,
    cafeData: PartnershipRequest
  ): Promise<boolean> => {
    try {
      console.log(
        `[ManageCafes] Creating cafe document for ${cafeData.businessName}`
      );

      const cafeRef = doc(db, CAFES_COLLECTION, uid);
      await setDoc(cafeRef, {
        businessName: cafeData.businessName,
        contactName: cafeData.contactName,
        email: cafeData.email,
        phone: cafeData.phone || "",
        address: cafeData.address || "",
        status: "active",
        createdAt: cafeData.createdAt,
        updatedAt: serverTimestamp(),
        partnerUid: uid,
        ownerId: uid,
        approvedAt: serverTimestamp(),
        approvedBy: auth.currentUser?.uid || "unknown",
      });

      console.log(
        `[ManageCafes] Successfully created cafe document for ${cafeData.businessName}`
      );
      return true;
    } catch (error) {
      console.error(`[ManageCafes] Failed to create cafe document:`, error);
      return false;
    }
  };

  /**
   * Delete a partnership request from Firestore
   */
  const deletePartnershipRequest = async (
    requestId: string
  ): Promise<boolean> => {
    try {
      console.log(`[ManageCafes] Deleting partnership request ${requestId}`);

      await deleteDoc(doc(db, LEGACY_REQUESTS_COLLECTION, requestId));

      console.log(
        `[ManageCafes] Successfully deleted partnership request ${requestId}`
      );
      return true;
    } catch (error) {
      console.error(
        `[ManageCafes] Failed to delete partnership request:`,
        error
      );
      return false;
    }
  };

  /**
   * Send credentials email to new partner
   * In a real app, this would trigger a Cloud Function
   */
  const sendCredentialsEmail = async (
    email: string,
    password: string,
    businessName: string
  ): Promise<boolean> => {
    try {
      console.log(`[ManageCafes] Sending credentials email to ${email}`);

      // In a production app, you would call a Cloud Function here
      // For now, we'll use sendPasswordResetEmail as a workaround
      await sendPasswordResetEmail(auth, email);

      console.log(
        `[ManageCafes] Successfully sent password reset email to ${email}`
      );
      return true;
    } catch (error) {
      console.error(`[ManageCafes] Failed to send credentials email:`, error);
      return false;
    }
  };

  // #2: DATA LOADING & MANAGEMENT

  /**
   * Load partnership requests from cafesPending collection
   */
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      console.log(
        "[ManageCafes] Fetching partnership requests from cafesPending..."
      );

      // Get pending partnerships from cafesPending collection
      const requestsQuery = query(
        collection(db, LEGACY_REQUESTS_COLLECTION),
        where("status", "==", "pending"),
        orderBy("createdAt", "desc")
      );

      const snapshot = await getDocs(requestsQuery);
      console.log(
        `[ManageCafes] Fetched ${snapshot.size} partnership requests from cafesPending`
      );

      const requestsList: PartnershipRequest[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        requestsList.push({
          id: doc.id,
          businessName: data.businessName || "Unknown Business",
          contactName: data.contactName || "Unknown Contact",
          email: data.email || "",
          phone: data.phone || "",
          address: data.address || "",
          message: data.message || "",
          status: data.status || "pending",
          createdAt: data.createdAt || Timestamp.now(),
          updatedAt: data.updatedAt || Timestamp.now(),
        });
      });

      setRequests(requestsList);
    } catch (error: any) {
      console.error("[ManageCafes] Error loading partnership requests:", error);
      showError(
        "An error occurred while loading partnership requests. Please try again later."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  // #3: HANDLE APPROVE/REJECT ACTIONS

  /**
   * Handle approving a partnership request
   */
  const handleApproveRequest = async (request: PartnershipRequest) => {
    setActionInProgressId(request.id);

    showConfirmModal(
      "Approve Partnership",
      `Are you sure you want to approve the partnership request from ${request.businessName}?`,
      async () => {
        try {
          // Simply update the request status to approved
          const requestRef = doc(db, LEGACY_REQUESTS_COLLECTION, request.id);
          await updateDoc(requestRef, {
            status: "approved",
            updatedAt: serverTimestamp(),
            approvedAt: serverTimestamp(),
          });

          console.log(
            `[ManageCafes] Partnership request approved for ${request.businessName}`
          );

          showSuccess(
            `The partnership request from ${request.businessName} has been approved.`
          );

          // Refresh the data
          loadData();
        } catch (error: any) {
          console.error(
            "[ManageCafes] Error approving partnership request:",
            error
          );
          showError(`Failed to approve partnership request: ${error.message}`);
        } finally {
          setActionInProgressId(null);
        }
      },
      () => setActionInProgressId(null)
    );
  };

  /**
   * Handle rejecting a partnership request
   */
  const handleRejectRequest = async (request: PartnershipRequest) => {
    setActionInProgressId(request.id);

    showConfirmModal(
      "Confirm Rejection",
      `Are you sure you want to reject the partnership request from ${request.businessName}?`,
      async () => {
        try {
          // Simply delete the partnership request from cafesPending
          await deleteDoc(doc(db, LEGACY_REQUESTS_COLLECTION, request.id));
          console.log(
            `[ManageCafes] Rejected and deleted partnership request from ${request.businessName}`
          );

          // Show success message with undo option
          showUndoSnackbar(
            `Partnership request from ${request.businessName} has been rejected.`,
            () => {
              // TODO: Implement undo functionality if needed
              console.log("Undo rejection requested");
            }
          );

          // Refresh the data
          loadData();
        } catch (error: any) {
          console.error(
            "[ManageCafes] Error rejecting partnership request:",
            error
          );
          showError(`Failed to reject partnership request: ${error.message}`);
          setActionInProgressId(null);
        }
      },
      () => setActionInProgressId(null)
    );
  };

  // #4: UI RENDERING

  // Filter requests based on search query
  const filteredRequests = searchQuery
    ? requests.filter(
        (request) =>
          request.businessName
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          request.contactName
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          (request.address &&
            request.address
              .toLowerCase()
              .includes(searchQuery.toLowerCase())) ||
          request.email.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : requests;

  // Render each partnership request item
  const renderItem = ({
    item,
    index,
  }: {
    item: PartnershipRequest;
    index: number;
  }) => {
    const isActionInProgress = actionInProgressId === item.id;

    return (
      <Animatable.View
        animation="fadeInUp"
        delay={index * 100}
        style={styles.requestCard}
      >
        <LinearGradient
          colors={["#FFFFFF", "#FFF8F3"]}
          style={styles.requestGradient}
        >
          <View style={styles.requestInfoContainer}>
            {/* Icon */}
            <LinearGradient
              colors={["#8B4513", "#A0522D"]}
              style={styles.iconContainer}
            >
              <Ionicons name="storefront-outline" size={26} color="#F5E6D3" />
            </LinearGradient>

            {/* Details */}
            <View style={styles.requestDetails}>
              <Text style={styles.businessName}>{item.businessName}</Text>
              <View style={styles.contactRow}>
                <Ionicons name="person-outline" size={14} color="#666" />
                <Text style={styles.contactName}>{item.contactName}</Text>
              </View>
              <View style={styles.contactRow}>
                <Ionicons name="mail-outline" size={14} color="#666" />
                <Text style={styles.contactInfo}>{item.email}</Text>
              </View>
              {item.phone && (
                <View style={styles.contactRow}>
                  <Ionicons name="call-outline" size={14} color="#666" />
                  <Text style={styles.contactInfo}>{item.phone}</Text>
                </View>
              )}

              {item.address && (
                <View style={styles.addressContainer}>
                  <Ionicons name="location-outline" size={14} color="#666" />
                  <Text style={styles.address}>{item.address}</Text>
                </View>
              )}

              {item.message && (
                <View style={styles.messageContainer}>
                  <Text style={styles.message} numberOfLines={2}>
                    "{item.message}"
                  </Text>
                </View>
              )}

              <View style={styles.dateContainer}>
                <Ionicons name="time-outline" size={14} color="#999" />
                <Text style={styles.dateInfo}>
                  {item.createdAt.toDate().toLocaleDateString()}
                </Text>
              </View>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleApproveRequest(item)}
              disabled={isActionInProgress}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={
                  isActionInProgress
                    ? ["#A5D6A7", "#C8E6C9"]
                    : ["#4CAF50", "#66BB6A"]
                }
                style={styles.actionButtonGradient}
              >
                {isActionInProgress ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons
                      name="checkmark-circle"
                      size={18}
                      color="#FFFFFF"
                    />
                    <Text style={styles.actionButtonText}>Approve</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleRejectRequest(item)}
              disabled={isActionInProgress}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={
                  isActionInProgress
                    ? ["#EF9A9A", "#FFCDD2"]
                    : ["#F44336", "#EF5350"]
                }
                style={styles.actionButtonGradient}
              >
                {isActionInProgress ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="close-circle" size={18} color="#FFFFFF" />
                    <Text style={styles.actionButtonText}>Reject</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </Animatable.View>
    );
  };

  return (
    <ScreenWrapper>
      <ImageBackground
        source={require("../../assets/images/BackGroundCoffeePartners app.jpg")}
        style={styles.container}
        resizeMode="cover"
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Manage Partnership Requests</Text>
        </View>

        {/* Search Bar */}
        <Animatable.View
          animation="fadeInDown"
          duration={600}
          style={styles.searchContainer}
        >
          <LinearGradient
            colors={["#FFFFFF", "#FFF8F3"]}
            style={styles.searchGradient}
          >
            <Ionicons
              name="search"
              size={20}
              color="#8B4513"
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name, email, or address..."
              placeholderTextColor="#A0522D"
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
              onSubmitEditing={() => Keyboard.dismiss()}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery("")}
                style={styles.clearButton}
              >
                <Ionicons name="close-circle" size={18} color="#8B4513" />
              </TouchableOpacity>
            )}
          </LinearGradient>
        </Animatable.View>

        {/* List of Requests */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#8B4513" />
            <Text style={styles.loadingText}>
              Loading partnership requests...
            </Text>
          </View>
        ) : filteredRequests.length > 0 ? (
          <FlatList
            data={filteredRequests}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            extraData={actionInProgressId}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="cafe-outline" size={80} color="#D7CCC8" />
            <Text style={styles.emptyText}>No partnership requests found</Text>
            <Text style={styles.emptySubText}>
              {searchQuery
                ? "Try a different search term"
                : "All pending partnership requests will appear here"}
            </Text>
          </View>
        )}
      </ImageBackground>

      {/* Error Components */}
      <Toast
        visible={errorState.toast.visible}
        message={errorState.toast.message}
        type={errorState.toast.type}
        onHide={hideToast}
        action={errorState.toast.action}
      />

      <ErrorModal
        visible={errorState.modal.visible}
        title={errorState.modal.title}
        message={errorState.modal.message}
        type={errorState.modal.type}
        onDismiss={hideModal}
        primaryAction={errorState.modal.primaryAction}
        secondaryAction={errorState.modal.secondaryAction}
      />

      <Snackbar
        visible={errorState.snackbar.visible}
        message={errorState.snackbar.message}
        action={errorState.snackbar.action}
        onDismiss={hideSnackbar}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: "transparent",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#3C2415",
    textAlign: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#F5E6D3",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#8B4513",
    fontWeight: "500",
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  searchGradient: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#3C2415",
  },
  clearButton: {
    padding: 4,
  },
  listContainer: {
    padding: 16,
    paddingTop: 8,
  },
  requestCard: {
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 4,
    overflow: "hidden",
  },
  requestGradient: {
    padding: 16,
  },
  requestInfoContainer: {
    flexDirection: "row",
    marginBottom: 16,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  requestDetails: {
    flex: 1,
  },
  businessName: {
    fontSize: 19,
    fontWeight: "bold",
    color: "#3C2415",
    marginBottom: 6,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    gap: 6,
  },
  contactName: {
    fontSize: 15,
    color: "#555",
    fontWeight: "500",
  },
  contactInfo: {
    fontSize: 14,
    color: "#666",
  },
  addressContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 4,
    marginBottom: 4,
    gap: 6,
  },
  address: {
    fontSize: 14,
    color: "#777",
    flex: 1,
  },
  messageContainer: {
    backgroundColor: "#FFF8F3",
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 6,
  },
  message: {
    fontSize: 14,
    color: "#666",
    fontStyle: "italic",
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    gap: 6,
  },
  dateInfo: {
    fontSize: 12,
    color: "#999",
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    borderRadius: 10,
    overflow: "hidden",
  },
  actionButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    gap: 6,
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 15,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#F5E6D3",
  },
  emptyText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#8B4513",
    marginTop: 20,
  },
  emptySubText: {
    fontSize: 14,
    color: "#A0522D",
    textAlign: "center",
    marginTop: 8,
    paddingHorizontal: 40,
  },
});
