# 🧪 Ghid de Testare Cypress pentru CoffeeShare

## 📋 Cuprins

1. [Introducere](#introducere)
2. [Configurarea Mediului](#configurarea-mediului)
3. [Structura Testelor](#structura-testelor)
4. [Comenzi Personalizate](#comenzi-personalizate)
5. [Rularea Testelor](#rularea-testelor)
6. [Modulele Testate](#modulele-testate)
7. [Date de Test](#date-de-test)
8. [Best Practices](#best-practices)

## 🎯 Introducere

Acest ghid descrie implementarea testării End-to-End (E2E) pentru aplicația CoffeeShare folosind Cypress. Testele acoperă principalele funcționalități ale aplicației și asigură calitatea codului.

## ⚙️ Configurarea Mediului

### Instalarea Dependențelor

```bash
# Instalare Cypress
npm install --save-dev cypress --legacy-peer-deps

# Verificare instalare
npx cypress verify
```

### Configurarea Cypress

Fișierul `cypress.config.js` conține configurația principală:

- **baseUrl**: `http://localhost:8081` (aplicația Expo web)
- **viewport**: 375x667 (simulare mobil)
- **timeouts**: 10 secunde pentru comenzi
- **video/screenshots**: activate pentru debugging

## 📁 Structura Testelor

```
cypress/
├── e2e/                          # Teste End-to-End
│   ├── auth.cy.js               # Testare autentificare
│   ├── qr-system.cy.js          # Testare sistem QR
│   └── subscription-management.cy.js # Testare abonamente
├── fixtures/                    # Date de test
│   └── test-data.json          # Date mock pentru teste
├── support/                     # Configurare și comenzi
│   ├── commands.js             # Comenzi personalizate
│   └── e2e.js                  # Configurare globală
└── screenshots/                 # Screenshots la erori
```

## 🛠️ Comenzi Personalizate

### Autentificare

```javascript
// Login utilizator
cy.loginUser("test@coffeeshare.com", "password123");

// Logout utilizator
cy.logoutUser();

// Înregistrare utilizator nou
cy.registerUser({
  email: "new@coffeeshare.com",
  password: "password123",
  displayName: "New User",
  phone: "+40123456789",
});
```

### Sistem QR

```javascript
// Generare QR code
cy.generateQRCode();

// Simulare scan QR
cy.simulateQRScan("mock-qr-token-123");

// Verificare abonament activ
cy.checkActiveSubscription();
```

### Utilități

```javascript
// Curățare date test
cy.cleanupTestData();

// Verificare notificări
cy.checkNotification("Mesaj de succes");

// Navigare în aplicație
cy.navigateToTab("profile");
```

## 🚀 Rularea Testelor

### Comenzi NPM Disponibile

```bash
# Deschidere interfață Cypress
npm run cypress:open

# Rulare toate testele în headless mode
npm run cypress:run

# Rulare toate testele E2E
npm run test:e2e

# Rulare teste specifice
npm run test:e2e:auth           # Doar autentificare
npm run test:e2e:qr             # Doar sistem QR
npm run test:e2e:subscriptions  # Doar abonamente
```

### Rulare Manuală

```bash
# Pornire aplicație web
npm run web

# În alt terminal - rulare teste
npx cypress run --spec "cypress/e2e/auth.cy.js"
```

## 🧩 Modulele Testate

### 1. Modulul de Autentificare (`auth.cy.js`)

**Funcționalități testate:**

- ✅ Afișarea paginii de welcome
- ✅ Navigarea între pagini (login/register)
- ✅ Validarea formularelor
- ✅ Login cu credențiale valide/invalide
- ✅ Înregistrarea utilizatorilor noi
- ✅ Resetarea parolei
- ✅ Fluxul complet de autentificare

**Scenarii de test:**

```javascript
describe("Pagina de Login", () => {
  it("ar trebui să afișeze eroare pentru email invalid", () => {
    cy.visit("/login");
    cy.get('[data-testid="email-input"]').type("email-invalid");
    cy.get('[data-testid="password-input"]').type("password123");
    cy.get('[data-testid="login-button"]').click();
    cy.get('[data-testid="error-message"]').should("contain", "Email invalid");
  });
});
```

### 2. Sistemul QR (`qr-system.cy.js`)

**Funcționalități testate:**

- ✅ Generarea QR code-urilor
- ✅ Afișarea timpului de expirare
- ✅ Regenerarea QR code-urilor
- ✅ Scanarea și validarea QR
- ✅ Procesarea tranzacțiilor
- ✅ Gestionarea erorilor (QR expirat/invalid)
- ✅ Istoricul tranzacțiilor
- ✅ Integrarea cu abonamentele

**Scenarii de test:**

```javascript
describe("Generarea QR Code", () => {
  it("ar trebui să genereze un QR code valid", () => {
    cy.intercept("POST", "**/generateQRToken", {
      statusCode: 200,
      body: { success: true, qrToken: "mock-token" },
    }).as("generateQRRequest");

    cy.generateQRCode();
    cy.wait("@generateQRRequest");
    cy.get('[data-testid="qr-code-display"]').should("be.visible");
  });
});
```

### 3. Gestionarea Abonamentelor (`subscription-management.cy.js`)

**Funcționalități testate:**

- ✅ Afișarea abonamentelor disponibile
- ✅ Compararea planurilor
- ✅ Procesarea plăților
- ✅ Validarea datelor cardului
- ✅ Gestionarea abonamentului activ
- ✅ Auto-renewal și istoric
- ✅ Notificări și alerte
- ✅ Integrarea cu sistemul QR

**Scenarii de test:**

```javascript
describe("Achiziționarea Abonamentelor", () => {
  it("ar trebui să proceseze achiziția cu succes", () => {
    const userData = cy.fixture("test-data").then((data) => {
      cy.get('[data-testid="card-number-input"]').type(
        data.paymentCards.validCard.number
      );
      // ... rest of test
    });
  });
});
```

## 📊 Date de Test

Fișierul `cypress/fixtures/test-data.json` conține:

- **Utilizatori**: credențiale pentru diferite roluri
- **Abonamente**: planuri Basic, Premium, Pro
- **Cafenele**: locații de test
- **Produse**: cafea și prețuri
- **QR Tokens**: valide și expirate
- **Tranzacții**: de succes și eșuate
- **Carduri de plată**: valide, respinse, expirate
- **Notificări**: mesaje de test

## 📝 Best Practices

### 1. Selectori de Test

```javascript
// ✅ Folosește data-testid
cy.get('[data-testid="login-button"]');

// ❌ Evită selectori fragili
cy.get(".btn-primary"); // Se poate schimba
```

### 2. Interceptarea API-urilor

```javascript
// Mock pentru Firebase Auth
cy.intercept("POST", "**/identitytoolkit.googleapis.com/**", {
  statusCode: 200,
  body: { idToken: "mock-token" },
}).as("authRequest");

cy.wait("@authRequest");
```

### 3. Curățarea Datelor

```javascript
beforeEach(() => {
  cy.cleanupTestData(); // Curăță localStorage/sessionStorage
});
```

### 4. Așteptări Explicite

```javascript
// ✅ Așteptare pentru Firebase
cy.waitForFirebaseAuth();

// ✅ Așteptare pentru elemente
cy.get('[data-testid="loading"]').should("not.exist");
```

### 5. Gestionarea Erorilor

```javascript
// Testează atât cazurile de succes cât și cele de eșec
it("ar trebui să gestioneze erorile de plată", () => {
  cy.intercept("POST", "**/processPayment", {
    statusCode: 400,
    body: { error: "Card declined" },
  });
  // ... test error handling
});
```

## 🔧 Debugging și Troubleshooting

### Probleme Comune

1. **Timeouts**: Crește `defaultCommandTimeout` în config
2. **Firebase Auth**: Folosește mock-uri pentru teste
3. **Viewport**: Testează pe diferite dimensiuni
4. **Network**: Interceptează toate request-urile externe

### Debugging Tools

```javascript
// Pause test pentru debugging
cy.pause();

// Debug în browser
cy.debug();

// Log custom
cy.log("Custom message");
```

## 📈 Raportare și CI/CD

### Generarea Rapoartelor

```bash
# Rulare cu raport
npx cypress run --reporter mochawesome

# Generare video și screenshots
npx cypress run --record --key <record-key>
```

### Integrarea în CI/CD

```yaml
# GitHub Actions example
- name: Run Cypress Tests
  run: |
    npm run web &
    npm run cypress:run
```

## 🎯 Concluzie

Testele Cypress pentru CoffeeShare asigură:

- **Calitatea codului** prin testare automată
- **Detectarea timpurie** a bug-urilor
- **Documentarea comportamentului** aplicației
- **Încrederea în deploy-uri** prin validare continuă

Pentru întrebări sau probleme, consultă documentația Cypress sau contactează echipa de dezvoltare.
