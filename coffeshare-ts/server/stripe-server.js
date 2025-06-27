require("dotenv").config();
const express = require("express");
const cors = require("cors");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const app = express();
const port = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "Stripe server is running" });
});

// Create payment intent
app.post("/create-payment-intent", async (req, res) => {
  try {
    const { amount, currency, description, metadata } = req.body;

    // Validate required fields
    if (!amount || !currency) {
      return res.status(400).json({
        error: "Missing required fields: amount and currency",
      });
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount), // Stripe expects amounts in cents
      currency: currency.toLowerCase(),
      description: description || "CoffeeShare Subscription",
      metadata: metadata || {},
      automatic_payment_methods: {
        enabled: true,
      },
    });

    console.log(
      `✅ Payment Intent created: ${paymentIntent.id} for ${amount} ${currency}`
    );

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
    });
  } catch (error) {
    console.error("❌ Error creating payment intent:", error);
    res.status(500).json({
      error: "Failed to create payment intent",
      message: error.message,
    });
  }
});

// Confirm payment (optional - for server-side confirmation)
app.post("/confirm-payment", async (req, res) => {
  try {
    const { paymentIntentId } = req.body;

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    res.json({
      status: paymentIntent.status,
      id: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
    });
  } catch (error) {
    console.error("❌ Error confirming payment:", error);
    res.status(500).json({
      error: "Failed to confirm payment",
      message: error.message,
    });
  }
});

// NEW: Simulate payment confirmation with test payment method
app.post("/simulate-payment-confirmation", async (req, res) => {
  try {
    const { paymentIntentId, testCardNumber = "4242424242424242" } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({
        error: "Missing required field: paymentIntentId",
      });
    }

    console.log(`🧪 Simulating payment confirmation for: ${paymentIntentId}`);

    // Map test card numbers to Stripe test payment method tokens
    const testPaymentMethods = {
      4242424242424242: "pm_card_visa", // Visa success
      4000000000000002: "pm_card_chargeDeclined", // Declined
      4000000000009995: "pm_card_chargeDeclinedInsufficientFunds", // Insufficient funds
      5555555555554444: "pm_card_mastercard", // Mastercard success
    };

    const cleanCardNumber = testCardNumber.replace(/\s/g, "");
    const paymentMethodToken =
      testPaymentMethods[cleanCardNumber] || "pm_card_visa";

    console.log(
      `💳 Using test payment method: ${paymentMethodToken} for card ${cleanCardNumber}`
    );

    // Confirm the payment intent with the test payment method token
    const confirmedPayment = await stripe.paymentIntents.confirm(
      paymentIntentId,
      {
        payment_method: paymentMethodToken,
        return_url: "https://your-website.com/return", // Required but not used in test
      }
    );

    console.log(`✅ Payment confirmed! Status: ${confirmedPayment.status}`);

    res.json({
      success: true,
      paymentIntent: {
        id: confirmedPayment.id,
        status: confirmedPayment.status,
        amount: confirmedPayment.amount,
        currency: confirmedPayment.currency,
        payment_method: paymentMethodToken,
      },
    });
  } catch (error) {
    console.error("❌ Error simulating payment confirmation:", error);
    res.status(500).json({
      error: "Failed to simulate payment confirmation",
      message: error.message,
    });
  }
});

// Get payment details
app.get("/payment/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const paymentIntent = await stripe.paymentIntents.retrieve(id);

    res.json({
      id: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      description: paymentIntent.description,
      created: new Date(paymentIntent.created * 1000),
    });
  } catch (error) {
    console.error("❌ Error retrieving payment:", error);
    res.status(500).json({
      error: "Failed to retrieve payment",
      message: error.message,
    });
  }
});

// List recent payments
app.get("/payments", async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const paymentIntents = await stripe.paymentIntents.list({
      limit: parseInt(limit),
    });

    const payments = paymentIntents.data.map((payment) => ({
      id: payment.id,
      status: payment.status,
      amount: payment.amount,
      currency: payment.currency,
      description: payment.description,
      created: new Date(payment.created * 1000),
    }));

    res.json({ payments });
  } catch (error) {
    console.error("❌ Error listing payments:", error);
    res.status(500).json({
      error: "Failed to list payments",
      message: error.message,
    });
  }
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Stripe server running at http://localhost:${port}`);
  console.log(`📊 Health check: http://localhost:${port}/health`);
  console.log(
    `💳 Create payment: POST http://localhost:${port}/create-payment-intent`
  );
});

module.exports = app;
