import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  AppState,
  TouchableOpacity,
  Alert,
  Animated,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
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
  const [cartTotalBeans, setCartTotalBeans] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [canGenerate, setCanGenerate] = useState<boolean>(false);
  const [generatingNew, setGeneratingNew] = useState<boolean>(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const appState = useRef(AppState.currentState);
  const previousTokenRef = useRef<QRToken | null>(null);
  const hasRedirectedRef = useRef<boolean>(false);
  const previousCreditsRef = useRef<number | null>(null);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

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
        const previousToken = previousTokenRef.current;
        previousTokenRef.current = token;

        setCurrentToken(token);
        if (token) {
          setTimeLeft(calculateTimeLeft(token));
          // Reset redirect flag when we get a new token
          hasRedirectedRef.current = false;
        }
        setIsLoading(false);
      }
    );

    // Subscribe to user's subscription
    const unsubscribeSubscription =
      SubscriptionService.subscribeToUserSubscription(user.uid, (sub) => {
        const previousCredits = previousCreditsRef.current;

        // Monitor credits for successful redemption detection (before setting state)
        if (sub && sub.creditsLeft !== null && sub.creditsLeft !== undefined) {
          if (previousCredits !== null && previousCredits > sub.creditsLeft) {
            // Credits decreased - successful redemption happened!
            if (isCheckoutMode && !hasRedirectedRef.current) {
              hasRedirectedRef.current = true;
              console.log(
                "🎉 Credits decreased - successful redemption detected!"
              );

              Toast.show({
                type: "success",
                text1: "Order Complete!",
                text2: "Your order has been successfully processed",
              });

              setTimeout(() => {
                router.push("/(mainUsers)/map");
              }, 1500);
            }
          }
          // Update the reference for next comparison
          previousCreditsRef.current = sub.creditsLeft;
        }

        // Set the subscription state after processing
        setSubscription(sub);
      });

    return () => {
      unsubscribeToken();
      unsubscribeSubscription();
    };
  }, [user?.uid, calculateTimeLeft, isCheckoutMode, router]);

  // Timer for countdown
  useEffect(() => {
    if (currentToken && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        const newTimeLeft = calculateTimeLeft(currentToken);
        setTimeLeft(newTimeLeft);

        // Don't manually set token to null when expired - let Firebase handle it
        // This prevents false redirects due to local timer expiry
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

  // Load cart total beans (only in checkout mode)
  useEffect(() => {
    const loadCartTotal = async () => {
      if (!user?.uid || !isCheckoutMode) return;

      try {
        const cart = await cartService.getUserCart(user.uid);
        const totalBeans = cart?.totalBeans || 0;
        setCartTotalBeans(totalBeans);
        if (totalBeans > 0) {
          console.log(
            `QR Screen: Loaded cart total of ${totalBeans} beans for checkout`
          );
        }
      } catch (error) {
        console.error("Error loading cart total:", error);
      }
    };

    loadCartTotal();
  }, [user?.uid, isCheckoutMode]);

  // Initialize credits tracking when subscription changes
  useEffect(() => {
    if (subscription && subscription.creditsLeft !== null) {
      previousCreditsRef.current = subscription.creditsLeft;
    }
  }, [subscription]);

  // Setup monitoring (separate from subscription dependency)
  useEffect(() => {
    checkCanGenerate();
    const cleanup = setupTokenMonitoring();

    const appStateSubscription = AppState.addEventListener(
      "change",
      (nextAppState) => {
        if (
          appState.current.match(/inactive|background/) &&
          nextAppState === "active"
        ) {
          checkCanGenerate();
        }
        appState.current = nextAppState;
      }
    );

    return () => {
      cleanup?.();
      appStateSubscription.remove();
    };
  }, [checkCanGenerate, setupTokenMonitoring]);

  // Animation effects
  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Pulse animation for active QR
    if (currentToken && timeLeft > 0) {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();
      return () => pulseAnimation.stop();
    }
  }, [currentToken, timeLeft]);

  // Rotation animation for loading
  useEffect(() => {
    if (isLoading || generatingNew) {
      const rotateAnimation = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        })
      );
      rotateAnimation.start();
      return () => rotateAnimation.stop();
    }
  }, [isLoading, generatingNew]);

  // Format time remaining
  const formatTimeLeft = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const { width, height } = Dimensions.get("window");

  // Get rotation interpolation
  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  // Show subscription required message
  if (!canGenerate && !isLoading) {
    return (
      <LinearGradient
        colors={["#F5E6D3", "#E8D5B7", "#D4C4A8"]}
        style={styles.background}
      >
        <ScreenWrapper>
          <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
            <View style={styles.noSubscriptionCard}>
              <View style={styles.coffeeIconContainer}>
                <Ionicons name="cafe-outline" size={80} color="#8B4513" />
                <View style={styles.coffeeBeansDecor}>
                  <Ionicons name="ellipse" size={12} color="#8B4513" />
                  <Ionicons name="ellipse" size={8} color="#A0522D" />
                  <Ionicons name="ellipse" size={10} color="#8B4513" />
                </View>
              </View>
              <Text style={styles.noSubTitle}>Coffee Break Needed!</Text>
              <Text style={styles.noSubText}>
                {error ||
                  "You need an active subscription with available beans to brew your digital coffee code."}
              </Text>
              <TouchableOpacity
                style={styles.brewButton}
                onPress={() => router.push("/(mainUsers)/subscriptions")}
              >
                <Ionicons name="leaf-outline" size={20} color="#FFFFFF" />
                <Text style={styles.brewButtonText}>Get Brewing Plan</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
          <BottomTabBar />
        </ScreenWrapper>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={["#F5E6D3", "#E8D5B7", "#D4C4A8"]}
      style={styles.background}
    >
      <ScreenWrapper>
        <Animated.View
          style={[
            styles.container,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Header */}
          <Text style={styles.title}>
            {isCheckoutMode ? "Checkout QR Code" : "Your Coffee Code"}
          </Text>
          <Text style={styles.subtitle}>
            {isCheckoutMode
              ? `Show this code at ${checkoutCafeName}`
              : "Show this code to the barista"}
          </Text>

          {/* Info Section */}
          {isCheckoutMode ? (
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Ionicons name="storefront" size={20} color="#8B4513" />
                <Text style={styles.infoLabel}>Café:</Text>
                <Text style={styles.infoValue}>{checkoutCafeName}</Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="cafe" size={20} color="#8B4513" />
                <Text style={styles.infoLabel}>Beans:</Text>
                <Text style={styles.infoValue}>{checkoutTotalBeans}</Text>
              </View>
              {subscription && (
                <View style={styles.infoRow}>
                  <Ionicons name="wallet" size={20} color="#8B4513" />
                  <Text style={styles.infoLabel}>Remaining:</Text>
                  <Text style={styles.infoValue}>
                    {subscription.creditsLeft - checkoutTotalBeans}
                  </Text>
                </View>
              )}
            </View>
          ) : (
            subscription && (
              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <Ionicons name="card" size={20} color="#8B4513" />
                  <Text style={styles.infoLabel}>Plan:</Text>
                  <Text style={styles.infoValue}>
                    {subscription.subscriptionName}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="cafe" size={20} color="#8B4513" />
                  <Text style={styles.infoLabel}>Beans:</Text>
                  <Text style={styles.infoValue}>
                    {subscription.creditsLeft}
                  </Text>
                </View>
              </View>
            )
          )}

          {/* QR Code Section */}
          <View style={styles.qrSection}>
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <Animated.View style={{ transform: [{ rotate: spin }] }}>
                  <Ionicons name="cafe-outline" size={60} color="#8B4513" />
                </Animated.View>
                <Text style={styles.loadingText}>Generating your code...</Text>
              </View>
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
              <View style={styles.qrContainer}>
                <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                  <QRCode
                    value={currentToken.token}
                    size={200}
                    backgroundColor="white"
                    color="#2C1810"
                  />
                </Animated.View>

                <View style={styles.timerContainer}>
                  <Ionicons name="time-outline" size={16} color="#8B4513" />
                  <Text style={styles.timerText}>
                    Expires in: {formatTimeLeft(timeLeft)}
                  </Text>
                </View>

                <View style={styles.buttonContainer}>
                  <TouchableOpacity
                    style={styles.refreshButton}
                    onPress={generateNewToken}
                    disabled={generatingNew}
                  >
                    <Ionicons
                      name="refresh-outline"
                      size={20}
                      color="#FFFFFF"
                    />
                    <Text style={styles.refreshButtonText}>Generate New</Text>
                  </TouchableOpacity>

                  {isCheckoutMode && (
                    <TouchableOpacity
                      style={styles.backButton}
                      onPress={() => router.push("/(mainUsers)/map")}
                    >
                      <Ionicons
                        name="arrow-back-outline"
                        size={20}
                        color="#8B4513"
                      />
                      <Text style={styles.backButtonText}>Back to Map</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ) : (
              <View style={styles.generateContainer}>
                <Ionicons name="qr-code-outline" size={60} color="#8B4513" />
                <Text style={styles.generateText}>
                  Ready to generate your QR code
                </Text>
                <TouchableOpacity
                  style={styles.generateButton}
                  onPress={generateNewToken}
                  disabled={generatingNew}
                >
                  {generatingNew ? (
                    <Animated.View style={{ transform: [{ rotate: spin }] }}>
                      <Ionicons name="cafe-outline" size={20} color="#FFFFFF" />
                    </Animated.View>
                  ) : (
                    <>
                      <Ionicons
                        name="add-circle-outline"
                        size={20}
                        color="#FFFFFF"
                      />
                      <Text style={styles.generateButtonText}>
                        Generate QR Code
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </Animated.View>
        <BottomTabBar />
      </ScreenWrapper>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 20,
  },

  // Header Styles
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#2C1810",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#6B4E3D",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },

  // No Subscription Styles
  noSubscriptionCard: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 20,
    padding: 24,
    margin: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  coffeeIconContainer: {
    marginBottom: 20,
  },
  coffeeBeansDecor: {
    position: "absolute",
    top: -8,
    right: -12,
    flexDirection: "row",
    gap: 3,
  },
  noSubTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#2C1810",
    marginBottom: 12,
    textAlign: "center",
  },
  noSubText: {
    fontSize: 16,
    color: "#6B4E3D",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 20,
  },
  brewButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#8B4513",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  brewButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },

  // Info Card Styles
  infoCard: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    gap: 12,
  },
  infoLabel: {
    fontSize: 16,
    color: "#6B4E3D",
    fontWeight: "600",
    flex: 1,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2C1810",
  },

  // QR Section Styles
  qrSection: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  // QR Container
  qrContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    gap: 20,
  },

  // Timer Styles
  timerContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(139, 69, 19, 0.1)",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  timerText: {
    fontSize: 14,
    color: "#8B4513",
    fontWeight: "600",
  },

  // Button Styles
  refreshButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#8B4513",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  refreshButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },

  // Loading Styles
  loadingContainer: {
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: "#8B4513",
    fontWeight: "600",
  },

  // Error Styles
  errorContainer: {
    alignItems: "center",
    gap: 16,
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#FF6B6B",
    textAlign: "center",
    fontWeight: "600",
  },

  // Generate Styles
  generateContainer: {
    alignItems: "center",
    gap: 20,
    padding: 20,
  },
  generateText: {
    fontSize: 18,
    color: "#6B4E3D",
    textAlign: "center",
    fontWeight: "600",
  },
  generateButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#8B4513",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  generateButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },

  // Button Container
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "center",
    alignItems: "center",
  },

  // Back Button Styles
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "#8B4513",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  backButtonText: {
    color: "#8B4513",
    fontSize: 14,
    fontWeight: "bold",
  },
});
