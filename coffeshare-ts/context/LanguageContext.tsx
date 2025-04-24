import React, { createContext, useContext, useState } from "react";

type Language = "ro" | "en";

// Define all possible translation keys
type TranslationKey =
  | "welcome"
  | "subtitle"
  | "login"
  | "register"
  | "email"
  | "password"
  | "forgotPassword"
  | "noAccount"
  | "haveAccount"
  | "myProfile"
  | "totalCoffees"
  | "favoriteCafe"
  | "accountSettings"
  | "logout"
  | "editProfile"
  | "notifications"
  | "privacySecurity"
  | "helpSupport"
  | "language"
  | "selectLanguage"
  | "romanian"
  | "english"
  | "dashboard"
  | "recentActivity"
  | "upcomingEvents"
  | "viewAll"
  | "findCafes"
  | "searchPlaceholder"
  | "scanQR"
  | "scanDescription"
  | "choosePlan"
  | "monthly"
  | "yearly"
  | "mostPopular"
  | "selectPlan"
  | "profile"
  | "privacy"
  | "help"
  | "about"
  | "smartSubscriptions"
  | "smartSubscriptionsDesc"
  | "easyAccess"
  | "easyAccessDesc"
  | "findYourSpot"
  | "findYourSpotDesc"
  | "joinCommunity"
  | "joinCommunityDesc"
  | "getStarted"
  | "renewSubscription"
  | "viewAllCafes"
  | "viewFullHistory"
  | "thisWeeksStats"
  | "totalCoffees"
  | "favoriteCafe"
  | "recommendedCafes"
  | "coffeesLeftToday"
  | "memberSince"
  | "scanQRCode"
  | "scanQRDescription"
  | "scannerArea"
  | "subscriptions"
  | "choosePerfectPlan"
  | "coffees"
  | "perMonth"
  | "selectPlan";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const translations: Record<Language, Record<TranslationKey, string>> = {
  ro: {
    // Auth
    welcome: "Bine ai venit la CoffeeShare",
    subtitle: "Comunitatea ta de cafea",
    login: "Autentificare",
    register: "Înregistrare",
    email: "Email",
    password: "Parolă",
    forgotPassword: "Ai uitat parola?",
    noAccount: "Nu ai cont?",
    haveAccount: "Ai deja cont?",
    getStarted: "Începe",

    // Profile
    myProfile: "Profilul meu",
    totalCoffees: "Total cafele",
    favoriteCafe: "Cafenea preferată",
    accountSettings: "Setări cont",
    logout: "Deconectare",
    profile: "Profil",
    memberSince: "Membru din",

    // Settings
    editProfile: "Editează profilul",
    notifications: "Notificări",
    privacySecurity: "Confidențialitate și securitate",
    helpSupport: "Ajutor și suport",
    language: "Limbă",
    selectLanguage: "Selectează limba",
    romanian: "Română",
    english: "Engleză",
    privacy: "Confidențialitate",
    help: "Ajutor",
    about: "Despre",

    // Dashboard
    dashboard: "Panou de control",
    recentActivity: "Activitate recentă",
    upcomingEvents: "Evenimente viitoare",
    viewAll: "Vezi tot",
    renewSubscription: "Reînnoiește abonamentul",
    viewAllCafes: "Vezi toate cafenelele",
    viewFullHistory: "Vezi istoricul complet",
    thisWeeksStats: "Statistici săptămânale",
    recommendedCafes: "Cafenele recomandate",
    coffeesLeftToday: "cafele rămase astăzi",

    // Map
    findCafes: "Găsește cafenele",
    searchPlaceholder: "Caută cafenele...",

    // QR
    scanQR: "Scanează QR",
    scanDescription:
      "Scanează codul QR al cafenelei pentru a începe o sesiune de cafea",
    scanQRCode: "Scanează codul QR",
    scanQRDescription:
      "Îndreaptă camera spre codul QR al cafenelei pentru a răscumpăra cafeaua",
    scannerArea: "Zonă de scanare",

    // Subscriptions
    choosePlan: "Alege planul perfect pentru nevoile tale de cafea",
    monthly: "Lunar",
    yearly: "Anual",
    mostPopular: "Cel mai popular",
    selectPlan: "Selectează planul",
    subscriptions: "Abonamente",
    choosePerfectPlan: "Alege planul perfect pentru nevoile tale de cafea",
    coffees: "cafele",
    perMonth: "pe lună",

    // Welcome slides
    smartSubscriptions: "Abonamente inteligente",
    smartSubscriptionsDesc:
      "Alege planul perfect - de la Pachet Student la Premium. Obține cafeaua zilnică la cafenelele partenere.",
    easyAccess: "Acces ușor",
    easyAccessDesc:
      "Arată doar codul QR la orice cafenea parteneră. Fără carduri, fără bani, doar momente de cafea fără probleme.",
    findYourSpot: "Găsește locul tău",
    findYourSpotDesc:
      "Descoperă cafenele partenere din apropiere, verifică disponibilitatea în timp real și găsește locul perfect pentru cafea.",
    joinCommunity: "Alătură-te comunității de cafea",
    joinCommunityDesc:
      "Urmărește călătoria ta cu cafea, câștigă recompense și conectează-te cu alți iubitori de cafea.",
  },
  en: {
    // Auth
    welcome: "Welcome to CoffeeShare",
    subtitle: "Your coffee community",
    login: "Login",
    register: "Register",
    email: "Email",
    password: "Password",
    forgotPassword: "Forgot password?",
    noAccount: "Don't have an account?",
    haveAccount: "Already have an account?",
    getStarted: "Get Started",

    // Profile
    myProfile: "My Profile",
    totalCoffees: "Total Coffees",
    favoriteCafe: "Favorite Cafe",
    accountSettings: "Account Settings",
    logout: "Log Out",
    profile: "Profile",
    memberSince: "Member since",

    // Settings
    editProfile: "Edit Profile",
    notifications: "Notifications",
    privacySecurity: "Privacy & Security",
    helpSupport: "Help & Support",
    language: "Language",
    selectLanguage: "Select Language",
    romanian: "Romanian",
    english: "English",
    privacy: "Privacy",
    help: "Help",
    about: "About",

    // Dashboard
    dashboard: "Dashboard",
    recentActivity: "Recent Activity",
    upcomingEvents: "Upcoming Events",
    viewAll: "View All",
    renewSubscription: "Renew Subscription",
    viewAllCafes: "View All Cafes",
    viewFullHistory: "View Full History",
    thisWeeksStats: "This Week's Stats",
    recommendedCafes: "Recommended Cafes",
    coffeesLeftToday: "coffees left today",

    // Map
    findCafes: "Find Cafes",
    searchPlaceholder: "Search cafes...",

    // QR
    scanQR: "Scan QR",
    scanDescription: "Scan the cafe's QR code to start a coffee session",
    scanQRCode: "Scan QR Code",
    scanQRDescription:
      "Point your camera at a cafe's QR code to redeem your coffee",
    scannerArea: "Scanner Area",

    // Subscriptions
    choosePlan: "Choose the perfect plan for your coffee needs",
    monthly: "Monthly",
    yearly: "Yearly",
    mostPopular: "Most Popular",
    selectPlan: "Select Plan",
    subscriptions: "Subscriptions",
    choosePerfectPlan: "Choose the perfect plan for your coffee needs",
    coffees: "coffees",
    perMonth: "per month",

    // Welcome slides
    smartSubscriptions: "Smart Subscriptions",
    smartSubscriptionsDesc:
      "Choose your perfect plan - from Student Pack to Premium. Get your daily coffee fix at partner cafes.",
    easyAccess: "Easy Access",
    easyAccessDesc:
      "Just show your QR code at any partner cafe. No cards, no cash, just seamless coffee moments.",
    findYourSpot: "Find Your Spot",
    findYourSpotDesc:
      "Discover partner cafes nearby, check real-time availability, and find your perfect coffee spot.",
    joinCommunity: "Join the Coffee Community",
    joinCommunityDesc:
      "Track your coffee journey, earn rewards, and connect with fellow coffee lovers.",
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [language, setLanguage] = useState<Language>("ro");

  const t = (key: TranslationKey): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
