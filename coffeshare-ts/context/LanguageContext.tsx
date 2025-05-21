import React, { createContext, useContext, useState } from "react";

type Language = "ro" | "en";

// Define și EXPORTĂ all possible translation keys
export type TranslationKey =
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
  | "selectPlan"
  | "popular"
  | "select"
  // Added for Login Screen
  | "login.welcomeBack"
  | "login.signInToContinue"
  | "login.forgotPasswordLink"
  | "login.loginButton"
  | "login.noAccountPrompt"
  | "login.registerLink"
  | "login.missingCredentials"
  | "login.emailNotVerifiedTitle"
  | "login.emailNotVerifiedMessage"
  | "login.verificationEmailSentTitle"
  | "login.verificationEmailSentMessage"
  | "login.sendVerificationEmailError"
  | "login.loginErrorTitle"
  | "login.loginFailedDefault"
  | "login.invalidCredentialsError"
  | "login.userNotFoundError"
  | "login.wrongPasswordError"
  | "login.tooManyRequestsError"
  | "login.googleSignInErrorTitle"
  | "login.googleSignInFailed"
  // Added common keys
  | "common.error"
  | "common.sendEmail"
  | "common.cancel"
  | "common.emailPlaceholder"
  | "common.passwordPlaceholder"
  | "common.orDivider"
  // Added for Register Screen
  | "register.createAccountTitle"
  | "register.joinCommunitySubtitle"
  | "register.fullNamePlaceholder"
  | "register.confirmPasswordPlaceholder"
  | "register.registerButton"
  | "register.creatingAccountLoading"
  | "register.alreadyHaveAccountPrompt"
  | "register.loginLink"
  | "register.fillAllFieldsError"
  | "register.passwordsMismatchError"
  | "register.passwordTooShortError"
  | "register.verificationEmailSentTitle"
  | "register.verificationEmailSentMessage"
  | "register.registrationSuccessfulTitle"
  | "register.registrationSuccessfulMessage"
  | "register.registrationErrorTitle"
  | "register.registrationFailedDefault"
  | "register.emailInUseError"
  | "register.invalidEmailError"
  | "register.weakPasswordError"
  // Added common keys from Register
  | "common.ok"
  | "common.continue"
  | "common.appName"
  | "common.goBack"
  // Added for Forgot Password Screen
  | "forgotPassword.title"
  | "forgotPassword.subtitleInitial"
  | "forgotPassword.subtitleSubmitted"
  | "forgotPassword.resetButton"
  | "forgotPassword.successMessage"
  | "forgotPassword.rememberPasswordPrompt"
  | "forgotPassword.backToLoginLink"
  | "forgotPassword.enterEmailError"
  | "forgotPassword.errorTitle"
  | "forgotPassword.failedToSendDefault"
  | "forgotPassword.userNotFoundError"
  | "forgotPassword.invalidEmailError"
  // Added for Dashboard Screen
  | "dashboard.welcomeMessage"
  | "dashboard.loadingData"
  | "dashboard.logoutError"
  | "dashboard.noSubscription"
  | "dashboard.subscriptionExpiresN/A"
  | "dashboard.noRecentActivity"
  | "dashboard.getActivityPrompt"
  | "dashboard.noFavoriteCafe"
  | "dashboard.defaultCafeName"
  | "dashboard.logoutButton"
  // Keys for component titles (even if components aren't translated yet)
  | "dashboard.recommendedCafesTitle"
  | "dashboard.recentActivityTitle"
  | "dashboard.quickStatsTitle"
  // Keys for component actions (even if components aren't translated yet)
  | "dashboard.viewAll"
  | "dashboard.renewSubscription"
  // Added fallback key from Dashboard
  | "profile.coffeeLover"
  // Added for Map Screen
  | "map.searchPlaceholder"
  | "map.filterAlertTitle"
  | "map.filterAlertMessage"
  | "map.loading"
  | "map.unnamedCafe"
  | "map.noAddress"
  | "map.locationPermissionDenied"
  | "map.locationFetchError"
  | "map.cafesFetchError"
  | "map.noResultsFound"
  | "map.noCafesNearby"
  | "map.viewDetails"
  // Added for Profile Screen
  | "profile.loading"
  | "profile.initialPlaceholder"
  | "profile.subscriptionTitle"
  | "profile.recentActivityTitle"
  | "profile.planLabel"
  | "profile.statusLabel"
  | "profile.dailyLimitLabel"
  | "profile.expiresLabel"
  | "profile.statusActive"
  | "profile.statusInactive"
  | "profile.noSubscriptionPlan"
  | "profile.coffeesCount"
  | "profile.noRecentActivity"
  | "profile.activityCoffeeRedemption"
  | "profile.activityLogin"
  | "profile.activityLogout"
  | "profile.activityProfileUpdate"
  | "profile.activitySubscriptionPurchase"
  | "profile.activitySubscriptionRenewal"
  | "profile.activityDefault"
  // Added for Subscriptions Screen
  | "subscriptions.perPeriod"
  // Added for Edit Profile Screen
  | "editProfile.formPlaceholder"
  // Added for Notifications Screen
  | "notifications.settingsPlaceholder"
  // Added for Privacy & Security Screen
  | "privacySecurity.settingsPlaceholder"
  // Added for Help & Support Screen
  | "helpSupport.infoPlaceholder"
  // Added for Scanner Screen
  | "scanner.invalidQrMissingFields"
  | "scanner.invalidQrFormat"
  | "scanner.qrExpired"
  | "scanner.errorVerifying"
  | "scanner.enterValidQrCode"
  | "scanner.checkingPermission"
  | "scanner.noCameraAccess"
  | "scanner.grantPermission"
  | "scanner.enterQrCodeData"
  | "scanner.pasteQrCodeHere"
  | "scanner.positionQrCode"
  | "scanner.enterCodeManually"
  | "scanner.qrSuccessfullyRedeemed"
  | "scanner.processingQrCode"
  // Added for Scanning QR Screen
  | "scanning.loading"
  | "scanning.refreshing"
  | "scanning.refreshIn"
  | "scanning.qrValidityInfo"
  // Added for Coffee Partner Dashboard
  | "cafe.welcomeMessage"
  | "cafe.coffeesServedToday"
  | "cafe.estimatedRevenue"
  | "cafe.newCustomersToday"
  | "cafe.statsForDate"
  | "cafe.realTimeData"
  | "cafe.quickActions"
  | "cafe.scanQRAction"
  | "cafe.viewReportsAction"
  | "cafe.manageProductsAction"
  | "cafe.cafeSettingsAction"
  // Added for Coffee Partner Reports
  | "cafe.loadingReports"
  | "cafe.reportsAndStats"
  | "cafe.periodLastDays"
  | "cafe.totalScans"
  | "cafe.uniqueCustomers"
  | "cafe.peakHour"
  | "cafe.avgScansPerDay"
  | "cafe.scansPerDay"
  | "cafe.coffeeScansChart"
  | "cafe.exportData"
  | "cafe.exportComingSoon"
  | "cafe.indexBuildingTitle"
  | "cafe.indexBuildingMessage";

// Exportă și interfața contextului dacă e necesar în altă parte
export interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey, options?: Record<string, string | number>) => string;
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

    // Login Screen Specific
    "login.welcomeBack": "Bine ai revenit!",
    "login.signInToContinue": "Autentifică-te pentru a continua",
    "login.forgotPasswordLink": "Ai uitat parola?",
    "login.loginButton": "Autentificare",
    "login.noAccountPrompt": "Nu ai cont?",
    "login.registerLink": "Înregistrează-te",
    "login.missingCredentials": "Te rog introdu email și parolă",
    "login.emailNotVerifiedTitle": "Email Neverificat",
    "login.emailNotVerifiedMessage":
      "Te rog verifică-ți emailul înainte de autentificare. Dorești să trimitem un alt email de verificare?",
    "login.verificationEmailSentTitle": "Email de Verificare Trimis",
    "login.verificationEmailSentMessage":
      "Te rog verifică-ți emailul pentru a-ți activa contul.",
    "login.sendVerificationEmailError":
      "Eroare la trimiterea emailului de verificare. Te rog încearcă mai târziu.",
    "login.loginErrorTitle": "Eroare Autentificare",
    "login.loginFailedDefault":
      "Autentificare eșuată. Te rog încearcă din nou.",
    "login.invalidCredentialsError": "Email sau parolă invalidă.",
    "login.userNotFoundError": "Niciun cont găsit cu acest email.",
    "login.wrongPasswordError": "Parolă incorectă.",
    "login.tooManyRequestsError":
      "Prea multe încercări eșuate. Te rog încearcă mai târziu.",
    "login.googleSignInErrorTitle": "Eroare Autentificare Google",
    "login.googleSignInFailed":
      "Autentificare cu Google eșuată. Te rog încearcă din nou.",

    // Common Keys
    "common.error": "Eroare",
    "common.sendEmail": "Trimite Email",
    "common.cancel": "Anulează",
    "common.emailPlaceholder": "Email",
    "common.passwordPlaceholder": "Parolă",
    "common.orDivider": "SAU",
    "common.ok": "OK",
    "common.continue": "Continuă",
    "common.appName": "CoffeeShare",

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
    popular: "Popular",
    select: "Selectează",

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

    // Register Screen Specific
    "register.createAccountTitle": "Creează Cont",
    "register.joinCommunitySubtitle": "Alătură-te comunității noastre de cafea",
    "register.fullNamePlaceholder": "Nume complet",
    "register.confirmPasswordPlaceholder": "Confirmă Parola",
    "register.registerButton": "Înregistrează-te",
    "register.creatingAccountLoading": "Se creează contul...",
    "register.alreadyHaveAccountPrompt": "Ai deja cont?",
    "register.loginLink": "Autentificare",
    "register.fillAllFieldsError": "Te rog completează toate câmpurile",
    "register.passwordsMismatchError": "Parolele nu corespund",
    "register.passwordTooShortError":
      "Parola trebuie să aibă cel puțin 6 caractere",
    "register.verificationEmailSentTitle": "Email de Verificare Trimis",
    "register.verificationEmailSentMessage":
      "Te rog verifică-ți emailul pentru a-ți activa contul înainte de autentificare.",
    "register.registrationSuccessfulTitle": "Înregistrare Reușită",
    "register.registrationSuccessfulMessage":
      "Contul tău a fost creat. Bine ai venit la CoffeeShare!",
    "register.registrationErrorTitle": "Eroare Înregistrare",
    "register.registrationFailedDefault":
      "Crearea contului a eșuat. Te rog încearcă din nou.",
    "register.emailInUseError": "Există deja un cont cu acest email.",
    "register.invalidEmailError": "Te rog introdu o adresă de email validă.",
    "register.weakPasswordError":
      "Parola este prea slabă. Te rog folosește o parolă mai puternică.",

    // Forgot Password Screen Specific
    "forgotPassword.title": "Ai Uitat Parola",
    "forgotPassword.subtitleInitial": "Introdu emailul pentru a reseta parola",
    "forgotPassword.subtitleSubmitted":
      "Verifică emailul pentru instrucțiuni de resetare",
    "forgotPassword.resetButton": "Resetează Parola",
    "forgotPassword.successMessage":
      "Instrucțiunile pentru resetarea parolei au fost trimise pe emailul tău.",
    "forgotPassword.rememberPasswordPrompt": "Ți-ai amintit parola?",
    "forgotPassword.backToLoginLink": "Autentificare",
    "forgotPassword.enterEmailError": "Te rog introdu adresa ta de email",
    "forgotPassword.errorTitle": "Eroare Resetare Parolă",
    "forgotPassword.failedToSendDefault":
      "Trimiterea emailului de resetare a eșuat. Te rog încearcă din nou.",
    "forgotPassword.userNotFoundError":
      "Niciun cont găsit cu această adresă de email.",
    "forgotPassword.invalidEmailError":
      "Te rog introdu o adresă de email validă.",

    // Dashboard Screen Specific
    "dashboard.welcomeMessage": "Bine ai venit, {name}!",
    "dashboard.loadingData": "Se încarcă datele tale...",
    "dashboard.logoutError": "Deconectarea a eșuat. Te rog încearcă din nou.",
    "dashboard.noSubscription": "Fără Abonament",
    "dashboard.subscriptionExpiresN/A": "N/A",
    "dashboard.noRecentActivity": "Nicio activitate recentă",
    "dashboard.getActivityPrompt": "Ia prima ta cafea!",
    "dashboard.noFavoriteCafe": "Niciuna încă",
    "dashboard.defaultCafeName": "Cafenea",
    "dashboard.logoutButton": "Deconectare",
    "dashboard.recommendedCafesTitle": "Cafenele Recomandate",
    "dashboard.recentActivityTitle": "Activitate Recentă",
    "dashboard.quickStatsTitle": "Statistici Rapide",
    "dashboard.viewAll": "Vezi Tot",
    "dashboard.renewSubscription": "Reînnoiește Abonamentul",
    "profile.coffeeLover": "Iubitor de Cafea",

    // Map Screen Specific
    "map.searchPlaceholder": "Caută Cafenele...",
    "map.filterAlertTitle": "Filtru",
    "map.filterAlertMessage":
      "Funcționalitatea de filtrare va fi disponibilă în curând!",
    "map.loading": "Se încarcă harta...",
    "map.unnamedCafe": "Cafenea fără nume",
    "map.noAddress": "Adresă necomunicată",
    "map.locationPermissionDenied":
      "Permisiunea pentru locație refuzată. Poziția utilizatorului nu va fi afișată.",
    "map.locationFetchError":
      "Nu s-a putut obține locația curentă. Poziția utilizatorului nu va fi afișată.",
    "map.cafesFetchError":
      "Cafenelele nu au putut fi încărcate. Te rog reîmprospătează.",
    "map.noResultsFound": 'Nicio cafenea găsită pentru "{searchQuery}"',
    "map.noCafesNearby": "Nicio cafenea activă găsită în apropiere.",
    "map.viewDetails": "Vezi detalii",

    // Profile Screen Specific
    "profile.loading": "Se încarcă profilul...",
    "profile.initialPlaceholder": "U",
    "profile.subscriptionTitle": "Abonamentul Tău",
    "profile.recentActivityTitle": "Activitate Recentă",
    "profile.planLabel": "Plan:",
    "profile.statusLabel": "Status:",
    "profile.dailyLimitLabel": "Limită Zilnică:",
    "profile.expiresLabel": "Expiră:",
    "profile.statusActive": "Activ",
    "profile.statusInactive": "Inactiv",
    "profile.noSubscriptionPlan": "Niciunul",
    "profile.coffeesCount": "{count} cafele",
    "profile.noRecentActivity": "Nicio activitate recentă",
    "profile.activityCoffeeRedemption": "Cafea savurată la {cafeName}",
    "profile.activityLogin": "Autentificat în aplicație",
    "profile.activityLogout": "Deconectat din aplicație",
    "profile.activityProfileUpdate": "Informații profil actualizate",
    "profile.activitySubscriptionPurchase":
      "Abonament {subscriptionType} achiziționat",
    "profile.activitySubscriptionRenewal":
      "Abonament {subscriptionType} reînnoit",
    "profile.activityDefault": "Activitate",

    // Subscriptions Screen Specific
    "subscriptions.perPeriod": "pe {period}",

    // Edit Profile Screen Specific
    "editProfile.formPlaceholder": "Formularul de editare profil va fi aici",

    // Notifications Screen Specific
    "notifications.settingsPlaceholder":
      "Setările pentru notificări vor fi aici",

    // Privacy & Security Screen Specific
    "privacySecurity.settingsPlaceholder":
      "Setările pentru Confidențialitate & Securitate vor fi aici",

    // Help & Support Screen Specific
    "helpSupport.infoPlaceholder":
      "Informațiile pentru Ajutor & Suport vor fi aici",

    // Common additional keys
    "common.goBack": "Înapoi",

    // Scanner Screen Specific
    "scanner.invalidQrMissingFields": "Cod QR invalid: Câmpuri lipsă",
    "scanner.invalidQrFormat": "Format QR invalid. Te rog încearcă din nou.",
    "scanner.qrExpired": "Acest cod QR a expirat",
    "scanner.errorVerifying":
      "Eroare la verificarea codului QR. Te rog încearcă din nou.",
    "scanner.enterValidQrCode": "Te rog introdu date valide pentru codul QR.",
    "scanner.checkingPermission": "Se verifică permisiunea camerei...",
    "scanner.noCameraAccess":
      "Fără acces la cameră. Te rog acordă permisiunea.",
    "scanner.grantPermission": "Acordă Permisiune",
    "scanner.enterQrCodeData": "Introdu Date Cod QR",
    "scanner.pasteQrCodeHere": "Lipește datele codului QR aici",
    "scanner.positionQrCode": "Poziționează codul QR în cadru",
    "scanner.enterCodeManually": "Introdu Codul Manual",
    "scanner.qrSuccessfullyRedeemed": "Cod QR Valorificat cu Succes!",
    "scanner.processingQrCode": "Se procesează Codul QR...",

    // Scanning QR Screen Specific
    "scanning.loading": "Se generează codul QR...",
    "scanning.refreshing": "Se reîmprospătează codul QR...",
    "scanning.refreshIn": "Se reîmprospătează în {seconds} secunde",
    "scanning.qrValidityInfo":
      "Pentru siguranță, codul QR se reîmprospătează automat la fiecare 15 secunde.",

    // Coffee Partner Dashboard Specific
    "cafe.welcomeMessage": "Bine ai venit, {name}!",
    "cafe.coffeesServedToday": "Cafele servite azi",
    "cafe.estimatedRevenue": "Încasări estimate",
    "cafe.newCustomersToday": "Clienți noi azi",
    "cafe.statsForDate": "Statistici pentru data",
    "cafe.realTimeData": "date în timp real",
    "cafe.quickActions": "Acțiuni Rapide",
    "cafe.scanQRAction": "Scanează QR",
    "cafe.viewReportsAction": "Vezi Rapoarte",
    "cafe.manageProductsAction": "Gestionează Produse",
    "cafe.cafeSettingsAction": "Setări Cafenea",

    // Coffee Partner Reports Specific
    "cafe.loadingReports": "Se încarcă rapoartele...",
    "cafe.reportsAndStats": "Rapoarte și Statistici",
    "cafe.periodLastDays": "Perioada: Ultimele {days} zile",
    "cafe.totalScans": "Total Scanări",
    "cafe.uniqueCustomers": "Clienți Unici",
    "cafe.peakHour": "Ora de Vârf",
    "cafe.avgScansPerDay": "Medie Scanări/Zi",
    "cafe.scansPerDay": "Scanări pe Zi (Săptămâna Curentă)",
    "cafe.coffeeScansChart": "Grafic Scanări",
    "cafe.exportData": "Exportă Date",
    "cafe.exportComingSoon": "Funcționalitate de export în curând!",
    "cafe.indexBuildingTitle": "Optimizare în Curs",
    "cafe.indexBuildingMessage":
      "Baza de date este în curs de optimizare. Te rugăm să încerci din nou în câteva minute.",
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

    // Login Screen Specific
    "login.welcomeBack": "Welcome Back!",
    "login.signInToContinue": "Sign in to continue",
    "login.forgotPasswordLink": "Forgot Password?",
    "login.loginButton": "Login",
    "login.noAccountPrompt": "Don't have an account?",
    "login.registerLink": "Register",
    "login.missingCredentials": "Please enter both email and password",
    "login.emailNotVerifiedTitle": "Email Not Verified",
    "login.emailNotVerifiedMessage":
      "Please verify your email before logging in. Would you like us to send another verification email?",
    "login.verificationEmailSentTitle": "Verification Email Sent",
    "login.verificationEmailSentMessage":
      "Please check your email to verify your account.",
    "login.sendVerificationEmailError":
      "Failed to send verification email. Please try again later.",
    "login.loginErrorTitle": "Login Error",
    "login.loginFailedDefault": "Failed to login. Please try again.",
    "login.invalidCredentialsError": "Invalid email or password.",
    "login.userNotFoundError": "No account found with this email.",
    "login.wrongPasswordError": "Incorrect password.",
    "login.tooManyRequestsError":
      "Too many failed login attempts. Please try again later.",
    "login.googleSignInErrorTitle": "Google Sign-In Error",
    "login.googleSignInFailed":
      "Failed to sign in with Google. Please try again.",

    // Common Keys
    "common.error": "Error",
    "common.sendEmail": "Send Email",
    "common.cancel": "Cancel",
    "common.emailPlaceholder": "Email",
    "common.passwordPlaceholder": "Password",
    "common.orDivider": "OR",
    "common.ok": "OK",
    "common.continue": "Continue",
    "common.appName": "CoffeeShare",

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
    popular: "Popular",
    select: "Select",

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

    // Register Screen Specific
    "register.createAccountTitle": "Create Account",
    "register.joinCommunitySubtitle": "Join our coffee community",
    "register.fullNamePlaceholder": "Full Name",
    "register.confirmPasswordPlaceholder": "Confirm Password",
    "register.registerButton": "Register",
    "register.creatingAccountLoading": "Creating Account...",
    "register.alreadyHaveAccountPrompt": "Already have an account?",
    "register.loginLink": "Login",
    "register.fillAllFieldsError": "Please fill in all fields",
    "register.passwordsMismatchError": "Passwords do not match",
    "register.passwordTooShortError":
      "Password must be at least 6 characters long",
    "register.verificationEmailSentTitle": "Verification Email Sent",
    "register.verificationEmailSentMessage":
      "Please check your email to verify your account before logging in.",
    "register.registrationSuccessfulTitle": "Registration Successful",
    "register.registrationSuccessfulMessage":
      "Your account has been created. Welcome to CoffeeShare!",
    "register.registrationErrorTitle": "Registration Error",
    "register.registrationFailedDefault":
      "Failed to create your account. Please try again.",
    "register.emailInUseError": "An account with this email already exists.",
    "register.invalidEmailError": "Please enter a valid email address.",
    "register.weakPasswordError":
      "Password is too weak. Please use a stronger password.",

    // Forgot Password Screen Specific
    "forgotPassword.title": "Forgot Password",
    "forgotPassword.subtitleInitial": "Enter your email to reset your password",
    "forgotPassword.subtitleSubmitted":
      "Check your email for reset instructions",
    "forgotPassword.resetButton": "Reset Password",
    "forgotPassword.successMessage":
      "Password reset instructions have been sent to your email.",
    "forgotPassword.rememberPasswordPrompt": "Remember your password?",
    "forgotPassword.backToLoginLink": "Login",
    "forgotPassword.enterEmailError": "Please enter your email address",
    "forgotPassword.errorTitle": "Password Reset Error",
    "forgotPassword.failedToSendDefault":
      "Failed to send password reset email. Please try again.",
    "forgotPassword.userNotFoundError":
      "No account found with this email address.",
    "forgotPassword.invalidEmailError": "Please enter a valid email address.",

    // Dashboard Screen Specific
    "dashboard.welcomeMessage": "Welcome, {name}!",
    "dashboard.loadingData": "Loading your coffee data...",
    "dashboard.logoutError": "Failed to log out. Please try again.",
    "dashboard.noSubscription": "No Subscription",
    "dashboard.subscriptionExpiresN/A": "N/A",
    "dashboard.noRecentActivity": "No recent activity",
    "dashboard.getActivityPrompt": "Get your first coffee!",
    "dashboard.noFavoriteCafe": "None yet",
    "dashboard.defaultCafeName": "Coffee Shop",
    "dashboard.logoutButton": "Logout",
    "dashboard.recommendedCafesTitle": "Recommended Cafes",
    "dashboard.recentActivityTitle": "Recent Activity",
    "dashboard.quickStatsTitle": "Quick Stats",
    "dashboard.viewAll": "View All",
    "dashboard.renewSubscription": "Renew Subscription",
    "profile.coffeeLover": "Coffee Lover",

    // Map Screen Specific
    "map.searchPlaceholder": "Search Cafes...",
    "map.filterAlertTitle": "Filter",
    "map.filterAlertMessage": "Filter functionality coming soon!",
    "map.loading": "Loading map...",
    "map.unnamedCafe": "Unnamed Cafe",
    "map.noAddress": "No address provided",
    "map.locationPermissionDenied":
      "Permission to access location was denied. User location dot might not show.",
    "map.locationFetchError":
      "Could not get current location. User location dot might not show.",
    "map.cafesFetchError": "Failed to load cafes. Please try refreshing.",
    "map.noResultsFound": 'No cafes found matching "{searchQuery}"',
    "map.noCafesNearby": "No active cafes found nearby.",
    "map.viewDetails": "View details",

    // Profile Screen Specific
    "profile.loading": "Loading profile...",
    "profile.initialPlaceholder": "U",
    "profile.subscriptionTitle": "Your Subscription",
    "profile.recentActivityTitle": "Recent Activity",
    "profile.planLabel": "Plan:",
    "profile.statusLabel": "Status:",
    "profile.dailyLimitLabel": "Daily Limit:",
    "profile.expiresLabel": "Expires:",
    "profile.statusActive": "Active",
    "profile.statusInactive": "Inactive",
    "profile.noSubscriptionPlan": "None",
    "profile.coffeesCount": "{count} coffees",
    "profile.noRecentActivity": "No recent activity",
    "profile.activityCoffeeRedemption": "Enjoyed coffee at {cafeName}",
    "profile.activityLogin": "Logged in to app",
    "profile.activityLogout": "Logged out of app",
    "profile.activityProfileUpdate": "Updated profile information",
    "profile.activitySubscriptionPurchase":
      "Purchased {subscriptionType} subscription",
    "profile.activitySubscriptionRenewal":
      "Renewed {subscriptionType} subscription",
    "profile.activityDefault": "Activity",

    // Subscriptions Screen Specific
    "subscriptions.perPeriod": "per {period}",

    // Edit Profile Screen Specific
    "editProfile.formPlaceholder": "Edit Profile Form Goes Here",

    // Notifications Screen Specific
    "notifications.settingsPlaceholder": "Notification Settings Go Here",

    // Privacy & Security Screen Specific
    "privacySecurity.settingsPlaceholder":
      "Privacy & Security Settings Go Here",

    // Help & Support Screen Specific
    "helpSupport.infoPlaceholder": "Help & Support Information Goes Here",

    // Common additional keys
    "common.goBack": "Go Back",

    // Scanner Screen Specific
    "scanner.invalidQrMissingFields":
      "Invalid QR Code: Missing required fields",
    "scanner.invalidQrFormat": "Invalid QR format. Please try again.",
    "scanner.qrExpired": "This QR code has expired",
    "scanner.errorVerifying": "Error verifying QR code. Please try again.",
    "scanner.enterValidQrCode": "Please enter a valid QR code data.",
    "scanner.checkingPermission": "Checking camera permission...",
    "scanner.noCameraAccess": "No access to camera. Please grant permission.",
    "scanner.grantPermission": "Grant Permission",
    "scanner.enterQrCodeData": "Enter QR Code Data",
    "scanner.pasteQrCodeHere": "Paste QR code data here",
    "scanner.positionQrCode": "Position the QR code within the frame",
    "scanner.enterCodeManually": "Enter Code Manually",
    "scanner.qrSuccessfullyRedeemed": "QR Code Successfully Redeemed!",
    "scanner.processingQrCode": "Processing QR Code...",

    // Scanning QR Screen Specific
    "scanning.loading": "Generating QR code...",
    "scanning.refreshing": "Refreshing QR code...",
    "scanning.refreshIn": "Refreshing in {seconds} seconds",
    "scanning.qrValidityInfo":
      "For security, the QR code automatically refreshes every 15 seconds.",

    // Coffee Partner Dashboard Specific
    "cafe.welcomeMessage": "Welcome, {name}!",
    "cafe.coffeesServedToday": "Coffees served today",
    "cafe.estimatedRevenue": "Estimated revenue",
    "cafe.newCustomersToday": "New customers today",
    "cafe.statsForDate": "Stats for date",
    "cafe.realTimeData": "real-time data",
    "cafe.quickActions": "Quick Actions",
    "cafe.scanQRAction": "Scan QR",
    "cafe.viewReportsAction": "View Reports",
    "cafe.manageProductsAction": "Manage Products",
    "cafe.cafeSettingsAction": "Cafe Settings",

    // Coffee Partner Reports Specific
    "cafe.loadingReports": "Loading reports...",
    "cafe.reportsAndStats": "Reports and Statistics",
    "cafe.periodLastDays": "Period: Last {days} days",
    "cafe.totalScans": "Total Scans",
    "cafe.uniqueCustomers": "Unique Customers",
    "cafe.peakHour": "Peak Hour",
    "cafe.avgScansPerDay": "Avg. Scans/Day",
    "cafe.scansPerDay": "Scans per Day (Current Week)",
    "cafe.coffeeScansChart": "Coffee Scans Chart",
    "cafe.exportData": "Export Data",
    "cafe.exportComingSoon": "Export functionality coming soon!",
    "cafe.indexBuildingTitle": "Optimization in Progress",
    "cafe.indexBuildingMessage":
      "The database is currently being optimized. Please try again in a few minutes.",
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [language, setLanguage] = useState<Language>("ro");

  const t = (
    key: TranslationKey,
    options?: Record<string, string | number>
  ): string => {
    let translation = translations[language][key] || key;
    if (options) {
      Object.keys(options).forEach((optionKey) => {
        const regex = new RegExp(`{${optionKey}}`, "g");
        translation = translation.replace(regex, String(options[optionKey]));
      });
    }
    return translation;
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
