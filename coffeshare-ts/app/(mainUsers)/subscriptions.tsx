import React, { useState, useRef, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Animated,
  Modal,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import BottomTabBar from "../../components/BottomTabBar";
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

const { width } = Dimensions.get("window");

export default function SubscriptionsScreen() {
  const { t } = useLanguage();
  const { errorState, showError, hideToast } = useErrorHandler();
  const [howItWorksVisible, setHowItWorksVisible] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMonthly, setIsMonthly] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentSubscription, setCurrentSubscription] =
    useState<UserSubscription | null>(null);
  const [subscriptionPlans, setSubscriptionPlans] = useState<
    SubscriptionPlan[]
  >([]);

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
  };

  const toggleSubscriptionType = () => {
    setIsMonthly(!isMonthly);
  };

  // Subscribe to a plan
  const subscribeToPlan = async () => {
    if (!currentUser) {
      showError("You must be logged in to subscribe to a plan");
      return;
    }

    if (
      subscriptionPlans.length === 0 ||
      activeIndex >= subscriptionPlans.length
    ) {
      return;
    }

    setLoading(true);
    try {
      const selectedPlan = subscriptionPlans[activeIndex];

      // Create user subscription
      await SubscriptionService.createUserSubscription(
        currentUser.uid,
        selectedPlan.id!
      );

      // Show success message
      Toast.show({
        type: "success",
        text1: "Subscription Activated!",
        text2: `🎉 You've received ${selectedPlan.credits} Beans! Enjoy your coffee!`,
      });
    } catch (error) {
      console.error("Error creating subscription:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to activate subscription. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loadingPlans) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B4513" />
          <Text style={styles.loadingText}>Loading subscription plans...</Text>
        </View>
        <BottomTabBar />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Choose Your Bean Pack ☕</Text>
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
          Subscribe monthly and pay with Beans at your favorite cafés.
        </Text>

        {/* Subscription Type Toggle */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[styles.toggleOption, isMonthly && styles.toggleActive]}
            onPress={() => isMonthly || toggleSubscriptionType()}
          >
            <Text
              style={[styles.toggleText, isMonthly && styles.toggleActiveText]}
            >
              Monthly Subscription
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleOption, !isMonthly && styles.toggleActive]}
            onPress={() => !isMonthly || toggleSubscriptionType()}
          >
            <Text
              style={[styles.toggleText, !isMonthly && styles.toggleActiveText]}
            >
              One-Time Purchase
            </Text>
          </TouchableOpacity>
        </View>

        {/* Bean Usage Tracker (only shown for subscribers) */}
        {currentSubscription && (
          <View style={styles.usageTrackerContainer}>
            <Text style={styles.usageTitle}>
              You've used{" "}
              {currentSubscription.creditsTotal -
                currentSubscription.creditsLeft}{" "}
              of your {currentSubscription.creditsTotal} Beans this month
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
              {currentSubscription.creditsLeft} beans remaining
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
              No subscription plans available at the moment.
            </Text>
          </View>
        )}

        {/* Subscribe Button */}
        {subscriptionPlans.length > 0 && (
          <TouchableOpacity
            style={styles.subscribeButton}
            onPress={subscribeToPlan}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.subscribeButtonText}>
                {currentSubscription ? "Change Plan" : "Start Sipping"}
              </Text>
            )}
          </TouchableOpacity>
        )}

        {/* Current Plan Note */}
        {currentSubscription && (
          <Text style={styles.currentPlanNote}>
            You're currently on the {currentSubscription.subscriptionName} plan
            with {currentSubscription.creditsLeft} beans remaining
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
              <Text style={styles.modalTitle}>How Beans Work</Text>
              <TouchableOpacity
                onPress={() => setHowItWorksVisible(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#8B4513" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScrollContent}>
              <Text style={styles.modalSubtitle}>
                Beans are your coffee currency! Here's how they work:
              </Text>

              <View style={styles.beanExchange}>
                <View style={styles.beanExchangeItem}>
                  <Ionicons name="cafe-outline" size={32} color="#8B4513" />
                  <Text style={styles.beanExchangeTitle}>Espresso</Text>
                  <Text style={styles.beanExchangeValue}>1 Bean</Text>
                </View>

                <View style={styles.beanExchangeItem}>
                  <Ionicons name="cafe" size={32} color="#8B4513" />
                  <Text style={styles.beanExchangeTitle}>Cappuccino</Text>
                  <Text style={styles.beanExchangeValue}>2 Beans</Text>
                </View>

                <View style={styles.beanExchangeItem}>
                  <Ionicons name="wine" size={32} color="#8B4513" />
                  <Text style={styles.beanExchangeTitle}>Latte</Text>
                  <Text style={styles.beanExchangeValue}>2 Beans</Text>
                </View>

                <View style={styles.beanExchangeItem}>
                  <Ionicons name="ice-cream" size={32} color="#8B4513" />
                  <Text style={styles.beanExchangeTitle}>Frappé</Text>
                  <Text style={styles.beanExchangeValue}>3 Beans</Text>
                </View>
              </View>

              <Text style={styles.modalText}>
                Subscribe to a monthly bean pack and use your beans at any
                partner café. Beans refresh with each new billing cycle. Unused
                beans don't roll over.
              </Text>

              <Text style={styles.modalText}>
                Just show your QR code at checkout and your beans will be
                automatically deducted.
              </Text>
            </ScrollView>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setHowItWorksVisible(false)}
            >
              <Text style={styles.modalButtonText}>Got It!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <BottomTabBar />

      {/* Error Components */}
      <ErrorToast
        visible={errorState.toast.visible}
        message={errorState.toast.message}
        type={errorState.toast.type}
        onHide={hideToast}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
  toggleContainer: {
    flexDirection: "row",
    backgroundColor: "#F0E6D9",
    borderRadius: 12,
    marginBottom: 20,
    padding: 4,
  },
  toggleOption: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
  },
  toggleActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleText: {
    fontSize: 14,
    color: "#8B4513",
  },
  toggleActiveText: {
    fontWeight: "600",
    color: "#321E0E",
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
