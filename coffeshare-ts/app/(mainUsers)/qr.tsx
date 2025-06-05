import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  AppState,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useLanguage } from "../../context/LanguageContext";
import ScreenWrapper from "../../components/ScreenWrapper";
import BottomTabBar from "../../components/BottomTabBar";
import QRCode from "react-native-qrcode-svg";
import { useFirebase } from "../../context/FirebaseContext";
import { QRService, QRToken } from "../../services/qrService";
import {
  SubscriptionService,
  UserSubscription,
} from "../../services/subscriptionService";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import cartService from "../../services/cartService";
import Toast from "react-native-toast-message";

export default function QRScreen() {
  const { t } = useLanguage();
  const { user } = useFirebase();
  const router = useRouter();
  const params = useLocalSearchParams();
  const [currentToken, setCurrentToken] = useState<QRToken | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<UserSubscription | null>(
    null
  );
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [canGenerate, setCanGenerate] = useState<boolean>(false);
  const [generatingNew, setGeneratingNew] = useState<boolean>(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const appState = useRef(AppState.currentState);

  // Check if we're in checkout mode
  const isCheckoutMode = params.checkoutMode === "true";
  const checkoutCafeId = params.cafeId as string;
  const checkoutCafeName = params.cafeName as string;
  const checkoutTotalBeans = params.totalBeans
    ? parseInt(params.totalBeans as string)
    : 0;

  // Calculate time left for current token
  const calculateTimeLeft = useCallback((token: QRToken | null) => {
    if (!token) return 0;

    const expiresAt = token.expiresAt.toDate();
    const now = new Date();
    const timeLeftMs = expiresAt.getTime() - now.getTime();

    return Math.max(0, Math.floor(timeLeftMs / 1000));
  }, []);

  // Check if user can generate QR code
  const checkCanGenerate = useCallback(async () => {
    if (!user?.uid) {
      setCanGenerate(false);
      return;
    }

    try {
      const result = await QRService.canUserGenerateQRToken(user.uid);
      setCanGenerate(result.canGenerate);

      if (!result.canGenerate) {
        setError(result.reason || "Cannot generate QR code");
      } else {
        setError(null);
      }
    } catch (error) {
      console.error("Error checking QR generation capability:", error);
      setCanGenerate(false);
      setError("Error checking subscription status");
    }
  }, [user?.uid]);

  // Generate new QR token
  const generateNewToken = useCallback(async () => {
    if (!user?.uid) return;

    if (isCheckoutMode) {
      if (!checkoutCafeId) {
        setError("Invalid checkout data");
        return;
      }
    } else if (!canGenerate) {
      return;
    }

    setGeneratingNew(true);
    setError(null);

    try {
      let newToken: QRToken | null = null;

      if (isCheckoutMode) {
        // Generate checkout token
        newToken = await QRService.generateCheckoutQRToken(
          user.uid,
          checkoutCafeId
        );
      } else {
        // Generate regular token
        newToken = await QRService.generateQRToken(user.uid);
      }

      if (newToken) {
        setCurrentToken(newToken);
        setTimeLeft(calculateTimeLeft(newToken));
      } else {
        setError("Failed to generate QR code");
      }
    } catch (error: any) {
      console.error("Error generating QR token:", error);
      setError(error.message || "Failed to generate QR code");
    } finally {
      setGeneratingNew(false);
    }
  }, [
    user?.uid,
    canGenerate,
    calculateTimeLeft,
    isCheckoutMode,
    checkoutCafeId,
  ]);

  // Setup QR token monitoring
  const setupTokenMonitoring = useCallback(() => {
    if (!user?.uid) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // Subscribe to user's QR tokens
    const unsubscribeToken = QRService.subscribeToUserQRToken(
      user.uid,
      (token) => {
        setCurrentToken(token);
        if (token) {
          setTimeLeft(calculateTimeLeft(token));
        }
        setIsLoading(false);
      }
    );

    // Subscribe to user's subscription
    const unsubscribeSubscription =
      SubscriptionService.subscribeToUserSubscription(user.uid, (sub) => {
        setSubscription(sub);
      });

    return () => {
      unsubscribeToken();
      unsubscribeSubscription();
    };
  }, [user?.uid, calculateTimeLeft]);

  // Timer for countdown
  useEffect(() => {
    if (currentToken && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        const newTimeLeft = calculateTimeLeft(currentToken);
        setTimeLeft(newTimeLeft);

        if (newTimeLeft <= 0) {
          setCurrentToken(null);
        }
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [currentToken, timeLeft, calculateTimeLeft]);

  // Check permissions and setup monitoring
  useEffect(() => {
    checkCanGenerate();
    const cleanup = setupTokenMonitoring();

    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        console.log("App has come to the foreground!");
        checkCanGenerate();
      }
      appState.current = nextAppState;
    });

    return () => {
      cleanup?.();
      subscription.remove();
    };
  }, [checkCanGenerate, setupTokenMonitoring]);

  // Format time remaining
  const formatTimeLeft = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  // Show subscription required message
  if (!canGenerate && !isLoading) {
    return (
      <ScreenWrapper>
        <View style={styles.container}>
          <View style={styles.content}>
            <Ionicons name="cafe-outline" size={80} color="#8B4513" />
            <Text style={styles.title}>QR Code Not Available</Text>
            <Text style={styles.subtitle}>
              {error ||
                "You need an active subscription with available beans to generate a QR code."}
            </Text>
            <TouchableOpacity
              style={styles.subscribeButton}
              onPress={() => {
                // Navigate to subscriptions
                // router.push('/(mainUsers)/subscriptions');
              }}
            >
              <Text style={styles.subscribeButtonText}>View Subscriptions</Text>
            </TouchableOpacity>
          </View>
        </View>
        <BottomTabBar />
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>
            {isCheckoutMode ? "Checkout QR Code" : t("scanQRCode")}
          </Text>
          <Text style={styles.subtitle}>
            {isCheckoutMode
              ? `Show this QR code at ${checkoutCafeName} to complete your order`
              : "Show this QR code to the barista to redeem your coffee"}
          </Text>

          {/* Info Section */}
          {isCheckoutMode ? (
            <View style={styles.checkoutInfo}>
              <View style={styles.checkoutRow}>
                <Ionicons name="storefront" size={20} color="#8B4513" />
                <Text style={styles.checkoutText}>{checkoutCafeName}</Text>
              </View>
              <View style={styles.checkoutRow}>
                <Ionicons name="cafe" size={20} color="#8B4513" />
                <Text style={styles.checkoutText}>
                  {checkoutTotalBeans} beans total
                </Text>
              </View>
              {subscription && (
                <View style={styles.checkoutRow}>
                  <Ionicons name="wallet" size={20} color="#8B4513" />
                  <Text style={styles.checkoutText}>
                    {subscription.creditsLeft - checkoutTotalBeans} beans will
                    remain
                  </Text>
                </View>
              )}
            </View>
          ) : (
            subscription && (
              <View style={styles.subscriptionInfo}>
                <Text style={styles.subscriptionText}>
                  {subscription.subscriptionName}
                </Text>
                <Text style={styles.beansText}>
                  {subscription.creditsLeft} beans remaining
                </Text>
              </View>
            )
          )}

          <View style={styles.qrContainer}>
            {isLoading ? (
              <ActivityIndicator size="large" color="#8B4513" />
            ) : error ? (
              <View style={styles.errorContainer}>
                <Ionicons
                  name="alert-circle-outline"
                  size={48}
                  color="#FF6B6B"
                />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : currentToken && timeLeft > 0 ? (
              <>
                <QRCode
                  value={currentToken.token}
                  size={250}
                  backgroundColor="white"
                  color="black"
                />
                <View style={styles.timerContainer}>
                  <Text style={styles.timerText}>
                    Expires in: {formatTimeLeft(timeLeft)}
                  </Text>
                </View>
              </>
            ) : (
              <View style={styles.generateContainer}>
                <Ionicons name="qr-code-outline" size={48} color="#8B4513" />
                <Text style={styles.generateText}>
                  Tap to generate your QR code
                </Text>
                <TouchableOpacity
                  style={styles.generateButton}
                  onPress={generateNewToken}
                  disabled={generatingNew}
                >
                  {generatingNew ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.generateButtonText}>
                      Generate QR Code
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Refresh Button */}
          {currentToken && timeLeft > 0 && (
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={generateNewToken}
              disabled={generatingNew}
            >
              <Ionicons
                name="refresh-outline"
                size={20}
                color="#8B4513"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.refreshButtonText}>Generate New Code</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
      <BottomTabBar />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  content: {
    flex: 1,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#4A4A4A",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#666666",
    textAlign: "center",
    marginBottom: 30,
  },
  qrContainer: {
    width: 280,
    height: 280,
    padding: 15,
    backgroundColor: "white",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    elevation: 4,
    marginBottom: 20,
  },
  otpText: {
    marginTop: 15,
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    letterSpacing: 3,
  },
  errorText: {
    fontSize: 16,
    color: "red",
    textAlign: "center",
    paddingHorizontal: 10,
  },
  subscriptionInfo: {
    marginBottom: 20,
    alignItems: "center",
  },
  subscriptionText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4A4A4A",
  },
  beansText: {
    fontSize: 16,
    color: "#666666",
  },
  timerContainer: {
    marginTop: 10,
    padding: 10,
    backgroundColor: "white",
    borderRadius: 5,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    elevation: 4,
  },
  timerText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4A4A4A",
  },
  generateContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  generateText: {
    fontSize: 16,
    color: "#4A4A4A",
    marginRight: 10,
  },
  generateButton: {
    padding: 10,
    backgroundColor: "#8B4513",
    borderRadius: 5,
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  refreshButton: {
    marginTop: 10,
    padding: 10,
    backgroundColor: "#8B4513",
    borderRadius: 5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  refreshButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginLeft: 10,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  subscribeButton: {
    padding: 10,
    backgroundColor: "#8B4513",
    borderRadius: 5,
  },
  subscribeButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  checkoutInfo: {
    backgroundColor: "#FFF8F3",
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    width: "100%",
  },
  checkoutRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  checkoutText: {
    fontSize: 16,
    color: "#4A4A4A",
    marginLeft: 10,
    flex: 1,
  },
});
