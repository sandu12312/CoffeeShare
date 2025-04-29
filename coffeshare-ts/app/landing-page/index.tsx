import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  Platform,
  useWindowDimensions,
  TextInput,
  Alert,
  Linking,
  ActivityIndicator,
  ImageStyle,
  TextStyle,
  ViewStyle,
} from "react-native";
import { Stack, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useFirebase } from "../../context/FirebaseContext";

export default function LandingPage() {
  const { width, height } = useWindowDimensions();
  const isMobile = width < 768;
  const [showMobileNav, setShowMobileNav] = useState(false);
  const { submitPartnershipRequest } = useFirebase();

  // --- Form State ---
  const [businessName, setBusinessName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [message, setMessage] = useState("");
  const [formStatus, setFormStatus] = useState<{
    message: string;
    type: "success" | "error" | "";
  }>({ message: "", type: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (Platform.OS !== "web") {
      router.replace("/(auth)/welcome");
    }
  }, []);

  if (Platform.OS !== "web") {
    return null;
  }

  const handleGetStarted = () => {
    router.push("/(auth)/register");
  };

  const handleAppStoreLink = () => {
    // Replace with your actual App Store link
    Linking.openURL("https://apps.apple.com/your-app-link");
  };

  const handleGooglePlayLink = () => {
    // Replace with your actual Google Play link
    Linking.openURL(
      "https://play.google.com/store/apps/details?id=your.package.name"
    );
  };

  const handleFormSubmit = async () => {
    // Basic validation
    if (!businessName || !contactName || !email) {
      setFormStatus({
        message: "Please fill in all required fields (*).",
        type: "error",
      });
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setFormStatus({
        message: "Please enter a valid email address.",
        type: "error",
      });
      return;
    }

    setIsSubmitting(true);
    setFormStatus({ message: "Submitting your request...", type: "" });

    try {
      console.log("Submitting partnership request with data:", {
        businessName,
        contactName,
        email,
        phone,
        address,
        message,
      });

      const result = await submitPartnershipRequest({
        businessName,
        contactName,
        email,
        phone,
        address,
        message,
      });

      console.log("Partnership request submitted successfully:", result);

      // Success message
      setFormStatus({
        message:
          "Thank you! Your partnership request has been submitted successfully.",
        type: "success",
      });

      // Reset form
      setBusinessName("");
      setContactName("");
      setEmail("");
      setPhone("");
      setAddress("");
      setMessage("");
    } catch (error) {
      console.error("Error submitting form:", error);

      // Provide more specific error message to the user
      let errorMessage = "Submission failed. Please try again.";

      if (error instanceof Error) {
        if (error.message === "Missing required fields") {
          errorMessage = "Please fill in all required fields.";
        } else if (error.message.includes("permission-denied")) {
          errorMessage =
            "You don't have permission to submit this form. Please contact support.";
        } else if (error.message.includes("network")) {
          errorMessage =
            "Network error. Please check your internet connection and try again.";
        }
      }

      setFormStatus({
        message: errorMessage,
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper for rendering navigation links (reduces repetition)
  const renderNavLinks = () => (
    <>
      <TouchableOpacity onPress={() => router.push("/#how-it-works")}>
        <Text style={styles.navLinkText}>How It Works</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.push("/#features")}>
        <Text style={styles.navLinkText}>Features</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.push("/#partners")}>
        <Text style={styles.navLinkText}>For Partners</Text>
      </TouchableOpacity>
    </>
  );

  return (
    <View style={styles.baseContainer}>
      <StatusBar style="dark" />
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.mainHeader}>
        <View style={styles.container}>
          <View style={styles.mainNav}>
            <TouchableOpacity onPress={() => router.push("/landing-page")}>
              <Text style={styles.logo}>CoffeeShare</Text>
            </TouchableOpacity>

            {/* Desktop Nav */}
            {!isMobile && (
              <View style={styles.desktopNavLinks}>
                {renderNavLinks()}
                <TouchableOpacity
                  style={styles.navButton}
                  onPress={() => router.push("/#contact-form")}
                >
                  <Text style={styles.navButtonText}>Become a Partner</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Mobile Nav Toggle */}
            {isMobile && (
              <TouchableOpacity
                style={styles.mobileNavToggle}
                onPress={() => setShowMobileNav(!showMobileNav)}
              >
                <Ionicons
                  name={showMobileNav ? "close" : "menu"}
                  size={32}
                  color="var(--primary-color)"
                />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* Mobile Nav Menu */}
      {isMobile && showMobileNav && (
        <View style={styles.mobileNavMenu}>
          {renderNavLinks()}
          <TouchableOpacity
            style={[styles.navButton, { marginTop: 20 }]}
            onPress={() => {
              router.push("/#contact-form");
              setShowMobileNav(false);
            }}
          >
            <Text style={styles.navButtonText}>Become a Partner</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView style={styles.scrollView}>
        {/* Hero Section */}
        <View style={[styles.heroSection, { minHeight: height }]}>
          <View style={styles.heroBackground}>
            <View
              style={{
                width: "100%",
                height: "100%",
                backgroundColor: "#6f4e37",
              }}
            />
            <View style={styles.heroOverlay} />
          </View>
          <View style={[styles.container, styles.heroContent]}>
            <Text style={styles.heroTitle}>
              Unlock Your City's Coffee Scene.
            </Text>
            <Text style={styles.heroSubtitle}>
              One subscription, endless local coffee experiences. Discover, sip,
              and enjoy.
            </Text>
            <View style={styles.heroCta}>
              <TouchableOpacity
                style={[styles.ctaButton, styles.primaryButton]}
                onPress={handleAppStoreLink}
              >
                <Text style={styles.primaryButtonText}>Download the App</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.ctaButton, styles.secondaryButton]}
                onPress={() => router.push("/#how-it-works")}
              >
                <Text style={styles.secondaryButtonText}>Learn More</Text>
              </TouchableOpacity>
            </View>
          </View>
          {/* Scroll Indicator (Optional) */}
          <View style={styles.heroScrollIndicator}>
            <Text style={styles.scrollIndicatorText}>Scroll Down</Text>
            <Ionicons name="arrow-down" size={24} color="var(--text-light)" />
          </View>
        </View>

        {/* How It Works Section */}
        <View id="how-it-works" style={styles.section}>
          <View style={styles.container}>
            <Text style={styles.sectionHeading}>
              Your Coffee Journey in 4 Simple Steps
            </Text>
            <View style={styles.stepsContainer}>
              <View style={styles.step}>
                <View style={styles.stepIconContainer}>
                  <View style={styles.stepIconWrapper}>
                    <View
                      style={{
                        width: 35,
                        height: 35,
                        borderRadius: 17.5,
                        backgroundColor: "#e8d5c4",
                      }}
                    />
                  </View>
                </View>
                <Text style={styles.stepTitle}>1. Sign Up</Text>
                <Text style={styles.stepDescription}>
                  Create your free CoffeeShare account in seconds.
                </Text>
              </View>
              <View style={styles.step}>
                <View style={styles.stepIconContainer}>
                  <View style={styles.stepIconWrapper}>
                    <View
                      style={{
                        width: 400,
                        height: 400,
                        maxWidth: "100%",
                        maxHeight: 400,
                        borderRadius: 8,
                        backgroundColor: "#e8d5c4",
                      }}
                    />
                  </View>
                </View>
                <Text style={styles.stepTitle}>2. Subscribe</Text>
                <Text style={styles.stepDescription}>
                  Choose a plan that perfectly fits your coffee cravings.
                </Text>
              </View>
              <View style={styles.step}>
                <View style={styles.stepIconContainer}>
                  <View style={styles.stepIconWrapper}>
                    <View
                      style={{
                        width: 400,
                        height: 400,
                        maxWidth: "100%",
                        maxHeight: 400,
                        borderRadius: 8,
                        backgroundColor: "#e8d5c4",
                      }}
                    />
                  </View>
                </View>
                <Text style={styles.stepTitle}>3. Explore & Visit</Text>
                <Text style={styles.stepDescription}>
                  Discover amazing local cafes on our interactive map.
                </Text>
              </View>
              <View style={styles.step}>
                <View style={styles.stepIconContainer}>
                  <View style={styles.stepIconWrapper}>
                    <View
                      style={{
                        width: 35,
                        height: 35,
                        borderRadius: 17.5,
                        backgroundColor: "#e8d5c4",
                      }}
                    />
                  </View>
                </View>
                <Text style={styles.stepTitle}>4. Scan & Sip</Text>
                <Text style={styles.stepDescription}>
                  Generate your QR code and enjoy your delicious coffee!
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Features Section */}
        <View id="features" style={[styles.section, styles.sectionWhite]}>
          <View style={styles.container}>
            <Text style={styles.sectionHeading}>
              Everything You Need for Your Coffee Adventures
            </Text>

            {/* Feature 1 */}
            <View style={styles.featureHighlight}>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>Discover Hidden Gems</Text>
                <Text style={styles.featureDescription}>
                  Our interactive map doesn't just show cafes; it reveals
                  details, ratings, opening hours, and helps you navigate to
                  your next favorite spot. Filter by distance, rating, or
                  amenities.
                </Text>
                <TouchableOpacity onPress={handleAppStoreLink}>
                  <Text style={styles.textLink}>Get the App →</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.featureImageContainer}>
                <View style={styles.featureImageWrapper}>
                  <View
                    style={{
                      width: 400,
                      height: 400,
                      maxWidth: "100%",
                      maxHeight: 400,
                      borderRadius: 8,
                      backgroundColor: "#e8d5c4",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ color: "#6f4e37", fontSize: 16 }}>
                      Map Feature Image
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Feature 2 */}
            <View style={[styles.featureHighlight, styles.featureReverse]}>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>
                  Subscriptions Made Simple
                </Text>
                <Text style={styles.featureDescription}>
                  Choose from flexible plans like Student, Elite, or Premium.
                  Manage your subscription, track usage, and upgrade or
                  downgrade anytime, right from the app.
                </Text>
                <TouchableOpacity onPress={handleAppStoreLink}>
                  <Text style={styles.textLink}>See Plans in App →</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.featureImageContainer}>
                <View style={styles.featureImageWrapper}>
                  <View
                    style={{
                      width: 400,
                      height: 400,
                      maxWidth: "100%",
                      maxHeight: 400,
                      borderRadius: 8,
                      backgroundColor: "#e8d5c4",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ color: "#6f4e37", fontSize: 16 }}>
                      Subscription Feature Image
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Feature 3 */}
            <View style={styles.featureHighlight}>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>Seamless Cafe Check-ins</Text>
                <Text style={styles.featureDescription}>
                  No more fumbling for loyalty cards. Generate a unique, secure
                  QR code instantly when you're ready to order. The barista
                  scans it, and you're good to go!
                </Text>
                <TouchableOpacity onPress={handleAppStoreLink}>
                  <Text style={styles.textLink}>
                    Experience Easy Check-ins →
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={styles.featureImageContainer}>
                <View style={styles.featureImageWrapper}>
                  <View
                    style={{
                      width: 400,
                      height: 400,
                      maxWidth: "100%",
                      maxHeight: 400,
                      borderRadius: 8,
                      backgroundColor: "#e8d5c4",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ color: "#6f4e37", fontSize: 16 }}>
                      QR Code Feature Image
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* App Download Section */}
        <View
          id="app-download"
          style={[styles.section, styles.appDownloadSection]}
        >
          <View style={styles.container}>
            <Text style={styles.appDownloadTitle}>
              Ready to Start Exploring?
            </Text>
            <Text style={styles.appDownloadSubtitle}>
              Download the CoffeeShare app today and begin your journey.
            </Text>
            <View style={styles.appDownloadButtonsLarge}>
              <TouchableOpacity
                style={styles.appButton}
                onPress={handleAppStoreLink}
              >
                <Ionicons
                  name="logo-apple"
                  size={24}
                  color="var(--text-color)"
                  style={{ marginRight: 10 }}
                />
                <View>
                  <Text style={styles.appButtonText}>Download on the</Text>
                  <Text style={styles.appButtonStoreName}>App Store</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.appButton}
                onPress={handleGooglePlayLink}
              >
                <Ionicons
                  name="logo-google-playstore"
                  size={24}
                  color="var(--text-color)"
                  style={{ marginRight: 10 }}
                />
                <View>
                  <Text style={styles.appButtonText}>Get it on</Text>
                  <Text style={styles.appButtonStoreName}>Google Play</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* For Partners Section */}
        <View id="partners" style={[styles.section, styles.sectionWhite]}>
          <View style={styles.container}>
            <View style={styles.partnerContent}>
              <View style={styles.partnerText}>
                <Text style={[styles.sectionHeading, { textAlign: "left" }]}>
                  Grow Your Cafe with CoffeeShare
                </Text>
                <Text style={styles.partnerDescription}>
                  Join our curated network of local cafes and connect with a
                  passionate community of coffee lovers. We provide the tools
                  and the audience; you provide the amazing coffee.
                </Text>
                <View style={styles.partnerList}>
                  <Text style={styles.partnerListItem}>
                    • Increase visibility and attract loyal customers.
                  </Text>
                  <Text style={styles.partnerListItem}>
                    • Boost foot traffic during all hours.
                  </Text>
                  <Text style={styles.partnerListItem}>
                    • Simple QR code scanning – no complex hardware needed.
                  </Text>
                  <Text style={styles.partnerListItem}>
                    • Gain insights into customer visits and preferences.
                  </Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.ctaButton,
                    styles.primaryButton,
                    { alignSelf: isMobile ? "center" : "flex-start" },
                  ]}
                  onPress={() => router.push("/#contact-form")}
                >
                  <Text style={styles.primaryButtonText}>Become a Partner</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.partnerImageContainer}>
                <View style={styles.partnerImageWrapper}>
                  <View
                    style={{
                      width: 500,
                      height: 450,
                      maxWidth: "100%",
                      maxHeight: 450,
                      borderRadius: 8,
                      backgroundColor: "#e8d5c4",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ color: "#6f4e37", fontSize: 16 }}>
                      Partner Cafe Image
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Partner Contact Form Section */}
        <View
          id="contact-form"
          style={[styles.section, styles.contactFormSection]}
        >
          <View style={styles.container}>
            <Text style={styles.sectionHeading}>
              Let's Brew Something Great Together
            </Text>
            <Text style={styles.contactSubtitle}>
              Interested in becoming a CoffeePartner? Fill out the form, and
              we'll be in touch!
            </Text>
            <View style={styles.formContainer}>
              {/* Form fields */}
              <View style={isMobile ? styles.formColumn : styles.formRow}>
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>
                    Business / Cafe Name{" "}
                    <Text style={styles.requiredStar}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.textInput}
                    value={businessName}
                    onChangeText={setBusinessName}
                    placeholder="Your Cafe Name"
                    placeholderTextColor="#999"
                  />
                </View>
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>
                    Contact Person Name{" "}
                    <Text style={styles.requiredStar}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.textInput}
                    value={contactName}
                    onChangeText={setContactName}
                    placeholder="Your Name"
                    placeholderTextColor="#999"
                  />
                </View>
              </View>
              <View style={isMobile ? styles.formColumn : styles.formRow}>
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>
                    Email Address <Text style={styles.requiredStar}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.textInput}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="your.email@example.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholderTextColor="#999"
                  />
                </View>
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Phone Number</Text>
                  <TextInput
                    style={styles.textInput}
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="(Optional)"
                    keyboardType="phone-pad"
                    placeholderTextColor="#999"
                  />
                </View>
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Business Address</Text>
                <TextInput
                  style={styles.textInput}
                  value={address}
                  onChangeText={setAddress}
                  placeholder="(Optional)"
                  placeholderTextColor="#999"
                />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>
                  Tell us about your cafe (Optional)
                </Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  value={message}
                  onChangeText={setMessage}
                  placeholder="Specialties, opening hours, etc."
                  multiline={true}
                  numberOfLines={4}
                  placeholderTextColor="#999"
                />
              </View>

              {/* Form Status */}
              {formStatus.message ? (
                <Text
                  style={[
                    styles.formStatus,
                    formStatus.type === "error"
                      ? styles.formStatusError
                      : styles.formStatusSuccess,
                  ]}
                >
                  {formStatus.message}
                </Text>
              ) : (
                <View style={styles.formStatusPlaceholder} />
              )}

              {/* Submit Button */}
              <TouchableOpacity
                style={[
                  styles.ctaButton,
                  styles.primaryButton,
                  styles.submitButton,
                ]}
                onPress={handleFormSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="var(--text-light)" />
                ) : (
                  <Text style={styles.primaryButtonText}>
                    Submit Partnership Request
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.mainFooter}>
          <View style={styles.container}>
            <View style={styles.footerContent}>
              {/* Footer About */}
              <View style={styles.footerColumn}>
                <Text style={styles.footerTitle}>CoffeeShare</Text>
                <Text style={styles.footerText}>
                  Connecting coffee lovers with local cafes through simple,
                  flexible subscriptions.
                </Text>
                <View style={styles.socialLinks}>
                  {/* Replace with actual links */}
                  <TouchableOpacity
                    onPress={() => Linking.openURL("https://facebook.com")}
                  >
                    <Ionicons
                      name="logo-facebook"
                      size={24}
                      color="var(--text-light)"
                      style={styles.socialIcon}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => Linking.openURL("https://instagram.com")}
                  >
                    <Ionicons
                      name="logo-instagram"
                      size={24}
                      color="var(--text-light)"
                      style={styles.socialIcon}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => Linking.openURL("https://twitter.com")}
                  >
                    <Ionicons
                      name="logo-twitter"
                      size={24}
                      color="var(--text-light)"
                      style={styles.socialIcon}
                    />
                  </TouchableOpacity>
                </View>
              </View>
              {/* Footer Quick Links */}
              <View style={styles.footerColumn}>
                <Text style={styles.footerHeading}>Quick Links</Text>
                <TouchableOpacity onPress={() => router.push("/#how-it-works")}>
                  <Text style={styles.footerLink}>How It Works</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => router.push("/#features")}>
                  <Text style={styles.footerLink}>Features</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => router.push("/#partners")}>
                  <Text style={styles.footerLink}>For Partners</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    /* Link to Privacy Policy */
                  }}
                >
                  <Text style={styles.footerLink}>Privacy Policy</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    /* Link to Terms */
                  }}
                >
                  <Text style={styles.footerLink}>Terms of Service</Text>
                </TouchableOpacity>
              </View>
              {/* Footer Contact */}
              <View style={styles.footerColumn}>
                <Text style={styles.footerHeading}>Contact Us</Text>
                <Text style={styles.footerText}>Have questions?</Text>
                <TouchableOpacity
                  onPress={() =>
                    Linking.openURL("mailto:hello@coffeeshare.example.com")
                  }
                >
                  <Text style={styles.footerLink}>
                    hello@coffeeshare.example.com
                  </Text>
                </TouchableOpacity>
                <Text style={[styles.footerText, { marginTop: 10 }]}>
                  Partnerships:
                </Text>
                <TouchableOpacity
                  onPress={() =>
                    Linking.openURL("mailto:partners@coffeeshare.example.com")
                  }
                >
                  <Text style={styles.footerLink}>
                    partners@coffeeshare.example.com
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.footerBottom}>
              <Text style={styles.footerCopyright}>
                © {new Date().getFullYear()} CoffeeShare. Designed with ❤️.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  baseContainer: {
    flex: 1,
    backgroundColor: "var(--background-light, #f8f5f2)",
    color: "var(--text-color, #333)",
    fontFamily: "'Poppins', sans-serif",
  },
  container: {
    width: "100%",
    maxWidth: 1200,
    marginHorizontal: "auto",
    paddingHorizontal: 20,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    paddingVertical: 80,
    width: "100%",
  },
  sectionWhite: {
    backgroundColor: "var(--background-white, #fff)",
  },
  sectionHeading: {
    fontSize: 32,
    fontWeight: "700",
    fontFamily: "'Playfair Display', serif",
    color: "var(--primary-color, #6f4e37)",
    marginBottom: 32,
    textAlign: "center",
  },
  mainHeader: {
    top: 0,
    left: 0,
    width: "100%",
    zIndex: 1000,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
    height: 80,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  mainNav: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    height: "100%",
  },
  logo: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 28,
    fontWeight: "700",
    color: "var(--primary-color, #6f4e37)",
  },
  desktopNavLinks: {
    flexDirection: "row",
    alignItems: "center",
    gap: 32,
  },
  navLinkText: {
    fontWeight: "600",
    color: "var(--text-color, #333)",
    paddingVertical: 5,
    fontSize: 16,
  },
  navButton: {
    backgroundColor: "var(--primary-color, #6f4e37)",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  navButtonText: {
    color: "var(--text-light, #fff)",
    fontWeight: "600",
    fontSize: 16,
  },
  mobileNavToggle: {
    padding: 10,
  },
  mobileNavMenu: {
    position: "absolute",
    top: 80,
    left: 0,
    width: "100%",
    backgroundColor: "var(--background-white, #fff)",
    padding: 20,
    boxShadow: "0 5px 10px rgba(0,0,0,0.1)",
    zIndex: 999,
    alignItems: "center",
    gap: 20,
  },
  heroSection: {
    position: "relative",
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    color: "var(--text-light, #fff)",
    overflow: "hidden",
  },
  heroBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
  heroOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  heroContent: {
    zIndex: 1,
    alignItems: "center",
  },
  heroTitle: {
    color: "var(--text-light, #fff)",
    fontFamily: "'Playfair Display', serif",
    fontSize: 48,
    fontWeight: "700",
    marginBottom: 24,
    textAlign: "center",
  },
  heroSubtitle: {
    fontSize: 20,
    maxWidth: 600,
    marginHorizontal: "auto",
    marginBottom: 32,
    opacity: 0.9,
    color: "var(--text-light, #fff)",
    lineHeight: 28,
    textAlign: "center",
  },
  heroCta: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    flexWrap: "wrap",
  },
  ctaButton: {
    paddingVertical: 15,
    paddingHorizontal: 35,
    borderRadius: 50,
    fontWeight: "600",
    fontSize: 16,
    borderWidth: 2,
    borderColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButton: {
    backgroundColor: "var(--primary-color, #6f4e37)",
    borderColor: "var(--primary-color, #6f4e37)",
  },
  primaryButtonText: {
    color: "var(--text-light, #fff)",
    fontWeight: "600",
    fontSize: 16,
  },
  secondaryButton: {
    backgroundColor: "transparent",
    borderColor: "var(--text-light, #fff)",
  },
  secondaryButtonText: {
    color: "var(--text-light, #fff)",
    fontWeight: "600",
    fontSize: 16,
  },
  heroScrollIndicator: {
    position: "absolute",
    bottom: 30,
    left: "50%",
    transform: [{ translateX: "-50%" }],
    alignItems: "center",
    opacity: 0.8,
  },
  scrollIndicatorText: {
    fontSize: 12,
    marginBottom: 5,
    textTransform: "uppercase",
    letterSpacing: 1,
    color: "var(--text-light, #fff)",
  },
  stepsContainer: {
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 48,
    marginTop: 48,
    justifyContent: "center",
  },
  step: {
    backgroundColor: "var(--background-light, #f8f5f2)",
    padding: 32,
    borderRadius: 8,
    boxShadow: "0 5px 15px rgba(0,0,0,0.1)",
    textAlign: "center",
    width: 250,
    alignItems: "center",
  },
  stepIconContainer: {
    width: 70,
    height: 70,
    marginBottom: 24,
    backgroundColor: "var(--accent-color, #e8d5c4)",
    borderRadius: 35,
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 5px 15px rgba(0,0,0,0.1)",
  },
  stepIconWrapper: {
    // Styles for layout within container if needed
  },
  stepTitle: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 24,
    color: "var(--secondary-color, #a0522d)",
    fontWeight: "700",
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 16,
    color: "var(--text-color, #333)",
    lineHeight: 24,
  },
  featureHighlight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 64,
    marginBottom: 80,
    flexWrap: "wrap",
  },
  featureReverse: {
    flexDirection: "row-reverse",
  },
  featureText: {
    flex: 1,
    minWidth: 300,
  },
  featureTitle: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 28,
    color: "var(--primary-color, #6f4e37)",
    fontWeight: "700",
    marginBottom: 16,
  },
  featureDescription: {
    fontSize: 16,
    color: "var(--text-color, #333)",
    lineHeight: 26,
    marginBottom: 24,
    maxWidth: 500,
  },
  textLink: {
    fontWeight: "600",
    color: "var(--primary-color, #6f4e37)",
    fontSize: 16,
  },
  featureImageContainer: {
    flex: 1,
    minWidth: 300,
    alignItems: "center",
  },
  featureImageWrapper: {
    borderRadius: 8,
    boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
  },
  appDownloadSection: {
    backgroundColor: "var(--primary-color, #6f4e37)",
    textAlign: "center",
  },
  appDownloadTitle: {
    fontSize: 32,
    fontWeight: "700",
    fontFamily: "'Playfair Display', serif",
    color: "var(--text-light, #fff)",
    marginBottom: 16,
    textAlign: "center",
  },
  appDownloadSubtitle: {
    fontSize: 18,
    color: "var(--text-light, #fff)",
    opacity: 0.9,
    marginBottom: 32,
    textAlign: "center",
  },
  appDownloadButtonsLarge: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 32,
    marginTop: 32,
    flexWrap: "wrap",
  },
  appButton: {
    backgroundColor: "var(--background-white, #fff)",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    boxShadow: "0 5px 15px rgba(0,0,0,0.1)",
  },
  appButtonText: {
    color: "var(--text-color, #333)",
    fontSize: 14,
  },
  appButtonStoreName: {
    color: "var(--text-color, #333)",
    fontWeight: "600",
    fontSize: 16,
  },
  partnerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 64,
    flexWrap: "wrap",
  },
  partnerText: {
    flex: 1,
    minWidth: 300,
  },
  partnerDescription: {
    fontSize: 16,
    lineHeight: 26,
    marginBottom: 24,
    color: "var(--text-color, #333)",
  },
  partnerList: {
    marginLeft: 0,
    marginBottom: 32,
  },
  partnerListItem: {
    marginBottom: 12,
    fontSize: 16,
    color: "var(--text-color, #333)",
  },
  partnerImageContainer: {
    flex: 1,
    minWidth: 300,
    alignItems: "center",
  },
  partnerImageWrapper: {
    borderRadius: 8,
    boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
  },
  contactFormSection: {
    backgroundColor: "var(--accent-color, #e8d5c4)",
    paddingBottom: 100,
  },
  contactSubtitle: {
    textAlign: "center",
    fontSize: 16,
    color: "var(--text-color, #333)",
    marginBottom: 48,
  },
  formContainer: {
    maxWidth: 800,
    marginHorizontal: "auto",
    backgroundColor: "var(--background-white, #fff)",
    padding: 48,
    borderRadius: 8,
    boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
  },
  formRow: {
    flexDirection: "row",
    gap: 32,
    marginBottom: 24,
  },
  formColumn: {
    flexDirection: "column",
    gap: 24,
    marginBottom: 24,
  },
  formGroup: {
    flex: 1,
  },
  formLabel: {
    fontWeight: "600",
    color: "var(--primary-color, #6f4e37)",
    marginBottom: 8,
    fontSize: 14,
  },
  requiredStar: {
    color: "var(--error-color, #dc3545)",
  },
  textInput: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: "var(--border-color, #ddd)",
    borderRadius: 8,
    fontSize: 16,
    fontFamily: "'Poppins', sans-serif",
    backgroundColor: "#fff",
    color: "var(--text-color, #333)",
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  formStatus: {
    textAlign: "center",
    marginTop: 24,
    fontWeight: "600",
    minHeight: 20,
    fontSize: 15,
  },
  formStatusPlaceholder: {
    minHeight: 20,
    marginTop: 24,
  },
  formStatusSuccess: {
    color: "var(--success-color, #28a745)",
  },
  formStatusError: {
    color: "var(--error-color, #dc3545)",
  },
  submitButton: {
    marginTop: 24,
    alignSelf: "center",
    minWidth: 250,
  },
  mainFooter: {
    backgroundColor: "var(--primary-color, #6f4e37)",
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  footerContent: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 32,
    marginBottom: 48,
  },
  footerColumn: {
    minWidth: 220,
    flex: 1,
  },
  footerTitle: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 24,
    fontWeight: "700",
    color: "var(--text-light, #fff)",
    marginBottom: 16,
  },
  footerHeading: {
    fontSize: 18,
    fontWeight: "600",
    color: "var(--text-light, #fff)",
    marginBottom: 16,
  },
  footerText: {
    opacity: 0.8,
    marginBottom: 16,
    color: "var(--text-light, #fff)",
    fontSize: 15,
    lineHeight: 22,
  },
  socialLinks: {
    flexDirection: "row",
    gap: 16,
    marginTop: 8,
  },
  socialIcon: {
    opacity: 0.8,
  },
  footerLink: {
    color: "var(--text-light, #fff)",
    opacity: 0.8,
    marginBottom: 12,
    fontSize: 15,
  },
  footerBottom: {
    textAlign: "center",
    paddingTop: 32,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.2)",
    marginTop: 16,
  },
  footerCopyright: {
    opacity: 0.7,
    fontSize: 14,
    color: "var(--text-light, #fff)",
  },
});
