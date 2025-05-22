import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  Keyboard,
  ActivityIndicator,
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
      Alert.alert(
        "Error",
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

    let newUserUid = null;

    try {
      // 1. Generate a secure password
      const password = generateSecurePassword();
      console.log(
        `[ManageCafes] Generated secure password for ${request.email}`
      );

      // 2. Create Firebase Auth user account
      let userCredential;
      try {
        userCredential = await createUserWithEmailAndPassword(
          auth,
          request.email,
          password
        );

        newUserUid = userCredential.user.uid;
        console.log(
          `[ManageCafes] Auth user created for partner ${request.email} with UID: ${newUserUid}`
        );
      } catch (authError: any) {
        if (authError.code === "auth/email-already-in-use") {
          Alert.alert(
            "Account Already Exists",
            `An account with email ${request.email} already exists. Please contact the user directly.`
          );
        } else {
          Alert.alert(
            "Authentication Error",
            `Could not create account: ${authError.message}`
          );
        }
        setActionInProgressId(null);
        return;
      }

      // 3. Create cafe document
      try {
        const cafeRef = doc(db, CAFES_COLLECTION, newUserUid);
        await setDoc(cafeRef, {
          businessName: request.businessName,
          contactName: request.contactName,
          email: request.email,
          phone: request.phone || "",
          address: request.address || "",
          status: "active",
          createdAt: request.createdAt,
          updatedAt: serverTimestamp(),
          partnerUid: newUserUid,
          ownerId: newUserUid,
          approvedAt: serverTimestamp(),
        });
        console.log(
          `[ManageCafes] Cafe document created successfully for ${request.businessName}`
        );
      } catch (cafeError) {
        console.error("[ManageCafes] Error creating cafe document:", cafeError);
        Alert.alert(
          "Warning",
          "Account created but cafe details could not be saved. The partner may have limited functionality."
        );
      }

      // 4. Create user profile in 'users' collection
      try {
        const userProfileRef = doc(db, USERS_COLLECTION, newUserUid);
        await setDoc(userProfileRef, {
          uid: newUserUid,
          email: request.email,
          displayName: request.contactName,
          role: "partner",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          preferences: {
            notificationsEnabled: true,
          },
          status: "active",
        });
        console.log(
          `[ManageCafes] User profile created successfully for ${request.email}`
        );
      } catch (profileError) {
        console.error(
          "[ManageCafes] Error creating user profile:",
          profileError
        );
        Alert.alert(
          "Warning",
          "Account created but user profile could not be saved completely. Some functions may be limited."
        );
      }

      // 5. Delete the partnership request
      try {
        await deleteDoc(doc(db, LEGACY_REQUESTS_COLLECTION, request.id));
        console.log(
          `[ManageCafes] Partnership request deleted from cafesPending`
        );
      } catch (deleteError) {
        console.error(
          "[ManageCafes] Error deleting partnership request:",
          deleteError
        );
      }

      // 6. Send password reset email to allow partner to set their own password
      try {
        await sendPasswordResetEmail(auth, request.email);
        console.log(
          `[ManageCafes] Password reset email sent to ${request.email}`
        );
      } catch (emailError) {
        console.error(
          "[ManageCafes] Error sending password reset email:",
          emailError
        );
        Alert.alert(
          "Warning",
          "Partnership approved, but password reset email could not be sent. Please provide the credentials manually."
        );
      }

      // 7. Show success message
      Alert.alert(
        "Partnership Approved",
        `Partnership with ${request.businessName} has been approved!

Login credentials have been created:
Email: ${request.email}
Temporary Password: ${password}

A password reset email has been sent to the partner.`,
        [{ text: "OK" }]
      );

      // 8. Refresh the data
      loadData();
    } catch (error: any) {
      console.error(
        "[ManageCafes] Error approving partnership request:",
        error
      );
      Alert.alert(
        "Error",
        `Failed to approve partnership request: ${error.message}`
      );
    } finally {
      setActionInProgressId(null);
    }
  };

  /**
   * Handle rejecting a partnership request
   */
  const handleRejectRequest = async (request: PartnershipRequest) => {
    setActionInProgressId(request.id);

    Alert.alert(
      "Confirm Rejection",
      `Are you sure you want to reject the partnership request from ${request.businessName}?`,
      [
        {
          text: "Cancel",
          style: "cancel",
          onPress: () => setActionInProgressId(null),
        },
        {
          text: "Reject",
          style: "destructive",
          onPress: async () => {
            try {
              // Simply delete the partnership request from cafesPending
              await deleteDoc(doc(db, LEGACY_REQUESTS_COLLECTION, request.id));
              console.log(
                `[ManageCafes] Rejected and deleted partnership request from ${request.businessName}`
              );

              // Show success message
              Alert.alert(
                "Request Rejected",
                `The partnership request from ${request.businessName} has been rejected.`
              );

              // Refresh the data
              loadData();
            } catch (error: any) {
              console.error(
                "[ManageCafes] Error rejecting partnership request:",
                error
              );
              Alert.alert(
                "Error",
                `Failed to reject partnership request: ${error.message}`
              );
              setActionInProgressId(null);
            }
          },
        },
      ],
      { cancelable: false }
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
  const renderItem = ({ item }: { item: PartnershipRequest }) => {
    const isActionInProgress = actionInProgressId === item.id;

    return (
      <View style={styles.requestCard}>
        <View style={styles.requestInfoContainer}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <Ionicons name="storefront-outline" size={24} color="#FFF" />
          </View>

          {/* Details */}
          <View style={styles.requestDetails}>
            <Text style={styles.businessName}>{item.businessName}</Text>
            <Text style={styles.contactName}>{item.contactName}</Text>
            <Text style={styles.contactInfo}>
              {item.email} {item.phone ? `| ${item.phone}` : ""}
            </Text>

            {item.address && <Text style={styles.address}>{item.address}</Text>}

            {item.message && (
              <Text style={styles.message} numberOfLines={2}>
                "{item.message}"
              </Text>
            )}

            <Text style={styles.dateInfo}>
              Request Date: {item.createdAt.toDate().toLocaleDateString()}
            </Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.approveButton]}
            onPress={() => handleApproveRequest(item)}
            disabled={isActionInProgress}
          >
            {isActionInProgress ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>Approve</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.rejectButton]}
            onPress={() => handleRejectRequest(item)}
            disabled={isActionInProgress}
          >
            {isActionInProgress ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="close-circle" size={16} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>Reject</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <ScreenWrapper>
      <CoffeePartnerHeader title="Manage Partnership Requests" />

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons
          name="search"
          size={20}
          color="#777"
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, email, or address..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
          returnKeyType="search"
          onSubmitEditing={() => Keyboard.dismiss()}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearchQuery("")}
            style={styles.clearButton}
          >
            <Ionicons name="close-circle" size={18} color="#999" />
          </TouchableOpacity>
        )}
      </View>

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
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="cafe-outline" size={60} color="#CCC" />
          <Text style={styles.emptyText}>No partnership requests found</Text>
          <Text style={styles.emptySubText}>
            {searchQuery
              ? "Try a different search term"
              : "All pending partnership requests will appear here"}
          </Text>
        </View>
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    paddingHorizontal: 12,
    margin: 16,
    marginBottom: 8,
    height: 48,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  clearButton: {
    padding: 4,
  },
  listContainer: {
    padding: 16,
    paddingTop: 8,
  },
  requestCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  requestInfoContainer: {
    flexDirection: "row",
    marginBottom: 16,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#8B4513",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  requestDetails: {
    flex: 1,
  },
  businessName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  contactName: {
    fontSize: 16,
    color: "#555",
    marginBottom: 4,
  },
  contactInfo: {
    fontSize: 14,
    color: "#777",
    marginBottom: 4,
  },
  address: {
    fontSize: 14,
    color: "#777",
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    color: "#777",
    fontStyle: "italic",
    marginTop: 4,
    marginBottom: 4,
  },
  dateInfo: {
    fontSize: 12,
    color: "#999",
    marginTop: 4,
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
  },
  approveButton: {
    backgroundColor: "#4CAF50",
  },
  rejectButton: {
    backgroundColor: "#F44336",
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    marginLeft: 6,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#999",
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    marginTop: 8,
    paddingHorizontal: 20,
  },
});
