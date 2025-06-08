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
  | "cafe.indexBuildingMessage"
  // Cart Screen
  | "cart.title"
  | "cart.loading"
  | "cart.emptyCart"
  | "cart.emptyCartMessage"
  | "cart.removeItem"
  | "cart.removeItemConfirm"
  | "cart.removed"
  | "cart.itemRemovedFromCart"
  | "cart.insufficientBeans"
  | "cart.needMoreBeans"
  | "cart.checkout"
  | "cart.total"
  | "cart.beans"
  | "cart.available"
  | "cart.afterPurchase"
  | "cart.checkoutFailed"
  | "cart.checkoutFailedMessage"
  | "cart.failedToLoadCart"
  | "cart.failedToUpdateQuantity"
  | "cart.failedToRemoveItem"
  | "cart.failedToGenerateQR"
  // Cafe Details Screen
  | "cafeDetails.title"
  | "cafeDetails.loading"
  | "cafeDetails.error"
  | "cafeDetails.noCafeId"
  | "cafeDetails.cafeNotFound"
  | "cafeDetails.failedToLoad"
  | "cafeDetails.unnamedCafe"
  | "cafeDetails.noAddress"
  | "cafeDetails.noDescription"
  | "cafeDetails.openNow"
  | "cafeDetails.closed"
  | "cafeDetails.openingHours"
  | "cafeDetails.monday"
  | "cafeDetails.tuesday"
  | "cafeDetails.wednesday"
  | "cafeDetails.thursday"
  | "cafeDetails.friday"
  | "cafeDetails.saturday"
  | "cafeDetails.sunday"
  | "cafeDetails.menu"
  | "cafeDetails.contact"
  | "cafeDetails.directions"
  | "cafeDetails.website"
  | "cafeDetails.phone"
  | "cafeDetails.noMenu"
  | "cafeDetails.noContact"
  // Full Menu Screen
  | "fullMenu.searchIn"
  | "fullMenu.cart"
  | "fullMenu.emptyMenu"
  | "fullMenu.noProducts"
  | "fullMenu.allCategories"
  | "fullMenu.coffee"
  | "fullMenu.tea"
  | "fullMenu.pastries"
  | "fullMenu.snacks"
  | "fullMenu.hotDrinks"
  | "fullMenu.success"
  | "fullMenu.addedToCart"
  | "fullMenu.loginRequired"
  | "fullMenu.pleaseLoginToAdd"
  // QR Screen
  | "qr.title"
  | "qr.loading"
  | "qr.generating"
  | "qr.error"
  | "qr.noSubscription"
  | "qr.subscriptionExpired"
  | "qr.insufficientCredits"
  | "qr.checkoutMode"
  | "qr.orderTotal"
  | "qr.orderComplete"
  | "qr.orderProcessed"
  | "qr.refreshIn"
  | "qr.seconds"
  | "qr.expired"
  | "qr.generateNew"
  | "qr.scanAtCafe"
  | "qr.validFor"
  | "qr.autoRefresh"
  // Subscriptions Errors/Messages
  | "subscriptions.subscriptionActivated"
  | "subscriptions.receivedBeans"
  | "subscriptions.enjoyYourCoffee"
  | "subscriptions.subscriptionError"
  | "subscriptions.failedToActivate"
  | "subscriptions.loginRequired"
  | "subscriptions.chooseBeanPack"
  | "subscriptions.monthlySubscription"
  | "subscriptions.oneTimePurchase"
  | "subscriptions.changePlan"
  | "subscriptions.startSipping"
  | "subscriptions.howBeansWork"
  | "subscriptions.beansCurrency"
  | "subscriptions.gotIt"
  // Map Screen Additional
  | "map.added"
  | "map.failedToAddItem"
  | "map.noImageAvailable"
  // Common Additional Keys
  | "common.loading"
  | "common.tryAgain"
  | "common.confirm"
  | "common.remove"
  | "common.add"
  | "common.update"
  | "common.save"
  | "common.close"
  | "common.back"
  // Subscription Components Additional Keys
  | "subscriptions.popular"
  | "subscriptions.beans"
  | "subscriptions.perMonth"
  | "subscriptions.beansRemaining"
  | "subscriptions.lowOnBeans"
  | "subscriptions.expires"
  | "subscriptions.renewSubscription"
  | "subscriptions.getSubscription"
  | "subscriptions.usedBeansThisMonth"
  | "subscriptions.beansRemaining"
  | "subscriptions.noPlansAvailable"
  | "subscriptions.currentlyOnPlan"
  | "subscriptions.beansLeft"
  | "subscriptions.beansWorkTitle"
  | "subscriptions.beansWorkDescription"
  | "subscriptions.espresso"
  | "subscriptions.cappuccino"
  | "subscriptions.latte"
  | "subscriptions.frappe"
  | "subscriptions.oneBean"
  | "subscriptions.twoBeans"
  | "subscriptions.threeBeans"
  | "subscriptions.modalDescription1"
  | "subscriptions.modalDescription2"
  // Profile Screen Updates
  | "profile.permissionDenied"
  | "profile.permissionDeniedMessage"
  | "profile.photoUpdated"
  | "profile.photoUpdatedMessage"
  | "profile.photoUpdateError"
  // Edit Profile Screen
  | "editProfile.displayName"
  | "editProfile.displayNamePlaceholder"
  | "editProfile.phoneNumber"
  | "editProfile.phoneNumberPlaceholder"
  | "editProfile.bio"
  | "editProfile.bioPlaceholder"
  | "editProfile.save"
  | "editProfile.tapToChangePhoto"
  | "editProfile.emailCannotBeChanged"
  | "editProfile.displayNameRequired"
  | "editProfile.profileUpdated"
  | "editProfile.profileUpdatedMessage"
  | "editProfile.profileUpdateFailed"
  | "editProfile.accountInformation"
  | "editProfile.memberSince"
  | "editProfile.userId"
  | "editProfile.accountType"
  | "editProfile.standardUser"
  | "editProfile.changePassword"
  | "editProfile.changePasswordMessage"
  | "editProfile.deleteAccount"
  | "editProfile.deleteAccountWarning"
  | "editProfile.photoPermissionDenied"
  | "editProfile.photoPermissionMessage"
  | "editProfile.changeProfilePhoto"
  | "editProfile.photoOptions"
  | "editProfile.camera"
  | "editProfile.photoLibrary"
  | "editProfile.cameraPermissionDenied"
  | "editProfile.cameraPermissionMessage"
  | "editProfile.photoUploadFailed"
  | "editProfile.characterCount"
  // Help Support Screen
  | "helpSupport.quickHelp"
  | "helpSupport.reportBug"
  | "helpSupport.reportBugDesc"
  | "helpSupport.featureRequest"
  | "helpSupport.featureRequestDesc"
  | "helpSupport.appInformation"
  | "helpSupport.appInformationDesc"
  | "helpSupport.appVersion"
  | "helpSupport.appVersionInfo"
  | "helpSupport.faq"
  | "helpSupport.faqQuestion1"
  | "helpSupport.faqAnswer1"
  | "helpSupport.faqQuestion2"
  | "helpSupport.faqAnswer2"
  | "helpSupport.faqQuestion3"
  | "helpSupport.faqAnswer3"
  | "helpSupport.faqQuestion4"
  | "helpSupport.faqAnswer4"
  | "helpSupport.faqQuestion5"
  | "helpSupport.faqAnswer5"
  | "helpSupport.faqQuestion6"
  | "helpSupport.faqAnswer6"
  | "helpSupport.faqQuestion7"
  | "helpSupport.faqAnswer7"
  | "helpSupport.faqQuestion8"
  | "helpSupport.faqAnswer8"
  | "helpSupport.contactSupport"
  | "helpSupport.contactSupportDesc"
  | "helpSupport.emailSupport"
  | "helpSupport.emailSupportDesc"
  | "helpSupport.liveChat"
  | "helpSupport.liveChatDesc"
  | "helpSupport.liveChatComingSoon"
  | "helpSupport.callSupport"
  | "helpSupport.callSupportNumber"
  | "helpSupport.visitWebsite"
  | "helpSupport.websiteUrl"
  | "helpSupport.supportHours"
  | "helpSupport.mondayFriday"
  | "helpSupport.mondayFridayHours"
  | "helpSupport.saturday"
  | "helpSupport.saturdayHours"
  | "helpSupport.sunday"
  | "helpSupport.sundayHours"
  | "helpSupport.timezoneNote"
  | "helpSupport.additionalResources"
  | "helpSupport.termsOfService"
  | "helpSupport.privacyPolicy"
  | "helpSupport.coffeeBlog"
  // Privacy Security Screen
  | "privacySecurity.privacySettings"
  | "privacySecurity.locationTracking"
  | "privacySecurity.locationTrackingDesc"
  | "privacySecurity.analyticsData"
  | "privacySecurity.analyticsDataDesc"
  | "privacySecurity.crashReports"
  | "privacySecurity.crashReportsDesc"
  | "privacySecurity.dataSharing"
  | "privacySecurity.dataSharingDesc"
  | "privacySecurity.marketingEmails"
  | "privacySecurity.marketingEmailsDesc"
  | "privacySecurity.dataManagement"
  | "privacySecurity.dataManagementDesc"
  | "privacySecurity.downloadData"
  | "privacySecurity.downloadDataDesc"
  | "privacySecurity.downloadDataTitle"
  | "privacySecurity.downloadDataMessage"
  | "privacySecurity.requestSubmitted"
  | "privacySecurity.downloadRequestMessage"
  | "privacySecurity.exportData"
  | "privacySecurity.exportDataDesc"
  | "privacySecurity.dataPortability"
  | "privacySecurity.dataPortabilityMessage"
  | "privacySecurity.deleteAllData"
  | "privacySecurity.deleteAllDataDesc"
  | "privacySecurity.deleteDataTitle"
  | "privacySecurity.deleteDataMessage"
  | "privacySecurity.finalConfirmation"
  | "privacySecurity.finalConfirmationMessage"
  | "privacySecurity.yesDeleteEverything"
  | "privacySecurity.security"
  | "privacySecurity.changePasswordDesc"
  | "privacySecurity.activeSessions"
  | "privacySecurity.activeSessionsDesc"
  | "privacySecurity.activeSessionsMessage"
  | "privacySecurity.legalDocuments"
  | "privacySecurity.gdprCompliance"
  | "privacySecurity.gdprComplianceDesc"
  | "privacySecurity.privacyPolicyTitle"
  // About Screen
  | "about.appName"
  | "about.tagline"
  | "about.version"
  | "about.build"
  | "about.ourMission"
  | "about.missionStatement"
  | "about.whatWeOffer"
  | "about.flexibleSubscriptions"
  | "about.flexibleSubscriptionsDesc"
  | "about.partnerNetwork"
  | "about.partnerNetworkDesc"
  | "about.easyRedemption"
  | "about.easyRedemptionDesc"
  | "about.smartTracking"
  | "about.smartTrackingDesc"
  | "about.meetTheTeam"
  | "about.founderName"
  | "about.founderRole"
  | "about.founderDesc"
  | "about.teamName"
  | "about.teamRole"
  | "about.teamDesc"
  | "about.companyInformation"
  | "about.companyName"
  | "about.location"
  | "about.founded"
  | "about.email"
  | "about.website"
  | "about.specialThanks"
  | "about.specialThanksDesc"
  | "about.reactNativeCommunity"
  | "about.expoFramework"
  | "about.firebaseTeam"
  | "about.coffeeLovers"
  | "about.legal"
  | "about.openSourceLicenses"
  | "about.copyright"
  | "about.madeWithLove"
  // Account Settings Index
  | "accountSettings.description";

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

    // Cart Screen
    "cart.title": "Coșul Meu",
    "cart.loading": "Se încarcă coșul...",
    "cart.emptyCart": "Coș Gol",
    "cart.emptyCartMessage":
      "Coșul tău este gol. Adaugă produse din cafenelele tale preferate!",
    "cart.removeItem": "Șterge Articol",
    "cart.removeItemConfirm":
      "Ești sigur că vrei să ștergi acest articol din coș?",
    "cart.removed": "Șters!",
    "cart.itemRemovedFromCart": "Articol șters din coș",
    "cart.insufficientBeans": "Boabe Insuficiente",
    "cart.needMoreBeans": "Ai nevoie de {needed} boabe dar ai doar {available}",
    "cart.checkout": "Finalizează Comanda",
    "cart.total": "Total",
    "cart.beans": "boabe",
    "cart.available": "Disponibil",
    "cart.afterPurchase": "După cumpărare",
    "cart.checkoutFailed": "Finalizarea a eșuat",
    "cart.checkoutFailedMessage":
      "Finalizarea comenzii a eșuat. Te rog încearcă din nou.",
    "cart.failedToLoadCart": "Nu s-a putut încărca coșul",
    "cart.failedToUpdateQuantity": "Nu s-a putut actualiza cantitatea",
    "cart.failedToRemoveItem": "Nu s-a putut șterge articolul",
    "cart.failedToGenerateQR": "Nu s-a putut genera codul QR pentru finalizare",

    // Cafe Details Screen
    "cafeDetails.title": "Detalii Cafenea",
    "cafeDetails.loading": "Se încarcă detaliile cafenelei...",
    "cafeDetails.error": "Eroare",
    "cafeDetails.noCafeId": "Nu a fost furnizat ID-ul cafenelei",
    "cafeDetails.cafeNotFound": "Cafeneaua nu a fost găsită",
    "cafeDetails.failedToLoad": "Nu s-au putut încărca detaliile cafenelei",
    "cafeDetails.unnamedCafe": "Cafenea fără nume",
    "cafeDetails.noAddress": "Adresă necomunicată",
    "cafeDetails.noDescription": "Nicio descriere disponibilă",
    "cafeDetails.openNow": "Deschis Acum",
    "cafeDetails.closed": "Închis",
    "cafeDetails.openingHours": "Program",
    "cafeDetails.monday": "Luni",
    "cafeDetails.tuesday": "Marți",
    "cafeDetails.wednesday": "Miercuri",
    "cafeDetails.thursday": "Joi",
    "cafeDetails.friday": "Vineri",
    "cafeDetails.saturday": "Sâmbătă",
    "cafeDetails.sunday": "Duminică",
    "cafeDetails.menu": "Meniu",
    "cafeDetails.contact": "Contact",
    "cafeDetails.directions": "Direcții",
    "cafeDetails.website": "Website",
    "cafeDetails.phone": "Telefon",
    "cafeDetails.noMenu": "Meniu indisponibil",
    "cafeDetails.noContact": "Informații de contact indisponibile",

    // Full Menu Screen
    "fullMenu.searchIn": "Caută în {cafeName}",
    "fullMenu.cart": "Coș",
    "fullMenu.emptyMenu": "Meniu Gol",
    "fullMenu.noProducts":
      "Această cafenea nu are produse disponibile momentan",
    "fullMenu.allCategories": "Toate",
    "fullMenu.coffee": "Cafea",
    "fullMenu.tea": "Ceai",
    "fullMenu.pastries": "Prăjituri",
    "fullMenu.snacks": "Gustări",
    "fullMenu.hotDrinks": "Băuturi Calde",
    "fullMenu.success": "Succes",
    "fullMenu.addedToCart": "{productName} adăugat în coș",
    "fullMenu.loginRequired": "Autentificare necesară",
    "fullMenu.pleaseLoginToAdd":
      "Te rog autentifică-te pentru a adăuga articole în coș",

    // QR Screen
    "qr.title": "Codul Meu QR",
    "qr.loading": "Se generează codul QR...",
    "qr.generating": "Se generează un cod nou...",
    "qr.error": "Eroare la generarea codului QR",
    "qr.noSubscription": "Niciun abonament activ",
    "qr.subscriptionExpired": "Abonamentul a expirat",
    "qr.insufficientCredits": "Credite insuficiente",
    "qr.checkoutMode": "Finalizare Comandă",
    "qr.orderTotal": "Total comandă: {total} boabe",
    "qr.orderComplete": "Comandă Finalizată!",
    "qr.orderProcessed": "Comanda ta a fost procesată cu succes",
    "qr.refreshIn": "Se reîmprospătează în {seconds} secunde",
    "qr.seconds": "secunde",
    "qr.expired": "Expirat",
    "qr.generateNew": "Generează Nou",
    "qr.scanAtCafe": "Scanează la cafenea",
    "qr.validFor": "Valabil pentru",
    "qr.autoRefresh": "Se reîmprospătează automat",

    // Subscriptions Errors/Messages
    "subscriptions.subscriptionActivated": "Abonament Activat!",
    "subscriptions.receivedBeans":
      "🎉 Ai primit {credits} Boabe! Bucură-te de cafeaua ta!",
    "subscriptions.enjoyYourCoffee": "Bucură-te de cafeaua ta!",
    "subscriptions.subscriptionError": "Eroare Abonament",
    "subscriptions.failedToActivate":
      "Nu s-a putut activa abonamentul. Te rog încearcă din nou.",
    "subscriptions.loginRequired":
      "Trebuie să fii autentificat pentru a te abona la un plan",
    "subscriptions.chooseBeanPack": "Alege Pachetul Tău de Boabe ☕",
    "subscriptions.monthlySubscription": "Abonament Lunar",
    "subscriptions.oneTimePurchase": "Cumpărătură Unică",
    "subscriptions.changePlan": "Schimbă Planul",
    "subscriptions.startSipping": "Începe să Savurezi",
    "subscriptions.howBeansWork": "Cum Funcționează Boabele",
    "subscriptions.beansCurrency":
      "Boabele sunt moneda ta pentru cafea! Iată cum funcționează:",
    "subscriptions.gotIt": "Am Înțeles!",

    // Map Screen Additional
    "map.added": "Adăugat!",
    "map.failedToAddItem": "Nu s-a putut adăuga articolul",
    "map.noImageAvailable": "Nicio imagine disponibilă",

    // Common Additional Keys - removing duplicates
    "common.loading": "Se încarcă...",
    "common.tryAgain": "Încearcă din nou",
    "common.confirm": "Confirmă",
    "common.remove": "Șterge",
    "common.add": "Adaugă",
    "common.update": "Actualizează",
    "common.save": "Salvează",
    "common.close": "Închide",
    "common.back": "Înapoi",

    // Subscription Components Additional Keys
    "subscriptions.popular": "Popular",
    "subscriptions.beans": "Boabe",
    "subscriptions.perMonth": "/lună",
    "subscriptions.beansRemaining": "Boabe Rămase",
    "subscriptions.lowOnBeans": "Puține boabe!",
    "subscriptions.expires": "Expiră",
    "subscriptions.renewSubscription": "Reînnoiește Abonamentul",
    "subscriptions.getSubscription": "Vezi Abonamentele",
    "subscriptions.usedBeansThisMonth":
      "Ai folosit {used} din {total} Boabe în această lună",
    "subscriptions.beansLeft": "{beans} boabe rămase",
    "subscriptions.noPlansAvailable":
      "Niciun plan de abonament disponibil momentan.",
    "subscriptions.currentlyOnPlan":
      "Ești momentan pe planul {planName} cu {beansLeft} boabe rămase",
    "subscriptions.beansWorkTitle":
      "Boabele sunt moneda ta pentru cafea! Iată cum funcționează:",
    "subscriptions.beansWorkDescription":
      "Abonează-te la un pachet lunar de boabe și folosește-le la orice cafenea parteneră. Boabele se reînnnoiesc la fiecare ciclu de facturare. Boabele nefolosite nu se reportează.",
    "subscriptions.espresso": "Espresso",
    "subscriptions.cappuccino": "Cappuccino",
    "subscriptions.latte": "Latte",
    "subscriptions.frappe": "Frappé",
    "subscriptions.oneBean": "1 Boabă",
    "subscriptions.twoBeans": "2 Boabe",
    "subscriptions.threeBeans": "3 Boabe",
    "subscriptions.modalDescription1":
      "Abonează-te la un pachet lunar de boabe și folosește-le la orice cafenea parteneră. Boabele se reînnoiesc la fiecare ciclu de facturare. Boabele nefolosite nu se reportează.",
    "subscriptions.modalDescription2":
      "Doar arată codul QR la checkout și boabele vor fi deduse automat.",

    // Profile Screen Updates
    "profile.permissionDenied": "Permisiune Refuzată",
    "profile.permissionDeniedMessage":
      "Te rog permite accesul la galeria foto pentru a schimba poza de profil.",
    "profile.photoUpdated": "Poză Actualizată",
    "profile.photoUpdatedMessage":
      "Poza de profil a fost actualizată cu succes.",
    "profile.photoUpdateError": "Eroare actualizare poză de profil",

    // Edit Profile Screen
    "editProfile.displayName": "Nume Afișat *",
    "editProfile.displayNamePlaceholder": "Introdu numele tău",
    "editProfile.phoneNumber": "Număr de Telefon",
    "editProfile.phoneNumberPlaceholder": "Introdu numărul de telefon",
    "editProfile.bio": "Biografie",
    "editProfile.bioPlaceholder": "Spune-ne despre tine...",
    "editProfile.save": "Salvează",
    "editProfile.tapToChangePhoto": "Apasă pentru a schimba poza",
    "editProfile.emailCannotBeChanged":
      "Emailul nu poate fi modificat din acest ecran",
    "editProfile.displayNameRequired": "Numele afișat este obligatoriu",
    "editProfile.profileUpdated": "Profil Actualizat",
    "editProfile.profileUpdatedMessage":
      "Profilul tău a fost actualizat cu succes.",
    "editProfile.profileUpdateFailed":
      "Actualizarea profilului a eșuat. Te rog încearcă din nou.",
    "editProfile.accountInformation": "Informații Cont",
    "editProfile.memberSince": "Membru din",
    "editProfile.userId": "ID Utilizator",
    "editProfile.accountType": "Tip Cont",
    "editProfile.standardUser": "Utilizator Standard",
    "editProfile.changePassword": "Schimbă Parola",
    "editProfile.changePasswordMessage":
      "Vei primi un email cu instrucțiuni pentru resetarea parolei.",
    "editProfile.deleteAccount": "Șterge Contul",
    "editProfile.deleteAccountWarning":
      "Această acțiune nu poate fi anulată. Toate datele tale vor fi șterse permanent.",
    "editProfile.photoPermissionDenied": "Permisiune Refuzată",
    "editProfile.photoPermissionMessage":
      "Te rog permite accesul la galeria foto pentru a schimba poza de profil.",
    "editProfile.changeProfilePhoto": "Schimbă Poza de Profil",
    "editProfile.photoOptions":
      "Alege modalitatea de schimbare a pozei de profil",
    "editProfile.camera": "Cameră",
    "editProfile.photoLibrary": "Galerie Foto",
    "editProfile.cameraPermissionDenied": "Permisiune Refuzată",
    "editProfile.cameraPermissionMessage":
      "Te rog permite accesul la cameră pentru a face o poză.",
    "editProfile.photoUploadFailed": "Încărcarea pozei a eșuat",
    "editProfile.characterCount": "{count}/200 caractere",

    // Help Support Screen
    "helpSupport.quickHelp": "Ajutor Rapid",
    "helpSupport.reportBug": "Raportează o Problemă",
    "helpSupport.reportBugDesc": "Ai găsit o problemă? Spune-ne",
    "helpSupport.featureRequest": "Solicitare Funcționalitate",
    "helpSupport.featureRequestDesc": "Sugerează funcționalități noi",
    "helpSupport.appInformation": "Informații Aplicație",
    "helpSupport.appInformationDesc": "Versiune și informații build",
    "helpSupport.appVersion": "Versiunea Aplicației",
    "helpSupport.appVersionInfo":
      "CoffeeShare v1.0.0\nBuild 1001\n\nDezvoltat cu ❤️ pentru iubitorii de cafea",
    "helpSupport.faq": "Întrebări Frecvente",
    "helpSupport.faqQuestion1": "Cum cumpăr un abonament de cafea?",
    "helpSupport.faqAnswer1":
      "Poți cumpăra un abonament de cafea mergând la tab-ul Abonamente din profilul tău. Alege din planurile noastre disponibile și finalizează procesul de plată.",
    "helpSupport.faqQuestion2": "Cum răscumpăr boabele de cafea?",
    "helpSupport.faqAnswer2":
      "Pentru a răscumpăra boabele de cafea, vizitează orice cafenea parteneră și arată codul QR din aplicație. Personalul cafenelei îl va scana și va deduce boabele corespunzătoare din contul tău.",
    "helpSupport.faqQuestion3": "Ce se întâmplă dacă abonamentul îmi expiră?",
    "helpSupport.faqAnswer3":
      "Când abonamentul îți expiră, nu vei mai putea răscumpăra boabele rămase. Cu toate acestea, poți reînnoi abonamentul pentru a continua să folosești serviciul.",
    "helpSupport.faqQuestion4": "Pot schimba planul de abonament?",
    "helpSupport.faqAnswer4":
      "Da, poți face upgrade sau downgrade la planul de abonament oricând. Modificările vor intra în vigoare la următorul ciclu de facturare.",
    "helpSupport.faqQuestion5": "Cum găsesc cafenelele partenere?",
    "helpSupport.faqAnswer5":
      "Folosește tab-ul Hartă pentru a găsi toate cafenelele partenere din apropierea ta. Poți căuta și cafenele specifice sau naviga după oraș.",
    "helpSupport.faqQuestion6": "Ce fac dacă am probleme cu codul QR?",
    "helpSupport.faqAnswer6":
      "Dacă codul QR nu funcționează, încearcă să reîmprospătezi ecranul cu codul QR sau verifică conexiunea la internet. Dacă problema persistă, contactează echipa noastră de suport.",
    "helpSupport.faqQuestion7": "Cum actualizez informațiile profilului?",
    "helpSupport.faqAnswer7":
      "Mergi la Setări Cont și selectează Editează Profilul. Poți actualiza numele, numărul de telefon și poza de profil de acolo.",
    "helpSupport.faqQuestion8": "Pot obține o rambursare pentru abonament?",
    "helpSupport.faqAnswer8":
      "Rambursările sunt disponibile în 7 zile de la cumpărare dacă nu ai folosit nicio boabă de cafea. Te rog contactează echipa noastră de suport pentru solicitări de rambursare.",
    "helpSupport.contactSupport": "Contactează Suportul",
    "helpSupport.contactSupportDesc":
      "Nu găsești ce cauți? Echipa noastră de suport este aici să te ajute!",
    "helpSupport.emailSupport": "Suport Email",
    "helpSupport.emailSupportDesc": "Primește ajutor prin email",
    "helpSupport.liveChat": "Chat Live",
    "helpSupport.liveChatDesc": "Discută cu echipa noastră de suport",
    "helpSupport.liveChatComingSoon":
      "Funcționalitatea chat live va fi disponibilă în curând! Te rog folosește suportul email pentru moment.",
    "helpSupport.callSupport": "Suport Telefonic",
    "helpSupport.callSupportNumber": "+40 123 456 789",
    "helpSupport.visitWebsite": "Vizitează Site-ul Nostru",
    "helpSupport.websiteUrl": "www.coffeeshare.ro",
    "helpSupport.supportHours": "Ore de Suport",
    "helpSupport.mondayFriday": "Luni - Vineri",
    "helpSupport.mondayFridayHours": "9:00 - 18:00",
    "helpSupport.saturday": "Sâmbătă",
    "helpSupport.saturdayHours": "10:00 - 16:00",
    "helpSupport.sunday": "Duminică",
    "helpSupport.sundayHours": "Închis",
    "helpSupport.timezoneNote": "Toate orele în România (EET/EEST)",
    "helpSupport.additionalResources": "Resurse Adiționale",
    "helpSupport.termsOfService": "Termeni și Condiții",
    "helpSupport.privacyPolicy": "Politica de Confidențialitate",
    "helpSupport.coffeeBlog": "Blogul de Cafea",

    // Privacy Security Screen
    "privacySecurity.privacySettings": "Setări Confidențialitate",
    "privacySecurity.locationTracking": "Urmărire Locație",
    "privacySecurity.locationTrackingDesc":
      "Permite-ne să folosim locația ta pentru a găsi cafenele din apropiere",
    "privacySecurity.analyticsData": "Date Analitice",
    "privacySecurity.analyticsDataDesc":
      "Ajută-ne să îmbunătățim aplicația prin partajarea analitice de utilizare",
    "privacySecurity.crashReports": "Rapoarte Erori",
    "privacySecurity.crashReportsDesc":
      "Trimite rapoarte de erori pentru a ne ajuta să remediem problemele",
    "privacySecurity.dataSharing": "Partajare Date",
    "privacySecurity.dataSharingDesc":
      "Partajează date anonimizate cu cafenelele partenere",
    "privacySecurity.marketingEmails": "Email-uri Marketing",
    "privacySecurity.marketingEmailsDesc":
      "Primește oferte promoționale și actualizări",
    "privacySecurity.dataManagement": "Gestionare Date",
    "privacySecurity.dataManagementDesc":
      "Gestionează datele personale și informațiile contului",
    "privacySecurity.downloadData": "Descarcă Datele Mele",
    "privacySecurity.downloadDataDesc":
      "Obține o copie a tuturor datelor stocate în sistemul nostru",
    "privacySecurity.downloadDataTitle": "Descarcă Datele Tale",
    "privacySecurity.downloadDataMessage":
      "Vom pregăti un link de descărcare cu toate datele tale și îl vom trimite la adresa de email înregistrată în 48 de ore.",
    "privacySecurity.requestSubmitted": "Solicitare Trimisă",
    "privacySecurity.downloadRequestMessage":
      "Vei primi un email cu linkul de descărcare a datelor în 48 de ore.",
    "privacySecurity.exportData": "Exportă Date",
    "privacySecurity.exportDataDesc":
      "Exportă datele pentru a le folosi cu alte servicii",
    "privacySecurity.dataPortability": "Portabilitate Date",
    "privacySecurity.dataPortabilityMessage":
      "Poți exporta datele în format JSON. Aceasta include profilul, istoricul abonamentelor și preferințele.",
    "privacySecurity.deleteAllData": "Șterge Toate Datele",
    "privacySecurity.deleteAllDataDesc":
      "Șterge permanent contul și toate datele",
    "privacySecurity.deleteDataTitle": "Șterge Toate Datele",
    "privacySecurity.deleteDataMessage":
      "Aceasta va șterge permanent toate datele tale incluzând:\n\n• Informații profil\n• Istoric abonamente\n• Istoric răscumpărări cafea\n• Preferințe aplicație\n\nAceastă acțiune nu poate fi anulată.",
    "privacySecurity.finalConfirmation": "Confirmare Finală",
    "privacySecurity.finalConfirmationMessage":
      "Ești absolut sigur? Aceasta va șterge permanent contul și toate datele asociate.",
    "privacySecurity.yesDeleteEverything": "Da, Șterge Tot",
    "privacySecurity.security": "Securitate",
    "privacySecurity.changePasswordDesc": "Actualizează parola contului",
    "privacySecurity.activeSessions": "Sesiuni Active",
    "privacySecurity.activeSessionsDesc":
      "Vezi dispozitivele pe care ești autentificat",
    "privacySecurity.activeSessionsMessage":
      "Ești autentificat în prezent doar pe acest dispozitiv. Dacă observi activitate suspectă, te rog schimbă parola imediat.",
    "privacySecurity.legalDocuments": "Documente Legale",
    "privacySecurity.gdprCompliance": "Conformitate GDPR",
    "privacySecurity.gdprComplianceDesc":
      "Află despre conformitatea noastră GDPR",
    "privacySecurity.privacyPolicyTitle": "Politica de Confidențialitate",

    // About Screen
    "about.appName": "CoffeeShare",
    "about.tagline": "Cafeaua Ta, Modalitatea Ta, În Fiecare Zi",
    "about.version": "Versiunea 1.0.0",
    "about.build": "Build 1001 • Ianuarie 2024",
    "about.ourMission": "Misiunea Noastră",
    "about.missionStatement":
      "CoffeeShare s-a născut dintr-o idee simplă: să facem cafeaua excelentă mai accesibilă și mai ieftină pentru toată lumea. Credem că o ceașcă perfectă de cafea nu ar trebui să fie un lux, ci o plăcere zilnică care conectează comunitățile și alimentează visele.",
    "about.whatWeOffer": "Ce Oferim",
    "about.flexibleSubscriptions": "Abonamente Flexibile",
    "about.flexibleSubscriptionsDesc":
      "Alege din diverse planuri de cafea care se potrivesc stilului tău de viață",
    "about.partnerNetwork": "Rețea de Parteneri",
    "about.partnerNetworkDesc":
      "Acces la sute de cafenele partenere din România",
    "about.easyRedemption": "Răscumpărare Ușoară",
    "about.easyRedemptionDesc":
      "Sistem simplu cu cod QR pentru răscumpărare rapidă a cafelei",
    "about.smartTracking": "Urmărire Inteligentă",
    "about.smartTrackingDesc":
      "Urmărește consumul de cafea și descoperă noi preferate",
    "about.meetTheTeam": "Cunoaște Echipa",
    "about.founderName": "Alexandru Gheorghita",
    "about.founderRole": "Developer Principal & Fondator",
    "about.founderDesc":
      "Developer full-stack cu pasiune pentru cafea și tehnologie",
    "about.teamName": "Echipa CoffeeShare",
    "about.teamRole": "Echipa de Dezvoltare",
    "about.teamDesc":
      "Echipă dedicată care face cafeaua accesibilă pentru toată lumea",
    "about.companyInformation": "Informații Companie",
    "about.companyName": "CoffeeShare SRL",
    "about.location": "București, România",
    "about.founded": "Fondată în 2024",
    "about.email": "info@coffeeshare.ro",
    "about.website": "www.coffeeshare.ro",
    "about.specialThanks": "Mulțumiri Speciale",
    "about.specialThanksDesc":
      "Această aplicație nu ar fi fost posibilă fără comunitatea open-source uimitoare și susținătorii noștri:",
    "about.reactNativeCommunity": "Comunitatea React Native",
    "about.expoFramework": "Framework-ul Expo",
    "about.firebaseTeam": "Echipa Firebase",
    "about.coffeeLovers":
      "Toți iubitorii de cafea care au inspirat această aplicație",
    "about.legal": "Legal",
    "about.openSourceLicenses": "Licențe Open Source",
    "about.copyright": "© 2024 CoffeeShare SRL. Toate drepturile rezervate.",
    "about.madeWithLove": "Făcut cu ❤️ și multă ☕ în România",

    // Account Settings Index
    "accountSettings.description":
      "Gestionează setările contului, preferințele de confidențialitate și configurația aplicației din opțiunile de mai jos.",
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

    // Cart Screen
    "cart.title": "My Cart",
    "cart.loading": "Loading cart...",
    "cart.emptyCart": "Empty Cart",
    "cart.emptyCartMessage":
      "Your cart is empty. Add products from your favorite cafes!",
    "cart.removeItem": "Remove Item",
    "cart.removeItemConfirm":
      "Are you sure you want to remove this item from your cart?",
    "cart.removed": "Removed!",
    "cart.itemRemovedFromCart": "Item removed from cart",
    "cart.insufficientBeans": "Insufficient Beans",
    "cart.needMoreBeans": "You need {needed} beans but only have {available}",
    "cart.checkout": "Checkout",
    "cart.total": "Total",
    "cart.beans": "beans",
    "cart.available": "Available",
    "cart.afterPurchase": "After purchase",
    "cart.checkoutFailed": "Checkout failed",
    "cart.checkoutFailedMessage": "Checkout failed. Please try again.",
    "cart.failedToLoadCart": "Failed to load cart",
    "cart.failedToUpdateQuantity": "Failed to update quantity",
    "cart.failedToRemoveItem": "Failed to remove item",
    "cart.failedToGenerateQR": "Failed to generate checkout QR code",

    // Cafe Details Screen
    "cafeDetails.title": "Cafe Details",
    "cafeDetails.loading": "Loading cafe details...",
    "cafeDetails.error": "Error",
    "cafeDetails.noCafeId": "No cafe ID provided",
    "cafeDetails.cafeNotFound": "Cafe not found",
    "cafeDetails.failedToLoad": "Failed to load cafe details",
    "cafeDetails.unnamedCafe": "Unnamed Cafe",
    "cafeDetails.noAddress": "No address provided",
    "cafeDetails.noDescription": "No description available",
    "cafeDetails.openNow": "Open Now",
    "cafeDetails.closed": "Closed",
    "cafeDetails.openingHours": "Opening Hours",
    "cafeDetails.monday": "Monday",
    "cafeDetails.tuesday": "Tuesday",
    "cafeDetails.wednesday": "Wednesday",
    "cafeDetails.thursday": "Thursday",
    "cafeDetails.friday": "Friday",
    "cafeDetails.saturday": "Saturday",
    "cafeDetails.sunday": "Sunday",
    "cafeDetails.menu": "Menu",
    "cafeDetails.contact": "Contact",
    "cafeDetails.directions": "Directions",
    "cafeDetails.website": "Website",
    "cafeDetails.phone": "Phone",
    "cafeDetails.noMenu": "Menu not available",
    "cafeDetails.noContact": "Contact information not available",

    // Full Menu Screen
    "fullMenu.searchIn": "Search in {cafeName}",
    "fullMenu.cart": "Cart",
    "fullMenu.emptyMenu": "Empty Menu",
    "fullMenu.noProducts": "This cafe has no products available at the moment",
    "fullMenu.allCategories": "All",
    "fullMenu.coffee": "Coffee",
    "fullMenu.tea": "Tea",
    "fullMenu.pastries": "Pastries",
    "fullMenu.snacks": "Snacks",
    "fullMenu.hotDrinks": "Hot Drinks",
    "fullMenu.success": "Success",
    "fullMenu.addedToCart": "{productName} added to cart",
    "fullMenu.loginRequired": "Login required",
    "fullMenu.pleaseLoginToAdd": "Please login to add items to cart",

    // QR Screen
    "qr.title": "My QR Code",
    "qr.loading": "Generating QR code...",
    "qr.generating": "Generating new code...",
    "qr.error": "Error generating QR code",
    "qr.noSubscription": "No active subscription",
    "qr.subscriptionExpired": "Subscription expired",
    "qr.insufficientCredits": "Insufficient credits",
    "qr.checkoutMode": "Checkout Mode",
    "qr.orderTotal": "Order total: {total} beans",
    "qr.orderComplete": "Order Complete!",
    "qr.orderProcessed": "Your order has been successfully processed",
    "qr.refreshIn": "Refreshing in {seconds} seconds",
    "qr.seconds": "seconds",
    "qr.expired": "Expired",
    "qr.generateNew": "Generate New",
    "qr.scanAtCafe": "Scan at cafe",
    "qr.validFor": "Valid for",
    "qr.autoRefresh": "Auto-refreshes",

    // Subscriptions Errors/Messages
    "subscriptions.subscriptionActivated": "Subscription Activated!",
    "subscriptions.receivedBeans":
      "🎉 You've received {credits} Beans! Enjoy your coffee!",
    "subscriptions.enjoyYourCoffee": "Enjoy your coffee!",
    "subscriptions.subscriptionError": "Subscription Error",
    "subscriptions.failedToActivate":
      "Failed to activate subscription. Please try again.",
    "subscriptions.loginRequired":
      "You must be logged in to subscribe to a plan",
    "subscriptions.chooseBeanPack": "Choose Your Bean Pack ☕",
    "subscriptions.monthlySubscription": "Monthly Subscription",
    "subscriptions.oneTimePurchase": "One-Time Purchase",
    "subscriptions.changePlan": "Change Plan",
    "subscriptions.startSipping": "Start Sipping",
    "subscriptions.howBeansWork": "How Beans Work",
    "subscriptions.beansCurrency":
      "Beans are your coffee currency! Here's how they work:",
    "subscriptions.gotIt": "Got It!",

    // Map Screen Additional
    "map.added": "Added!",
    "map.failedToAddItem": "Failed to add item",
    "map.noImageAvailable": "No image available",

    // Common Additional Keys
    "common.loading": "Loading...",
    "common.tryAgain": "Try again",
    "common.confirm": "Confirm",
    "common.remove": "Remove",
    "common.add": "Add",
    "common.update": "Update",
    "common.save": "Save",
    "common.close": "Close",
    "common.back": "Back",

    // Subscription Components Additional Keys
    "subscriptions.popular": "Popular",
    "subscriptions.beans": "Beans",
    "subscriptions.perMonth": "/month",
    "subscriptions.beansRemaining": "Beans Remaining",
    "subscriptions.lowOnBeans": "Low on beans!",
    "subscriptions.expires": "Expires",
    "subscriptions.renewSubscription": "Renew Subscription",
    "subscriptions.getSubscription": "View Subscriptions",
    "subscriptions.usedBeansThisMonth":
      "You've used {used} of your {total} Beans this month",
    "subscriptions.beansLeft": "{beans} beans remaining",
    "subscriptions.noPlansAvailable":
      "No subscription plans available at the moment.",
    "subscriptions.currentlyOnPlan":
      "You're currently on the {planName} plan with {beansLeft} beans remaining",
    "subscriptions.beansWorkTitle":
      "Beans are your coffee currency! Here's how they work:",
    "subscriptions.beansWorkDescription":
      "Subscribe to a monthly bean pack and use your beans at any partner café. Beans refresh with each new billing cycle. Unused beans don't roll over.",
    "subscriptions.espresso": "Espresso",
    "subscriptions.cappuccino": "Cappuccino",
    "subscriptions.latte": "Latte",
    "subscriptions.frappe": "Frappé",
    "subscriptions.oneBean": "1 Bean",
    "subscriptions.twoBeans": "2 Beans",
    "subscriptions.threeBeans": "3 Beans",
    "subscriptions.modalDescription1":
      "Subscribe to a monthly bean pack and use your beans at any partner café. Beans refresh with each new billing cycle. Unused beans don't roll over.",
    "subscriptions.modalDescription2":
      "Just show your QR code at checkout and your beans will be automatically deducted.",

    // Profile Screen Updates
    "profile.permissionDenied": "Permission Denied",
    "profile.permissionDeniedMessage":
      "Please allow access to photo library to change profile picture.",
    "profile.photoUpdated": "Photo Updated",
    "profile.photoUpdatedMessage":
      "Profile picture has been updated successfully.",
    "profile.photoUpdateError": "Error updating profile photo",

    // Edit Profile Screen
    "editProfile.displayName": "Display Name *",
    "editProfile.displayNamePlaceholder": "Enter your name",
    "editProfile.phoneNumber": "Phone Number",
    "editProfile.phoneNumberPlaceholder": "Enter phone number",
    "editProfile.bio": "Bio",
    "editProfile.bioPlaceholder": "Tell us about yourself...",
    "editProfile.save": "Save",
    "editProfile.tapToChangePhoto": "Tap to change photo",
    "editProfile.emailCannotBeChanged":
      "Email cannot be changed from this screen",
    "editProfile.displayNameRequired": "Display name is required",
    "editProfile.profileUpdated": "Profile Updated",
    "editProfile.profileUpdatedMessage":
      "Your profile has been updated successfully.",
    "editProfile.profileUpdateFailed":
      "Profile update failed. Please try again.",
    "editProfile.accountInformation": "Account Information",
    "editProfile.memberSince": "Member since",
    "editProfile.userId": "User ID",
    "editProfile.accountType": "Account Type",
    "editProfile.standardUser": "Standard User",
    "editProfile.changePassword": "Change Password",
    "editProfile.changePasswordMessage":
      "You will receive an email with password reset instructions.",
    "editProfile.deleteAccount": "Delete Account",
    "editProfile.deleteAccountWarning":
      "This action cannot be undone. All your data will be permanently deleted.",
    "editProfile.photoPermissionDenied": "Permission Denied",
    "editProfile.photoPermissionMessage":
      "Please allow access to photo library to change profile picture.",
    "editProfile.changeProfilePhoto": "Change Profile Photo",
    "editProfile.photoOptions": "Choose how to change your profile photo",
    "editProfile.camera": "Camera",
    "editProfile.photoLibrary": "Photo Library",
    "editProfile.cameraPermissionDenied": "Permission Denied",
    "editProfile.cameraPermissionMessage":
      "Please allow camera access to take a photo.",
    "editProfile.photoUploadFailed": "Photo upload failed",
    "editProfile.characterCount": "{count}/200 characters",

    // Help Support Screen
    "helpSupport.quickHelp": "Quick Help",
    "helpSupport.reportBug": "Report a Bug",
    "helpSupport.reportBugDesc": "Found an issue? Let us know",
    "helpSupport.featureRequest": "Feature Request",
    "helpSupport.featureRequestDesc": "Suggest new features",
    "helpSupport.appInformation": "App Information",
    "helpSupport.appInformationDesc": "Version and build information",
    "helpSupport.appVersion": "App Version",
    "helpSupport.appVersionInfo":
      "CoffeeShare v1.0.0\nBuild 1001\n\nBuilt with ❤️ for coffee lovers",
    "helpSupport.faq": "Frequently Asked Questions",
    "helpSupport.faqQuestion1": "How do I purchase a coffee subscription?",
    "helpSupport.faqAnswer1":
      "You can purchase a coffee subscription by going to the Subscriptions tab in your profile. Choose from our available plans and complete the payment process.",
    "helpSupport.faqQuestion2": "How do I redeem coffee beans?",
    "helpSupport.faqAnswer2":
      "To redeem coffee beans, visit any partner cafe and show your QR code from the app. The cafe staff will scan it and deduct the appropriate beans from your account.",
    "helpSupport.faqQuestion3": "What happens if my subscription expires?",
    "helpSupport.faqAnswer3":
      "When your subscription expires, you won't be able to redeem any remaining beans. However, you can renew your subscription to continue using the service.",
    "helpSupport.faqQuestion4": "Can I change my subscription plan?",
    "helpSupport.faqAnswer4":
      "Yes, you can upgrade or downgrade your subscription plan at any time. Changes will take effect at your next billing cycle.",
    "helpSupport.faqQuestion5": "How do I find partner cafes?",
    "helpSupport.faqAnswer5":
      "Use the Map tab to find all partner cafes near you. You can also search for specific cafes or browse by city.",
    "helpSupport.faqQuestion6": "What do I do if I have QR code issues?",
    "helpSupport.faqAnswer6":
      "If your QR code isn't working, try refreshing the QR screen or check your internet connection. If the problem persists, contact our support team.",
    "helpSupport.faqQuestion7": "How do I update my profile information?",
    "helpSupport.faqAnswer7":
      "Go to Account Settings and select Edit Profile. You can update your name, phone number, and profile photo from there.",
    "helpSupport.faqQuestion8": "Can I get a refund for my subscription?",
    "helpSupport.faqAnswer8":
      "Refunds are available within 7 days of purchase if you haven't used any coffee beans. Please contact our support team for refund requests.",
    "helpSupport.contactSupport": "Contact Support",
    "helpSupport.contactSupportDesc":
      "Can't find what you're looking for? Our support team is here to help!",
    "helpSupport.emailSupport": "Email Support",
    "helpSupport.emailSupportDesc": "Get help via email",
    "helpSupport.liveChat": "Live Chat",
    "helpSupport.liveChatDesc": "Chat with our support team",
    "helpSupport.liveChatComingSoon":
      "Live chat functionality coming soon! Please use email support for now.",
    "helpSupport.callSupport": "Phone Support",
    "helpSupport.callSupportNumber": "+40 123 456 789",
    "helpSupport.visitWebsite": "Visit Our Website",
    "helpSupport.websiteUrl": "www.coffeeshare.ro",
    "helpSupport.supportHours": "Support Hours",
    "helpSupport.mondayFriday": "Monday - Friday",
    "helpSupport.mondayFridayHours": "9:00 AM - 6:00 PM",
    "helpSupport.saturday": "Saturday",
    "helpSupport.saturdayHours": "10:00 AM - 4:00 PM",
    "helpSupport.sunday": "Sunday",
    "helpSupport.sundayHours": "Closed",
    "helpSupport.timezoneNote": "All times in Romania (EET/EEST)",
    "helpSupport.additionalResources": "Additional Resources",
    "helpSupport.termsOfService": "Terms of Service",
    "helpSupport.privacyPolicy": "Privacy Policy",
    "helpSupport.coffeeBlog": "Coffee Blog",

    // Privacy Security Screen
    "privacySecurity.privacySettings": "Privacy Settings",
    "privacySecurity.locationTracking": "Location Tracking",
    "privacySecurity.locationTrackingDesc":
      "Allow us to use your location to find nearby cafes",
    "privacySecurity.analyticsData": "Analytics Data",
    "privacySecurity.analyticsDataDesc":
      "Help us improve the app by sharing usage analytics",
    "privacySecurity.crashReports": "Crash Reports",
    "privacySecurity.crashReportsDesc":
      "Send crash reports to help us fix issues",
    "privacySecurity.dataSharing": "Data Sharing",
    "privacySecurity.dataSharingDesc":
      "Share anonymized data with partner cafes",
    "privacySecurity.marketingEmails": "Marketing Emails",
    "privacySecurity.marketingEmailsDesc":
      "Receive promotional offers and updates",
    "privacySecurity.dataManagement": "Data Management",
    "privacySecurity.dataManagementDesc":
      "Manage your personal data and account information",
    "privacySecurity.downloadData": "Download My Data",
    "privacySecurity.downloadDataDesc":
      "Get a copy of all data stored in our system",
    "privacySecurity.downloadDataTitle": "Download Your Data",
    "privacySecurity.downloadDataMessage":
      "We'll prepare a download link with all your data and send it to your registered email address within 48 hours.",
    "privacySecurity.requestSubmitted": "Request Submitted",
    "privacySecurity.downloadRequestMessage":
      "You will receive an email with the data download link within 48 hours.",
    "privacySecurity.exportData": "Export Data",
    "privacySecurity.exportDataDesc":
      "Export your data for use with other services",
    "privacySecurity.dataPortability": "Data Portability",
    "privacySecurity.dataPortabilityMessage":
      "You can export your data in JSON format. This includes your profile, subscription history, and preferences.",
    "privacySecurity.deleteAllData": "Delete All Data",
    "privacySecurity.deleteAllDataDesc":
      "Permanently delete your account and all data",
    "privacySecurity.deleteDataTitle": "Delete All Data",
    "privacySecurity.deleteDataMessage":
      "This will permanently delete all your data including:\n\n• Profile information\n• Subscription history\n• Coffee redemption history\n• App preferences\n\nThis action cannot be undone.",
    "privacySecurity.finalConfirmation": "Final Confirmation",
    "privacySecurity.finalConfirmationMessage":
      "Are you absolutely sure? This will permanently delete your account and all associated data.",
    "privacySecurity.yesDeleteEverything": "Yes, Delete Everything",
    "privacySecurity.security": "Security",
    "privacySecurity.changePasswordDesc": "Update your account password",
    "privacySecurity.activeSessions": "Active Sessions",
    "privacySecurity.activeSessionsDesc": "View devices where you're logged in",
    "privacySecurity.activeSessionsMessage":
      "You're currently logged in on this device only. If you notice suspicious activity, please change your password immediately.",
    "privacySecurity.legalDocuments": "Legal Documents",
    "privacySecurity.gdprCompliance": "GDPR Compliance",
    "privacySecurity.gdprComplianceDesc": "Learn about our GDPR compliance",
    "privacySecurity.privacyPolicyTitle": "Privacy Policy",

    // About Screen
    "about.appName": "CoffeeShare",
    "about.tagline": "Your Coffee, Your Way, Every Day",
    "about.version": "Version 1.0.0",
    "about.build": "Build 1001 • January 2024",
    "about.ourMission": "Our Mission",
    "about.missionStatement":
      "CoffeeShare was born from a simple idea: to make great coffee more accessible and affordable for everyone. We believe that a perfect cup of coffee shouldn't be a luxury, but a daily pleasure that connects communities and fuels dreams.",
    "about.whatWeOffer": "What We Offer",
    "about.flexibleSubscriptions": "Flexible Subscriptions",
    "about.flexibleSubscriptionsDesc":
      "Choose from various coffee plans that fit your lifestyle",
    "about.partnerNetwork": "Partner Network",
    "about.partnerNetworkDesc":
      "Access to hundreds of partner cafes across Romania",
    "about.easyRedemption": "Easy Redemption",
    "about.easyRedemptionDesc":
      "Simple QR code system for quick coffee redemption",
    "about.smartTracking": "Smart Tracking",
    "about.smartTrackingDesc":
      "Track your coffee consumption and discover new favorites",
    "about.meetTheTeam": "Meet the Team",
    "about.founderName": "Alexandru Gheorghita",
    "about.founderRole": "Lead Developer & Founder",
    "about.founderDesc":
      "Full-stack developer with a passion for coffee and technology",
    "about.teamName": "CoffeeShare Team",
    "about.teamRole": "Development Team",
    "about.teamDesc": "Dedicated team making coffee accessible for everyone",
    "about.companyInformation": "Company Information",
    "about.companyName": "CoffeeShare SRL",
    "about.location": "Bucharest, Romania",
    "about.founded": "Founded in 2024",
    "about.email": "info@coffeeshare.ro",
    "about.website": "www.coffeeshare.ro",
    "about.specialThanks": "Special Thanks",
    "about.specialThanksDesc":
      "This app wouldn't be possible without the amazing open-source community and our supporters:",
    "about.reactNativeCommunity": "React Native Community",
    "about.expoFramework": "Expo Framework",
    "about.firebaseTeam": "Firebase Team",
    "about.coffeeLovers": "All the coffee lovers who inspired this app",
    "about.legal": "Legal",
    "about.openSourceLicenses": "Open Source Licenses",
    "about.copyright": "© 2024 CoffeeShare SRL. All rights reserved.",
    "about.madeWithLove": "Made with ❤️ and lots of ☕ in Romania",

    // Account Settings Index
    "accountSettings.description":
      "Manage your account settings, privacy preferences, and app configuration from the options below.",
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
