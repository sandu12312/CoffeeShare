import { initStripe } from "@stripe/stripe-react-native";

// Inițializez Stripe cu cheia publică
const STRIPE_PUBLISHABLE_KEY =
  process.env.STRIPE_PUBLISHABLE_KEY || "pk_test_YOUR_KEY_HERE";

export interface PaymentIntentData {
  clientSecret: string;
  amount: number;
  currency: string;
  paymentIntentId: string;
}

export interface SubscriptionPaymentData {
  subscriptionId: string;
  planId: string;
  userId: string;
  amount: number;
  currency: string;
}

/**
 * Ratele de conversie valutară (RON la USD)
 * În producție, ar trebui să obții acestea de la un API în timp real precum ExchangeRate-API
 */
const CURRENCY_RATES = {
  RON_TO_USD: 0.22, // 1 RON ≈ 0.22 USD (rată aproximativă)
  USD_TO_RON: 4.55, // 1 USD ≈ 4.55 RON (rată aproximativă)
};

/**
 * Utilitarul de conversie valutară
 */
class CurrencyConverter {
  /**
   * Convert RON în USD pentru procesarea Stripe
   */
  static convertRonToUsd(amountInRon: number): number {
    const usdAmount = amountInRon * CURRENCY_RATES.RON_TO_USD;
    return Math.round(usdAmount * 100); // Convert în cenți
  }

  /**
   * Convert USD înapoi în RON pentru afișare
   */
  static convertUsdToRon(amountInUsdCents: number): number {
    const usdAmount = amountInUsdCents / 100;
    return Math.round(usdAmount * CURRENCY_RATES.USD_TO_RON * 100) / 100;
  }

  /**
   * Obțin ratele de schimb în timp real (pentru utilizarea în producție)
   */
  static async fetchExchangeRates(): Promise<{
    ronToUsd: number;
    usdToRon: number;
  }> {
    try {
      // În producție, folosesc un API real precum:
      // const response = await fetch('https://api.exchangerate-api.com/v4/latest/RON');
      // const data = await response.json();
      // return { ronToUsd: data.rates.USD, usdToRon: 1 / data.rates.USD };

      // Pentru moment, returnez ratele statice
      return {
        ronToUsd: CURRENCY_RATES.RON_TO_USD,
        usdToRon: CURRENCY_RATES.USD_TO_RON,
      };
    } catch (error) {
      console.warn("Failed to fetch exchange rates, using fallback", error);
      return {
        ronToUsd: CURRENCY_RATES.RON_TO_USD,
        usdToRon: CURRENCY_RATES.USD_TO_RON,
      };
    }
  }
}

class StripeService {
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      await initStripe({
        publishableKey: STRIPE_PUBLISHABLE_KEY,
        merchantIdentifier: "merchant.com.coffeshare.app", // Pentru Apple Pay
        urlScheme: "coffeshare", // Pentru redirecționări
      });
      this.initialized = true;
      console.log("✅ Stripe initialized successfully");
    } catch (error) {
      console.error("❌ Failed to initialize Stripe:", error);
      throw error;
    }
  }

  /**
   * Creez un payment intent pentru abonament
   * Aceasta apelează API-ul real de backend cu conversia valutară
   */
  async createPaymentIntent(
    subscriptionData: SubscriptionPaymentData
  ): Promise<PaymentIntentData> {
    try {
      // Convert RON în USD pentru procesarea Stripe
      const originalAmountRon = subscriptionData.amount;
      const amountInUsdCents =
        CurrencyConverter.convertRonToUsd(originalAmountRon);

      console.log(
        `💱 Converting ${originalAmountRon} RON to ${amountInUsdCents} USD cents`
      );

      const response = await fetch(
        "http://localhost:3001/create-payment-intent",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount: amountInUsdCents,
            currency: "usd", // Folosesc întotdeauna USD pentru Stripe
            description: `CoffeeShare Subscription - ${subscriptionData.planId} (${originalAmountRon} RON)`,
            metadata: {
              planId: subscriptionData.planId,
              userId: subscriptionData.userId,
              subscriptionId: subscriptionData.subscriptionId,
              originalAmountRon: originalAmountRon.toString(),
              originalCurrency: "RON",
            },
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create payment intent");
      }

      const data = await response.json();
      console.log(
        `✅ Real payment intent created: ${data.paymentIntentId} for ${originalAmountRon} RON (${amountInUsdCents} USD cents)`
      );

      return {
        clientSecret: data.clientSecret,
        amount: originalAmountRon, // Returnez suma originală în RON pentru afișare
        currency: "RON", // Afișez moneda ca RON
        paymentIntentId: data.paymentIntentId, // Adaug ID-ul payment intent pentru confirmare
      };
    } catch (error) {
      console.error("❌ Failed to create payment intent:", error);
      throw error;
    }
  }

  /**
   * Confirm un payment intent folosind metode de plată de test
   */
  async confirmPayment(
    paymentIntentId: string,
    cardNumber: string = "4242424242424242"
  ): Promise<any> {
    try {
      console.log(`🔄 Confirming payment: ${paymentIntentId}`);

      const response = await fetch(
        "http://localhost:3001/simulate-payment-confirmation",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            paymentIntentId,
            testCardNumber: cardNumber.replace(/\s/g, ""), // Elimin spațiile
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to confirm payment");
      }

      const data = await response.json();
      console.log(
        `✅ Payment confirmed successfully! Status: ${data.paymentIntent.status}`
      );

      return data.paymentIntent;
    } catch (error) {
      console.error("❌ Failed to confirm payment:", error);
      throw error;
    }
  }

  /**
   * Simulez apelul de backend pentru testare
   * În producție, înlocuiesc aceasta cu apelul actual de API
   */
  private async simulateBackendCall(
    subscriptionData: SubscriptionPaymentData
  ): Promise<any> {
    // Simulez întârzierea de rețea
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Pentru testare, returnez un client secret mock
    // În producție, backend-ul ar crea un PaymentIntent real
    return {
      client_secret: `pi_test_${Date.now()}_secret_${Math.random()
        .toString(36)
        .substr(2, 9)}`,
      status: "requires_payment_method",
    };
  }

  /**
   * Procesez plata de test (doar pentru dezvoltare)
   */
  async processTestPayment(
    amount: number,
    currency: string = "usd"
  ): Promise<boolean> {
    try {
      console.log(
        `🧪 Processing test payment: ${amount} ${currency.toUpperCase()}`
      );

      // Simulez procesarea plății
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Pentru testare, success sau eșuez aleatoriu (90% rată de succes)
      const success = Math.random() > 0.1;

      if (success) {
        console.log("✅ Test payment successful");
        return true;
      } else {
        console.log("❌ Test payment failed");
        throw new Error("Test payment failed - simulated failure");
      }
    } catch (error) {
      console.error("❌ Payment processing error:", error);
      throw error;
    }
  }

  /**
   * Validez metoda de plată pentru testare
   */
  validateTestCard(cardNumber: string): boolean {
    // Numerele cardurilor de test Stripe
    const testCards = [
      "4242424242424242", // Visa
      "4000056655665556", // Visa (debit)
      "5555555555554444", // Mastercard
      "2223003122003222", // Mastercard (2-series)
      "5200828282828210", // Mastercard (debit)
      "378282246310005", // American Express
    ];

    return testCards.includes(cardNumber.replace(/\s/g, ""));
  }

  /**
   * Obțin sugestiile de carduri de test
   */
  getTestCards(): Array<{
    number: string;
    brand: string;
    description: string;
  }> {
    return [
      {
        number: "4242 4242 4242 4242",
        brand: "Visa",
        description: "Succeeds and immediately processes the payment",
      },
      {
        number: "4000 0000 0000 0002",
        brand: "Visa",
        description: "Declined with generic decline code",
      },
      {
        number: "4000 0000 0000 9995",
        brand: "Visa",
        description: "Declined with insufficient funds code",
      },
      {
        number: "5555 5555 5555 4444",
        brand: "Mastercard",
        description: "Succeeds and immediately processes the payment",
      },
    ];
  }
}

export default new StripeService();
