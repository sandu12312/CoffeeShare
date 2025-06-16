# 🔥 Stripe Payment Integration Setup Guide

## 🚀 Quick Setup for Testing

### Step 1: Get Your Stripe Test Keys

1. **Create a Stripe Account** (if you don't have one):

   - Go to https://stripe.com
   - Sign up for a free account

2. **Get Your Test Keys**:
   - Go to your Stripe Dashboard
   - Navigate to **Developers** → **API Keys**
   - Copy your **Publishable key** (starts with `pk_test_...`)
   - Copy your **Secret key** (starts with `sk_test_...`)

### Step 2: Add Keys to Environment File

Add these lines to your `.env.local` file:

```bash
# Stripe Test Keys (Replace with your actual test keys)
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_ACTUAL_PUBLISHABLE_KEY_HERE
STRIPE_SECRET_KEY=sk_test_YOUR_ACTUAL_SECRET_KEY_HERE
```

### Step 3: Test the Payment Flow

1. **Start your development server**:

   ```bash
   npx expo start --dev-client
   ```

2. **Navigate to Subscriptions**:

   - Open the app
   - Go to the Subscriptions tab
   - Select a subscription plan
   - Click "Start Sipping" or "Change Plan"

3. **Use Test Cards**:
   - The payment modal will show test card options
   - Use `4242 4242 4242 4242` for successful payments
   - Use any future expiry date (e.g., 12/25)
   - Use any 3-digit CVC (e.g., 123)

## 🧪 Test Card Numbers

| Card Number           | Brand      | Result                |
| --------------------- | ---------- | --------------------- |
| `4242 4242 4242 4242` | Visa       | ✅ Success            |
| `4000 0000 0000 0002` | Visa       | ❌ Generic decline    |
| `4000 0000 0000 9995` | Visa       | ❌ Insufficient funds |
| `5555 5555 5555 4444` | Mastercard | ✅ Success            |

## 🔧 Current Implementation Features

### ✅ What's Working:

- **Payment Modal**: Beautiful UI with card input
- **Test Mode**: Safe testing environment
- **Test Cards**: Built-in test card suggestions
- **Payment Processing**: Simulated payment flow
- **Success Handling**: Subscription activation after payment
- **Error Handling**: Proper error messages and recovery

### 🚧 For Production (Future):

- **Real Payment Processing**: Connect to actual Stripe API
- **Backend Integration**: Server-side payment intent creation
- **Webhooks**: Handle payment confirmations
- **Security**: Server-side validation
- **Receipts**: Email confirmations

## 🎯 How It Works

1. **User selects subscription** → Opens payment modal
2. **User enters card details** → Validates with Stripe
3. **Payment processing** → Currently simulated (90% success rate)
4. **Success** → Activates subscription in Firebase
5. **Confirmation** → Shows success message and updates UI

## 🔒 Security Notes

- **Test Mode Only**: No real charges are made
- **Environment Variables**: Keys are stored securely
- **Client-Side Only**: For testing purposes
- **Production Ready**: Structure supports backend integration

## 🐛 Troubleshooting

### Payment Modal Not Opening?

- Check that Stripe keys are set in `.env.local`
- Restart your development server after adding keys

### Card Input Not Working?

- Make sure you're using test card numbers
- Check that the card number is complete (16 digits)

### Payment Always Failing?

- The test implementation has a 10% failure rate for testing
- Try multiple times or check the console logs

## 🚀 Next Steps for Production

1. **Backend API**: Create payment intents server-side
2. **Webhooks**: Handle payment confirmations
3. **Real Cards**: Remove test mode restrictions
4. **Receipts**: Send email confirmations
5. **Subscriptions**: Handle recurring payments

---

**Ready to test!** 🎉

Just add your Stripe test keys to `.env.local` and start testing the payment flow!
