# CoffeeShare - Aplicație Mobile de Abonamente Cafea

## Descriere Generală

CoffeeShare este o aplicație mobilă dezvoltată cu **Expo React Native** și **TypeScript** care permite utilizatorilor să gestioneze abonamente pentru cafea. Aplicația oferă o experiență completă de administrare a abonamentelor prin sistemul "Coffee Lover" cu tracking de beans și funcționalități QR pentru validarea în cafenele.

## Starea Actuală a Proiectului

### ✅ Funcționalități Implementate

- **Autentificare Completă**: Înregistrare, login și gestionare utilizatori cu Firebase Authentication
- **Dashboard Funcțional**: Afișarea datelor de abonament (Coffee Lover plan cu 122/150 beans)
- **Sistem de Abonamente**: Model "Coffee Lover" cu tracking de beans în timp real
- **Arhitectură de Securitate**: Implementări avansate de securitate
- **Structură Modulară**: Organizare clară cu contexte, servicii și componente
- **Firebase Integration**: Configurare completă pentru auth, Firestore și cloud functions
- **QR Code System**: Generare și procesare coduri QR pentru validare cafenele

### ⚠️ Probleme Cunoscute

- **Firebase Indexes**: Indexurile composite sunt în construcție, afectând temporar query-urile pentru tranzacții
- **getWeeklyStats Error**: Funcția de statistici săptămânale necesită debugare
- **EAS Build Issues**: Probleme cu buildurile Android native (se folosește Expo Go pentru dezvoltare)

### 🔧 Tehnologii Utilizate

#### Stack Principal

- **Frontend**: React Native 0.76.9 + Expo SDK 53.0.11
- **Language**: TypeScript 5.3.3
- **Backend**: Firebase (Firestore, Authentication, Cloud Functions)
- **Navigation**: Expo Router 4.0.20
- **State Management**: React Context API

#### Securitate și Monitoring

- **Error Tracking**: Sentry integration
- **Secure Storage**: expo-secure-store pentru date sensibile
- **Device Security**: react-native-device-info pentru detectarea device-ului
- **SSL Pinning**: react-native-ssl-pinning pentru securitatea rețelei
- **Code Obfuscation**: react-native-obfuscating-transformer

#### Funcționalități Speciale

- **QR Codes**: react-native-qrcode-svg pentru generare
- **Barcode Scanner**: expo-barcode-scanner pentru validare
- **Maps**: react-native-maps cu Google Maps integration
- **Payments**: @stripe/stripe-react-native pentru procesare plăți
- **TOTP**: otpauth pentru autentificare în doi pași
- **Animations**: react-native-reanimated și react-native-animatable

## Structura Proiectului

```
coffeshare-ts/
├── app/                          # Expo Router - file-based routing
│   ├── (auth)/                  # Autentificare (login, register)
│   ├── (mainUsers)/             # Interfața utilizatori principali
│   │   ├── dashboard/           # Dashboard utilizator
│   │   ├── profile/             # Profil și setări
│   │   └── subscription/        # Gestionare abonamente
│   └── (cafenele)/              # Interfața pentru cafenele (admin)
├── components/                   # Componente reutilizabile
├── context/                      # React Context providers
│   ├── FirebaseContext.tsx     # Firebase authentication și configurare
│   ├── CartProvider.tsx        # Gestionare coș de cumpărături
│   └── LanguageProvider.tsx    # Suport multi-limbă
├── services/                     # Servicii și integrări
│   ├── qr/                     # Servicii pentru QR codes
│   ├── userProfile/            # Gestionare profile utilizatori
│   └── security/               # Servicii de securitate
├── utils/                        # Utilități și helper functions
├── config/                       # Configurări (Firebase, constante)
├── types/                        # TypeScript type definitions
├── styles/                       # Stiluri globale
├── assets/                       # Imagini, fonturi, resurse
├── hooks/                        # Custom React hooks
└── constants/                    # Constante aplicație
```

## Sistem de Abonamente

### Coffee Lover Plan (Implementat)

- **Capacitate**: 150 beans per abonament
- **Status Tracking**: Tracking în timp real (ex: 122/150 beans disponibili)
- **Validare**: QR codes pentru utilizare în cafenele
- **Statistici**: Dashboard cu progres și istoric utilizare

### Planuri Viitoare

- **Student Pack**: Abonament accesibil pentru studenți
- **Elite Pack**: Pentru utilizatori premium
- **Premium Pack**: Acces nelimitat

## Arhitectura de Securitate

### Implementări Actuale

- **Device Security Checks**: Detectarea device-urilor compromised
- **Secure Data Storage**: Toate datele sensibile în expo-secure-store
- **SSL Pinning**: Securizarea comunicațiilor rețea
- **Code Obfuscation**: Protecția codului sursă
- **Firebase Security Rules**: Reguli stricte pentru acces date
- **TOTP Authentication**: Sistem de autentificare în doi pași

### Monitoring și Logging

- **Sentry Integration**: Tracking erori în timp real
- **Firebase Analytics**: Monitorizarea comportamentului utilizatorilor
- **Performance Monitoring**: Tracking performanță aplicație

## Firebase Configuration

### Servicii Utilizate

- **Authentication**: Email/password cu verificare
- **Firestore**: Bază de date NoSQL pentru users, transactions, subscriptions
- **Cloud Functions**: Procesare backend și validări
- **Storage**: Pentru imagini și assets
- **Security Rules**: Protecția datelor și access control

### Indexuri Firestore (În Construcție)

```javascript
// Index pentru tranzacții utilizator
{
  "collectionGroup": "transactions",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "userId", "order": "ASCENDING" },
    { "fieldPath": "scannedAt", "order": "DESCENDING" },
    { "fieldPath": "__name__", "order": "DESCENDING" }
  ]
}
```

## Dezvoltare și Deployment

### Environment Setup

```bash
# Instalare dependințe
npm install

# Start development server
expo start --clear

# Rulare pe device
expo start --tunnel  # Pentru testare pe device real prin QR
```

### Build și Distribution

#### Expo Go (Metoda Actuală)

- **Avantaje**: Testare rapidă, deployment instant
- **Accesare**: Scanare QR code din Expo Go app
- **Compatibilitate**: Funcționează pe iOS și Android

#### EAS Build (În Dezvoltare)

- **Status**: Probleme cu buildurile Android native
- **Erori Cunoscute**: Gradle plugin conflicts, Java toolchain issues
- **Soluții în Lucru**: Optimizare configurație build

### Probleme Tehnice Rezolvate

#### SDK Upgrade

- **Upgrade**: De la Expo SDK 52 la 53.0.11
- **Compatibilitate**: React Native 0.76.9 cu TypeScript 5.3.3
- **Rezultat**: Îmbunătățiri de performanță și stabilitate

#### Module Compatibility

- **Probleme**: Conflicte cu expo-blur, expo-crypto
- **Soluții**: Înlocuire cu crypto-js și react-native-device-info
- **Rezultat**: Compatibilitate completă cu Expo Go

## QR Code System

### Implementare

- **Generare**: QR codes unice per utilizator/sesiune
- **Validare**: Scanare prin expo-barcode-scanner
- **Securitate**: Tokens cu expirare și validare server-side
- **Tracking**: Istoric utilizare și statistici

### Flow de Utilizare

1. Utilizatorul deschide aplicația
2. Accesează dashboard-ul cu datele abonamentului
3. Generează QR code pentru cafeneaua dorită
4. Cafeneaua scanează codul pentru validare
5. Sistem actualizează automat bean count

## Performance și Optimizare

### Optimizări Implementate

- **Bundle Size**: Code splitting și lazy loading
- **Memory Usage**: Optimizare imagini și cache management
- **Network**: SSL pinning și request optimization
- **Storage**: Secure local storage pentru date frecvent accesate

### Monitoring

- **Performance**: React DevTools integration
- **Errors**: Sentry pentru tracking și debugging
- **Analytics**: Firebase Analytics pentru user behavior

## Suport Multi-limbă

### Implementare

- **Provider**: LanguageProvider cu React Context
- **Limbi Suportate**: Română (primară), Engleză
- **Extensibilitate**: Sistem modular pentru adăugare limbi noi

## Viitoarele Dezvoltări

### Scurt Termn

- **Rezolvare Firebase Indexes**: Finalizarea indexurilor pentru query-uri
- **Fix getWeeklyStats**: Debugging și rezolvare erori statistici
- **EAS Build Optimization**: Rezolvarea problemelor de build nativ

### Mediu Termn

- **Maps Integration**: Integrare completă Google Maps pentru cafenele
- **Payment System**: Implementare completă Stripe pentru abonamente
- **Push Notifications**: Sistem de notificări pentru utilizatori

### Lung Termn

- **AI Recommendations**: Recomandări personalizate de cafenele
- **Social Features**: Sistem de prieteni și partajare experiențe
- **Analytics Dashboard**: Dashboard avansat pentru administratori

## Documentație Dezvoltator

### Quick Start

```bash
# Clone repository
git clone [repository-url]
cd LICENTAA/coffeshare-ts

# Install dependencies
npm install

# Setup Firebase configuration
# Add your firebase config in config/firebaseConfig.ts

# Start development
expo start --clear
```

### Environment Variables

```bash
# Firebase Configuration
FIREBASE_API_KEY=your_api_key
FIREBASE_AUTH_DOMAIN=your_auth_domain
FIREBASE_PROJECT_ID=your_project_id

# Google Maps
GOOGLE_MAPS_API_KEY=your_maps_api_key

# Sentry
SENTRY_DSN=your_sentry_dsn
```

### Testing

```bash
# Performance testing
npm run performance-test

# Install performance dependencies
npm run install-performance-deps
```

## Contribuții și Licență

### Dezvoltare

- **Autor Principal**: Alexandru Gheorghita
- **Scop**: Proiect de licență în Informatică
- **Status**: În dezvoltare activă

### Academic Context

- **Domeniu**: Computer Science (Informatică)
- **Focus**: Dezvoltare aplicații mobile cu emphasis pe securitate
- **Tehnologii**: React Native, Firebase, TypeScript, Advanced Security

---

**Nota**: Această documentație reflectă starea actuală a proiectului CoffeeShare și va fi actualizată pe măsură ce proiectul evoluează. Pentru informații actualizate despre probleme cunoscute și progres, consultați commit history și issue tracker.
