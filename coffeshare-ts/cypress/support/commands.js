// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// -- COMENZI PERSONALIZATE PENTRU COFFEESHARE --

// Comandă pentru login cu email și parolă
Cypress.Commands.add("loginUser", (email, password) => {
  cy.visit("/login");
  cy.get('[data-testid="email-input"]').type(email);
  cy.get('[data-testid="password-input"]').type(password);
  cy.get('[data-testid="login-button"]').click();
  cy.url().should("not.include", "/login");
});

// Comandă pentru logout
Cypress.Commands.add("logoutUser", () => {
  cy.get('[data-testid="profile-menu"]').click();
  cy.get('[data-testid="logout-button"]').click();
  cy.url().should("include", "/welcome");
});

// Comandă pentru înregistrare utilizator nou
Cypress.Commands.add("registerUser", (userData) => {
  cy.visit("/register");
  cy.get('[data-testid="email-input"]').type(userData.email);
  cy.get('[data-testid="password-input"]').type(userData.password);
  cy.get('[data-testid="confirm-password-input"]').type(userData.password);
  cy.get('[data-testid="display-name-input"]').type(userData.displayName);
  cy.get('[data-testid="phone-input"]').type(userData.phone);
  cy.get('[data-testid="register-button"]').click();
});

// Comandă pentru generare QR code
Cypress.Commands.add("generateQRCode", () => {
  cy.get('[data-testid="generate-qr-button"]').click();
  cy.get('[data-testid="qr-code-display"]').should("be.visible");
  cy.get('[data-testid="qr-token"]').should("exist");
});

// Comandă pentru adăugare produs în coș
Cypress.Commands.add("addProductToCart", (productName) => {
  cy.contains('[data-testid="product-card"]', productName).within(() => {
    cy.get('[data-testid="add-to-cart-button"]').click();
  });
  cy.get('[data-testid="cart-notification"]').should("be.visible");
});

// Comandă pentru verificare abonament activ
Cypress.Commands.add("checkActiveSubscription", () => {
  cy.get('[data-testid="subscription-status"]').should("contain", "Activ");
  cy.get('[data-testid="credits-remaining"]').should("be.visible");
});

// Comandă pentru simulare scan QR
Cypress.Commands.add("simulateQRScan", (qrToken) => {
  cy.window().then((win) => {
    win.postMessage(
      {
        type: "QR_SCAN_RESULT",
        data: qrToken,
      },
      "*"
    );
  });
});

// Comandă pentru așteptare încărcare Firebase
Cypress.Commands.add("waitForFirebaseAuth", () => {
  cy.wait(2000); // Așteptare pentru inițializarea Firebase
  // Verificare opțională pentru Firebase - nu forțăm existența
  cy.window().then((win) => {
    if (win.firebase) {
      cy.log("Firebase detected and loaded");
    } else {
      cy.log("Firebase not detected - continuing with test");
    }
  });
});

// Comandă pentru curățare date test
Cypress.Commands.add("cleanupTestData", () => {
  cy.window().then((win) => {
    if (win.localStorage) {
      win.localStorage.clear();
    }
    if (win.sessionStorage) {
      win.sessionStorage.clear();
    }
  });
});

// Comandă pentru verificare notificări
Cypress.Commands.add("checkNotification", (message) => {
  cy.get('[data-testid="notification"]').should("contain", message);
  cy.get('[data-testid="notification"]').should("be.visible");
});

// Comandă pentru navigare în aplicație
Cypress.Commands.add("navigateToTab", (tabName) => {
  cy.get(`[data-testid="tab-${tabName}"]`).click();
  cy.url().should("include", `/${tabName}`);
});

// -- OVERWRITE COMENZI EXISTENTE --
// Comentat pentru a evita probleme cu promisiunile
// Folosește manual cy.waitForFirebaseAuth() după cy.visit() când este necesar

// Cypress.Commands.overwrite("visit", (originalFn, url, options) => {
//   originalFn(url, options)
//   cy.waitForFirebaseAuth()
// })
