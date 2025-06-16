import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLanguage } from "../context/LanguageContext";
import stripeService from "../services/stripeService";
import Toast from "react-native-toast-message";

interface PaymentModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  subscriptionData: {
    planId: string;
    planName: string;
    price: number;
    currency: string;
    userId: string;
  } | null;
}

export default function PaymentModalSimple({
  visible,
  onClose,
  onSuccess,
  subscriptionData,
}: PaymentModalProps) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvc, setCvc] = useState("");
  const [showTestCards, setShowTestCards] = useState(false);

  // Initialize Stripe when modal opens
  useEffect(() => {
    if (visible) {
      initializeStripe();
      // Pre-fill with test card for easier testing
      setCardNumber("4242 4242 4242 4242");
      setExpiryDate("12/25");
      setCvc("123");
    }
  }, [visible]);

  const initializeStripe = async () => {
    try {
      await stripeService.initialize();
    } catch (error) {
      console.error("Failed to initialize Stripe:", error);
      Toast.show({
        type: "error",
        text1: "Payment Error",
        text2: "Failed to initialize payment system",
      });
    }
  };

  const formatCardNumber = (text: string) => {
    // Remove all non-digits
    const cleaned = text.replace(/\D/g, "");
    // Add spaces every 4 digits
    const formatted = cleaned.replace(/(.{4})/g, "$1 ").trim();
    // Limit to 19 characters (16 digits + 3 spaces)
    return formatted.substring(0, 19);
  };

  const formatExpiryDate = (text: string) => {
    // Remove all non-digits
    const cleaned = text.replace(/\D/g, "");
    // Add slash after 2 digits
    if (cleaned.length >= 2) {
      return cleaned.substring(0, 2) + "/" + cleaned.substring(2, 4);
    }
    return cleaned;
  };

  const isCardValid = () => {
    const cleanCardNumber = cardNumber.replace(/\s/g, "");
    return (
      cleanCardNumber.length === 16 &&
      expiryDate.length === 5 &&
      cvc.length === 3
    );
  };

  const handlePayment = async () => {
    if (!subscriptionData) {
      Toast.show({
        type: "error",
        text1: "Invalid Payment",
        text2: "No subscription data found",
      });
      return;
    }

    if (!isCardValid()) {
      Toast.show({
        type: "error",
        text1: "Invalid Payment",
        text2: "Please complete your card information",
      });
      return;
    }

    setLoading(true);
    try {
      // Check if server is running (fallback to test payment if not)
      const healthCheck = await fetch("http://localhost:3001/health").catch(
        () => null
      );

      if (!healthCheck) {
        // Fallback to test payment if server is not running
        console.log("⚠️ Server not running, using test payment");

        // Validate if it's a test card
        const isTestCard = stripeService.validateTestCard(cardNumber);

        if (!isTestCard) {
          Toast.show({
            type: "error",
            text1: "Invalid Card",
            text2: "Please use a test card for this demo",
          });
          setLoading(false);
          return;
        }

        // Process test payment
        const success = await stripeService.processTestPayment(
          subscriptionData.price * 100,
          subscriptionData.currency
        );

        if (success) {
          Toast.show({
            type: "success",
            text1: "Payment Successful! (Test Mode)",
            text2: `Subscription to ${subscriptionData.planName} activated`,
          });
          onSuccess();
          onClose();
        }
        return;
      }

      // Real Stripe payment flow
      console.log("🔄 Creating real payment intent...");

      const paymentIntentData = await stripeService.createPaymentIntent({
        subscriptionId: subscriptionData.planId,
        planId: subscriptionData.planId,
        userId: subscriptionData.userId,
        amount: subscriptionData.price, // Amount in RON (conversion handled in service)
        currency: subscriptionData.currency,
      });

      console.log("✅ Payment intent created, confirming payment...");

      // Confirm the payment with the entered card details
      const confirmedPayment = await stripeService.confirmPayment(
        paymentIntentData.paymentIntentId,
        cardNumber
      );

      Toast.show({
        type: "success",
        text1: "Payment Completed!",
        text2: `Payment ${confirmedPayment.id} confirmed with status: ${confirmedPayment.status}`,
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Payment failed:", error);
      Toast.show({
        type: "error",
        text1: "Payment Failed",
        text2:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTestCardSelect = (cardNumber: string) => {
    setCardNumber(cardNumber);
    setExpiryDate("12/25");
    setCvc("123");
    setShowTestCards(false);
    Toast.show({
      type: "info",
      text1: "Test Card Selected",
      text2: `Card ${cardNumber} selected`,
    });
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(price);
  };

  if (!subscriptionData) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Complete Payment</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Subscription Details */}
            <View style={styles.subscriptionDetails}>
              <Text style={styles.planName}>{subscriptionData.planName}</Text>
              <Text style={styles.planPrice}>
                {formatPrice(subscriptionData.price, subscriptionData.currency)}
                /month
              </Text>
            </View>

            {/* Test Mode Banner */}
            <View style={styles.testBanner}>
              <Ionicons name="flask" size={20} color="#FF9500" />
              <Text style={styles.testBannerText}>
                Test Mode - No real charges will be made
              </Text>
            </View>

            {/* Test Cards Helper */}
            <TouchableOpacity
              style={styles.testCardsButton}
              onPress={() => setShowTestCards(!showTestCards)}
            >
              <Ionicons name="card" size={20} color="#8B4513" />
              <Text style={styles.testCardsButtonText}>
                {showTestCards ? "Hide" : "Show"} Test Cards
              </Text>
              <Ionicons
                name={showTestCards ? "chevron-up" : "chevron-down"}
                size={20}
                color="#8B4513"
              />
            </TouchableOpacity>

            {showTestCards && (
              <View style={styles.testCardsContainer}>
                {stripeService.getTestCards().map((card, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.testCard}
                    onPress={() => handleTestCardSelect(card.number)}
                  >
                    <View style={styles.testCardHeader}>
                      <Text style={styles.testCardNumber}>{card.number}</Text>
                      <Text style={styles.testCardBrand}>{card.brand}</Text>
                    </View>
                    <Text style={styles.testCardDescription}>
                      {card.description}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Card Input Fields */}
            <View style={styles.cardContainer}>
              <Text style={styles.cardLabel}>Card Information</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Card Number</Text>
                <TextInput
                  style={styles.cardInput}
                  value={cardNumber}
                  onChangeText={(text) => setCardNumber(formatCardNumber(text))}
                  placeholder="4242 4242 4242 4242"
                  keyboardType="numeric"
                  maxLength={19}
                />
              </View>

              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, styles.inputHalf]}>
                  <Text style={styles.inputLabel}>Expiry Date</Text>
                  <TextInput
                    style={styles.cardInput}
                    value={expiryDate}
                    onChangeText={(text) =>
                      setExpiryDate(formatExpiryDate(text))
                    }
                    placeholder="MM/YY"
                    keyboardType="numeric"
                    maxLength={5}
                  />
                </View>

                <View style={[styles.inputGroup, styles.inputHalf]}>
                  <Text style={styles.inputLabel}>CVC</Text>
                  <TextInput
                    style={styles.cardInput}
                    value={cvc}
                    onChangeText={(text) =>
                      setCvc(text.replace(/\D/g, "").substring(0, 3))
                    }
                    placeholder="123"
                    keyboardType="numeric"
                    maxLength={3}
                  />
                </View>
              </View>
            </View>

            {/* Payment Summary */}
            <View style={styles.paymentSummary}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subscription</Text>
                <Text style={styles.summaryValue}>
                  {subscriptionData.price.toFixed(0)} RON
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabelSmall}>
                  Stripe charges (USD)
                </Text>
                <Text style={styles.summaryValueSmall}>
                  ≈ ${(subscriptionData.price * 0.22).toFixed(2)} USD
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Tax</Text>
                <Text style={styles.summaryValue}>$0.00</Text>
              </View>
              <View style={[styles.summaryRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>
                  {formatPrice(
                    subscriptionData.price,
                    subscriptionData.currency
                  )}
                </Text>
              </View>
            </View>
          </ScrollView>

          {/* Payment Button */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[
                styles.payButton,
                (!isCardValid() || loading) && styles.payButtonDisabled,
              ]}
              onPress={handlePayment}
              disabled={!isCardValid() || loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="card" size={20} color="#FFF" />
                  <Text style={styles.payButtonText}>
                    Pay{" "}
                    {formatPrice(
                      subscriptionData.price,
                      subscriptionData.currency
                    )}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "90%",
    minHeight: "60%",
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
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
  },
  closeButton: {
    padding: 5,
  },
  scrollContent: {
    flex: 1,
    padding: 20,
  },
  subscriptionDetails: {
    backgroundColor: "#F8F4EF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    alignItems: "center",
  },
  planName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#8B4513",
    marginBottom: 4,
  },
  planPrice: {
    fontSize: 24,
    fontWeight: "700",
    color: "#321E0E",
  },
  testBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF3CD",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  testBannerText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#856404",
    fontWeight: "500",
  },
  testCardsButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F4EF",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  testCardsButtonText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: "#8B4513",
    fontWeight: "500",
  },
  testCardsContainer: {
    marginBottom: 20,
  },
  testCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  testCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  testCardNumber: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    fontFamily: "monospace",
  },
  testCardBrand: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  testCardDescription: {
    fontSize: 12,
    color: "#666",
  },
  cardContainer: {
    marginBottom: 20,
  },
  cardLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 8,
  },
  cardInput: {
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: "#333",
    backgroundColor: "#F8F9FA",
  },
  inputRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  inputHalf: {
    width: "48%",
  },
  paymentSummary: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: "#666",
  },
  summaryValue: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  summaryLabelSmall: {
    fontSize: 12,
    color: "#666",
  },
  summaryValueSmall: {
    fontSize: 12,
    color: "#666",
    fontStyle: "italic",
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: "#DDD",
    paddingTop: 8,
    marginTop: 8,
    marginBottom: 0,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  totalValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#8B4513",
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  payButton: {
    backgroundColor: "#8B4513",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  payButtonDisabled: {
    backgroundColor: "#CCC",
  },
  payButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    marginLeft: 8,
  },
});
