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
  Alert,
} from "react-native";
import { Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import BottomTabBar from "../../components/BottomTabBar";
import BoxesPlan from "../../components/BoxesPlan";
import { useLanguage } from "../../context/LanguageContext";
import { auth, db } from "../../config/firebase";
import {
  doc,
  setDoc,
  addDoc,
  collection,
  getDoc,
  Timestamp,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

const { width } = Dimensions.get("window");

// Define types
interface SubscriptionPlan {
  id: string;
  name: string;
  price: string;
  beans: number;
  icon: string; // Using string type for icon names
  description: string;
  popular: boolean;
  tag: string | null;
}

interface UserSubscription {
  id?: string;
  userId: string;
  planName: string;
  planId: string;
  beansTotal: number;
  beansUsed: number;
  beansRemaining: number;
  price: string;
  createdAt: any;
  status: "active" | "expired" | "pending";
}

export default function SubscriptionsScreen() {
  const { t } = useLanguage();
  const [howItWorksVisible, setHowItWorksVisible] = useState(false);
  const [activeIndex, setActiveIndex] = useState(1); // Default to middle plan
  const [isMonthly, setIsMonthly] = useState(true);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentSubscription, setCurrentSubscription] =
    useState<UserSubscription | null>(null);

  // Animation values for card scaling
  const animatedScales = [
    useRef(new Animated.Value(0.9)).current,
    useRef(new Animated.Value(1.0)).current,
    useRef(new Animated.Value(0.9)).current,
  ];

  // Bean-based subscription plans
  const subscriptions: SubscriptionPlan[] = [
    {
      id: "1",
      name: "Mini Espresso Plan",
      price: "49 RON",
      beans: 50,
      icon: "cafe-outline",
      description:
        "Perfect for light sippers. Just enough for your daily espresso fix.",
      popular: false,
      tag: null,
    },
    {
      id: "2",
      name: "Caffe Crema Plan",
      price: "69 RON",
      beans: 75,
      icon: "cafe",
      description:
        "Balanced for everyday coffee lovers. Great for cappuccinos and more.",
      popular: true,
      tag: "⭐ Most Popular",
    },
    {
      id: "3",
      name: "Ultimate Bean Boost",
      price: "89 RON",
      beans: 100,
      icon: "flame",
      description:
        "For serious coffee aficionados. A full month of lattes, mochas & more.",
      popular: false,
      tag: "🔥 Best Value",
    },
  ];

  // Get current user and subscription data on mount
  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      setCurrentUser(user);
      fetchUserSubscription(user.uid);
    }
  }, []);

  // Fetch user's current subscription if any
  const fetchUserSubscription = async (userId: string) => {
    try {
      const userDoc = await getDoc(doc(db, "users", userId));
      if (userDoc.exists() && userDoc.data().currentSubscription) {
        const subscriptionId = userDoc.data().currentSubscription;
        const subscriptionDoc = await getDoc(
          doc(db, "subscriptions", subscriptionId)
        );

        if (subscriptionDoc.exists()) {
          setCurrentSubscription({
            id: subscriptionDoc.id,
            ...subscriptionDoc.data(),
          } as UserSubscription);

          // Set usedBeans based on the subscription data
          const subscriptionData = subscriptionDoc.data();
          setUsedBeans(subscriptionData.beansUsed || 0);
          setTotalBeans(subscriptionData.beansTotal || 0);
        }
      }
    } catch (error) {
      console.error("Error fetching subscription:", error);
    }
  };

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

  // Mocked user bean usage - will be updated from Firebase if subscription exists
  const [usedBeans, setUsedBeans] = useState(0);
  const [totalBeans, setTotalBeans] = useState(75);

  const toggleSubscriptionType = () => {
    setIsMonthly(!isMonthly);
  };

  // Actual implementation to save subscription to Firebase
  const subscribeToPlan = async () => {
    if (!currentUser) {
      Alert.alert("Error", "You must be logged in to subscribe to a plan");
      return;
    }

    setLoading(true);
    try {
      const selectedPlan = subscriptions[activeIndex];

      // Create new subscription document
      const newSubscription: Omit<UserSubscription, "id"> = {
        userId: currentUser.uid,
        planName: selectedPlan.name,
        planId: selectedPlan.id,
        beansTotal: selectedPlan.beans,
        beansUsed: 0,
        beansRemaining: selectedPlan.beans,
        price: selectedPlan.price,
        createdAt: serverTimestamp(),
        status: "active",
      };

      // Add to subscriptions collection
      const subscriptionRef = await addDoc(
        collection(db, "subscriptions"),
        newSubscription
      );

      // Update user document with subscription reference
      await updateDoc(doc(db, "users", currentUser.uid), {
        currentPlan: {
          name: selectedPlan.name,
          beans: selectedPlan.beans,
          date: serverTimestamp(),
        },
        currentSubscription: subscriptionRef.id,
      });

      // Update local state with the new subscription
      setCurrentSubscription({
        id: subscriptionRef.id,
        ...newSubscription,
        createdAt: Timestamp.now(),
      });

      // Update beans counts
      setUsedBeans(0);
      setTotalBeans(selectedPlan.beans);

      // Show success message
      Alert.alert(
        "Subscription Activated",
        `🎉 You've received ${selectedPlan.beans} Beans! Enjoy your coffee!`
      );
    } catch (error) {
      console.error("Error creating subscription:", error);
      Alert.alert(
        "Error",
        "Failed to activate subscription. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

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
              You've used {usedBeans} of your {totalBeans} Beans this month
            </Text>
            <View style={styles.progressBarBackground}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${(usedBeans / totalBeans) * 100}%` },
                ]}
              />
            </View>
          </View>
        )}

        {/* Plan Cards */}
        <View style={styles.plansContainer}>
          {subscriptions.map((plan, index) => (
            <BoxesPlan
              key={plan.id}
              id={plan.id}
              title={plan.name}
              price={plan.price}
              beans={plan.beans}
              description={plan.description}
              icon={plan.icon}
              tag={plan.tag}
              isSelected={index === activeIndex}
              animatedScale={animatedScales[index]}
              onSelect={() => selectPlan(index)}
            />
          ))}
        </View>

        {/* Subscribe Button */}
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

        {/* Current Plan Note */}
        {currentSubscription && (
          <Text style={styles.currentPlanNote}>
            You're currently on the {currentSubscription.planName} plan with{" "}
            {currentSubscription.beansRemaining} beans remaining
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F4EF", // Warmer, coffee-themed background
    paddingBottom: 75, // Account for tab bar
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
  plansContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
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
