import React, { useState, useRef, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Animated,
  Modal,
  Dimensions,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import BottomTabBar from "../../components/BottomTabBar";
import ScreenWrapper from "../../components/ScreenWrapper";
import SubscriptionBox from "../../components/SubscriptionBox";
import { useLanguage } from "../../context/LanguageContext";
import { auth } from "../../config/firebase";
import {
  SubscriptionService,
  SubscriptionPlan,
  UserSubscription,
} from "../../services/subscriptionService";
import Toast from "react-native-toast-message";
import { Toast as ErrorToast } from "../../components/ErrorComponents";
import { useErrorHandler } from "../../hooks/useErrorHandler";
import PaymentModalSimple from "../../components/PaymentModalSimple";
import { useFirebase } from "../../context/FirebaseContext";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");
const { height: screenHeight } = Dimensions.get("screen");

export default function SubscriptionsScreen() {
  const { t } = useLanguage();
  const { errorState, showError, hideToast } = useErrorHandler();
  const { user } = useFirebase();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [howItWorksVisible, setHowItWorksVisible] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentSubscription, setCurrentSubscription] =
    useState<UserSubscription | null>(null);
  const [subscriptionPlans, setSubscriptionPlans] = useState<
    SubscriptionPlan[]
  >([]);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [selectedPlanForPayment, setSelectedPlanForPayment] = useState<{
    planId: string;
    planName: string;
    price: number;
    currency: string;
    userId: string;
  } | null>(null);
  const [selectedPlan, setSelectedPlan] = useState(-1);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Animation values for card scaling
  const animatedScales = useRef<Animated.Value[]>([]).current;

  // Initialize animation values when plans are loaded
  useEffect(() => {
    if (subscriptionPlans.length > 0 && animatedScales.length === 0) {
      subscriptionPlans.forEach((_, index) => {
        animatedScales[index] = new Animated.Value(index === 0 ? 1.0 : 0.9);
      });
    }
  }, [subscriptionPlans]);

  // Get current user and subscription data on mount
  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      setCurrentUser(user);

      // Subscribe to user's active subscription
      const unsubscribeUser = SubscriptionService.subscribeToUserSubscription(
        user.uid,
        (subscription) => {
          setCurrentSubscription(subscription);
        }
      );

      // Subscribe to active plans
      const unsubscribePlans = SubscriptionService.subscribeToActivePlans(
        (plans) => {
          setSubscriptionPlans(plans);
          setLoadingPlans(false);

          // Find the popular plan index
          const popularIndex = plans.findIndex((plan) => plan.popular);
          if (popularIndex !== -1) {
            setActiveIndex(popularIndex);
          }
        }
      );

      return () => {
        unsubscribeUser();
        unsubscribePlans();
      };
    } else {
      setLoadingPlans(false);
    }
  }, []);

  // Select a plan and animate the cards
  const selectPlan = (index: number) => {
    // Reset all cards to smaller scale
    animatedScales.forEach((scale, i) => {
      Animated.spring(scale, {
        toValue: i === index ? 1.0 : 0.9,
        friction: 7,
        tension: 40,
        useNativeDriver: true,
      }).start();
    });

    setActiveIndex(index);
    setSelectedPlan(index);

    // Set the selected plan for payment
    const plan = subscriptionPlans[index];
    if (plan && currentUser) {
      setSelectedPlanForPayment({
        planId: plan.id || "",
        planName: plan.name,
        price: plan.price,
        currency: "RON", // Default to RON since it's the app's default currency
        userId: currentUser.uid,
      });
      setShowPaymentModal(true);
    }
  };

  // Subscribe to a plan - now opens payment modal
  const subscribeToPlan = async () => {
    if (selectedPlan === -1) {
      Alert.alert(t("common.error"), "Please select a plan");
      return;
    }

    setProcessing(true);

    try {
      // Simulez procesarea plății
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Afișez modal-ul pentru succes
      setShowPaymentModal(true);
      setProcessing(false);
    } catch (error) {
      console.error("Error processing subscription:", error);
      Alert.alert(t("common.error"), t("subscriptions.subscriptionError"));
      setProcessing(false);
    }
  };

  // Handle successful payment
  const handlePaymentSuccess = async () => {
    setShowPaymentModal(false);

    // Navighez înapoi la dashboard cu un mic delay
    setTimeout(() => {
      router.push("/(mainUsers)/dashboard");
    }, 500);
  };

  if (loadingPlans) {
    return (
      <ScreenWrapper
        bg={require("../../assets/images/coffee-beans-textured-background.jpg")}
        style={styles.fullScreen}
      >
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.overlay}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#8B4513" />
            <Text style={styles.loadingText}>{t("common.loading")}</Text>
          </View>
          <BottomTabBar />
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper
      bg={require("../../assets/images/coffee-beans-textured-background.jpg")}
      style={styles.fullScreen}
    >
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.overlay}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {t("subscriptions.chooseBeanPack")}
          </Text>
          <TouchableOpacity
            style={styles.infoButton}
            onPress={() => setHowItWorksVisible(true)}
          >
            <Ionicons
              name="information-circle-outline"
              size={24}
              color="#8B4513"
            />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.pageSubtitle}>
            {t("subscriptions.beansCurrency")}
          </Text>

          {/* Bean Usage Tracker (only shown for subscribers) */}
          {currentSubscription && (
            <View style={styles.usageTrackerContainer}>
              <Text style={styles.usageTitle}>
                {t("subscriptions.usedBeansThisMonth", {
                  used:
                    currentSubscription.creditsTotal -
                    currentSubscription.creditsLeft,
                  total: currentSubscription.creditsTotal,
                })}
              </Text>
              <View style={styles.progressBarBackground}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${
                        ((currentSubscription.creditsTotal -
                          currentSubscription.creditsLeft) /
                          currentSubscription.creditsTotal) *
                        100
                      }%`,
                    },
                  ]}
                />
              </View>
              <Text style={styles.remainingText}>
                {t("subscriptions.beansLeft", {
                  beans: currentSubscription.creditsLeft,
                })}
              </Text>
            </View>
          )}

          {/* Plan Cards */}
          {subscriptionPlans.length > 0 ? (
            <View style={styles.plansContainer}>
              {subscriptionPlans.map((plan, index) => (
                <SubscriptionBox
                  key={plan.id || index}
                  id={plan.id || index.toString()}
                  title={plan.name}
                  price={plan.price}
                  credits={plan.credits}
                  description={plan.description}
                  isPopular={plan.popular}
                  tag={plan.tag}
                  isSelected={index === activeIndex}
                  animatedScale={animatedScales[index]}
                  onSelect={() => selectPlan(index)}
                />
              ))}
            </View>
          ) : (
            <View style={styles.noPlansContainer}>
              <Ionicons name="cafe-outline" size={64} color="#CCC" />
              <Text style={styles.noPlansText}>
                {t("subscriptions.noPlansAvailable")}
              </Text>
            </View>
          )}

          {/* Subscribe Button */}
          {subscriptionPlans.length > 0 && (
            <TouchableOpacity
              style={styles.subscribeButton}
              onPress={subscribeToPlan}
              disabled={processing}
            >
              {processing ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.subscribeButtonText}>
                  {currentSubscription
                    ? t("subscriptions.changePlan")
                    : t("subscriptions.startSipping")}
                </Text>
              )}
            </TouchableOpacity>
          )}

          {/* Current Plan Note */}
          {currentSubscription && (
            <Text style={styles.currentPlanNote}>
              {t("subscriptions.currentlyOnPlan", {
                planName: currentSubscription.subscriptionName,
                beansLeft: currentSubscription.creditsLeft,
              })}
            </Text>
          )}
        </ScrollView>

        {/* How It Works Modal */}
        <Modal
          visible={howItWorksVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setHowItWorksVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {t("subscriptions.howBeansWork")}
                </Text>
                <TouchableOpacity
                  onPress={() => setHowItWorksVisible(false)}
                  style={styles.modalCloseButton}
                >
                  <Ionicons name="close" size={24} color="#8B4513" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalScrollContent}>
                <Text style={styles.modalSubtitle}>
                  {t("subscriptions.beansWorkTitle")}
                </Text>

                <View style={styles.beanExchange}>
                  <View style={styles.beanExchangeItem}>
                    <Ionicons name="cafe-outline" size={32} color="#8B4513" />
                    <Text style={styles.beanExchangeTitle}>
                      {t("subscriptions.espresso")}
                    </Text>
                    <Text style={styles.beanExchangeValue}>
                      {t("subscriptions.oneBean")}
                    </Text>
                  </View>

                  <View style={styles.beanExchangeItem}>
                    <Ionicons name="cafe" size={32} color="#8B4513" />
                    <Text style={styles.beanExchangeTitle}>
                      {t("subscriptions.cappuccino")}
                    </Text>
                    <Text style={styles.beanExchangeValue}>
                      {t("subscriptions.twoBeans")}
                    </Text>
                  </View>

                  <View style={styles.beanExchangeItem}>
                    <Ionicons name="wine" size={32} color="#8B4513" />
                    <Text style={styles.beanExchangeTitle}>
                      {t("subscriptions.latte")}
                    </Text>
                    <Text style={styles.beanExchangeValue}>
                      {t("subscriptions.twoBeans")}
                    </Text>
                  </View>

                  <View style={styles.beanExchangeItem}>
                    <Ionicons name="ice-cream" size={32} color="#8B4513" />
                    <Text style={styles.beanExchangeTitle}>
                      {t("subscriptions.frappe")}
                    </Text>
                    <Text style={styles.beanExchangeValue}>
                      {t("subscriptions.threeBeans")}
                    </Text>
                  </View>
                </View>

                <Text style={styles.modalText}>
                  {t("subscriptions.modalDescription1")}
                </Text>

                <Text style={styles.modalText}>
                  {t("subscriptions.modalDescription2")}
                </Text>
              </ScrollView>

              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setHowItWorksVisible(false)}
              >
                <Text style={styles.modalButtonText}>
                  {t("subscriptions.gotIt")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <BottomTabBar />

        {/* Payment Modal */}
        <PaymentModalSimple
          visible={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedPlanForPayment(null);
          }}
          onSuccess={handlePaymentSuccess}
          subscriptionData={selectedPlanForPayment}
        />

        {/* Error Components */}
        <ErrorToast
          visible={errorState.toast.visible}
          message={errorState.toast.message}
          type={errorState.toast.type}
          onHide={hideToast}
        />
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  fullScreen: {
    height: screenHeight,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(248, 244, 239, 0.85)",
    paddingBottom: 75,
  },
  container: {
    flex: 1,
    backgroundColor: "#F8F4EF",
    paddingBottom: 75,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#8B4513",
  },
  header: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 10,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0D6C7",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: "#321E0E",
    textAlign: "center",
  },
  infoButton: {
    position: "absolute",
    right: 20,
    padding: 5,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 30,
  },
  pageSubtitle: {
    fontSize: 16,
    color: "#8B4513",
    textAlign: "center",
    marginBottom: 20,
  },

  usageTrackerContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  usageTitle: {
    fontSize: 14,
    color: "#321E0E",
    fontWeight: "500",
    marginBottom: 8,
  },
  progressBarBackground: {
    height: 10,
    backgroundColor: "#F0E6D9",
    borderRadius: 5,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#8B4513",
    borderRadius: 5,
  },
  remainingText: {
    fontSize: 12,
    color: "#666",
    marginTop: 6,
    textAlign: "right",
  },
  plansContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  noPlansContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  noPlansText: {
    fontSize: 16,
    color: "#999",
    marginTop: 16,
    textAlign: "center",
  },
  subscribeButton: {
    backgroundColor: "#8B4513",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  subscribeButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  currentPlanNote: {
    textAlign: "center",
    color: "#6A4028",
    fontSize: 14,
    marginTop: 15,
    fontStyle: "italic",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    width: "100%",
    maxHeight: "80%",
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#321E0E",
  },
  modalCloseButton: {
    padding: 5,
  },
  modalScrollContent: {
    maxHeight: "70%",
  },
  modalSubtitle: {
    fontSize: 16,
    color: "#8B4513",
    marginBottom: 15,
    fontWeight: "500",
  },
  beanExchange: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
    marginBottom: 20,
  },
  beanExchangeItem: {
    width: "48%",
    backgroundColor: "#F8F4EF",
    borderRadius: 12,
    padding: 15,
    alignItems: "center",
    marginBottom: 10,
  },
  beanExchangeTitle: {
    fontSize: 14,
    color: "#321E0E",
    fontWeight: "600",
    marginTop: 8,
  },
  beanExchangeValue: {
    fontSize: 14,
    color: "#8B4513",
    fontWeight: "700",
    marginTop: 4,
  },
  modalText: {
    fontSize: 14,
    color: "#555555",
    lineHeight: 20,
    marginBottom: 15,
  },
  modalButton: {
    backgroundColor: "#8B4513",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  modalButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
