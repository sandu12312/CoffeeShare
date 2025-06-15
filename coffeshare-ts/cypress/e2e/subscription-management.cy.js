describe("CoffeeShare - Gestionarea Abonamentelor", () => {
  beforeEach(() => {
    cy.cleanupTestData();

    // Mock pentru utilizator autentificat
    cy.intercept("POST", "**/identitytoolkit.googleapis.com/**", {
      statusCode: 200,
      body: {
        idToken: "mock-id-token",
        email: "test@coffeeshare.com",
        refreshToken: "mock-refresh-token",
        expiresIn: "3600",
        localId: "mock-user-id",
      },
    }).as("authRequest");

    // Login înainte de fiecare test
    cy.loginUser("test@coffeeshare.com", "password123");
  });

  describe("Vizualizarea Abonamentelor Disponibile", () => {
    beforeEach(() => {
      cy.visit("/subscriptions");
    });

    it("ar trebui să afișeze lista de abonamente disponibile", () => {
      // Mock pentru abonamentele disponibile
      cy.intercept("GET", "**/getAvailableSubscriptions", {
        statusCode: 200,
        body: {
          subscriptions: [
            {
              id: "basic-plan",
              name: "Basic",
              credits: 50,
              price: 25.0,
              description: "Perfect pentru consumul ocazional",
              features: ["50 credite", "Valabilitate 30 zile", "Suport email"],
              isActive: true,
            },
            {
              id: "premium-plan",
              name: "Premium",
              credits: 120,
              price: 50.0,
              description: "Ideal pentru consumatorii regulați",
              features: [
                "120 credite",
                "Valabilitate 60 zile",
                "Suport prioritar",
                "Reduceri exclusive",
              ],
              isActive: true,
            },
            {
              id: "pro-plan",
              name: "Pro",
              credits: 250,
              price: 90.0,
              description: "Pentru adevărații iubitori de cafea",
              features: [
                "250 credite",
                "Valabilitate 90 zile",
                "Suport 24/7",
                "Acces early la noi cafenele",
              ],
              isActive: true,
            },
          ],
        },
      }).as("getSubscriptionsRequest");

      cy.wait("@getSubscriptionsRequest");

      cy.get('[data-testid="subscription-card"]').should("have.length", 3);
      cy.get('[data-testid="subscription-card"]')
        .first()
        .should("contain", "Basic");
      cy.get('[data-testid="subscription-card"]')
        .first()
        .should("contain", "50 credite");
      cy.get('[data-testid="subscription-card"]')
        .first()
        .should("contain", "25.00 RON");
    });

    it("ar trebui să afișeze detaliile unui abonament", () => {
      cy.intercept("GET", "**/getAvailableSubscriptions", {
        statusCode: 200,
        body: {
          subscriptions: [
            {
              id: "premium-plan",
              name: "Premium",
              credits: 120,
              price: 50.0,
              description: "Ideal pentru consumatorii regulați",
              features: [
                "120 credite",
                "Valabilitate 60 zile",
                "Suport prioritar",
              ],
              isActive: true,
            },
          ],
        },
      }).as("getSubscriptionsRequest");

      cy.wait("@getSubscriptionsRequest");

      cy.get('[data-testid="subscription-card"]').first().click();
      cy.get('[data-testid="subscription-modal"]').should("be.visible");
      cy.get('[data-testid="subscription-name"]').should("contain", "Premium");
      cy.get('[data-testid="subscription-description"]').should(
        "contain",
        "Ideal pentru consumatorii regulați"
      );
      cy.get('[data-testid="subscription-features"]').should(
        "contain",
        "120 credite"
      );
      cy.get('[data-testid="subscription-features"]').should(
        "contain",
        "Valabilitate 60 zile"
      );
    });

    it("ar trebui să permită compararea abonamentelor", () => {
      cy.intercept("GET", "**/getAvailableSubscriptions", {
        statusCode: 200,
        body: {
          subscriptions: [
            {
              id: "basic-plan",
              name: "Basic",
              credits: 50,
              price: 25.0,
              features: ["50 credite", "Valabilitate 30 zile"],
            },
            {
              id: "premium-plan",
              name: "Premium",
              credits: 120,
              price: 50.0,
              features: [
                "120 credite",
                "Valabilitate 60 zile",
                "Suport prioritar",
              ],
            },
          ],
        },
      }).as("getSubscriptionsRequest");

      cy.wait("@getSubscriptionsRequest");

      cy.get('[data-testid="compare-subscriptions-button"]').click();
      cy.get('[data-testid="comparison-modal"]').should("be.visible");
      cy.get('[data-testid="comparison-table"]').should("be.visible");
      cy.get('[data-testid="comparison-row"]').should(
        "have.length.at.least",
        2
      );
    });
  });

  describe("Achiziționarea Abonamentelor", () => {
    it("ar trebui să proceseze achiziția unui abonament cu succes", () => {
      // Mock pentru abonamentele disponibile
      cy.intercept("GET", "**/getAvailableSubscriptions", {
        statusCode: 200,
        body: {
          subscriptions: [
            {
              id: "basic-plan",
              name: "Basic",
              credits: 50,
              price: 25.0,
              description: "Perfect pentru consumul ocazional",
            },
          ],
        },
      }).as("getSubscriptionsRequest");

      // Mock pentru procesarea plății
      cy.intercept("POST", "**/processPayment", {
        statusCode: 200,
        body: {
          success: true,
          paymentId: "payment-123",
          subscriptionId: "user-sub-123",
        },
      }).as("processPaymentRequest");

      // Mock pentru activarea abonamentului
      cy.intercept("POST", "**/activateSubscription", {
        statusCode: 200,
        body: {
          success: true,
          subscription: {
            id: "user-sub-123",
            planId: "basic-plan",
            creditsLeft: 50,
            status: "active",
            expiresAt: new Date(Date.now() + 2592000000).toISOString(),
          },
        },
      }).as("activateSubscriptionRequest");

      cy.visit("/subscriptions");
      cy.wait("@getSubscriptionsRequest");

      cy.get('[data-testid="subscription-card"]')
        .first()
        .within(() => {
          cy.get('[data-testid="purchase-button"]').click();
        });

      // Completare detalii plată
      cy.get('[data-testid="payment-modal"]').should("be.visible");
      cy.get('[data-testid="card-number-input"]').type("4242424242424242");
      cy.get('[data-testid="expiry-input"]').type("12/25");
      cy.get('[data-testid="cvc-input"]').type("123");
      cy.get('[data-testid="cardholder-name-input"]').type("Test User");

      cy.get('[data-testid="confirm-payment-button"]').click();

      cy.wait("@processPaymentRequest");
      cy.wait("@activateSubscriptionRequest");

      cy.checkNotification("Abonament activat cu succes");
      cy.get('[data-testid="success-modal"]').should("be.visible");
      cy.get('[data-testid="new-subscription-details"]').should(
        "contain",
        "Basic"
      );
      cy.get('[data-testid="credits-received"]').should("contain", "50");
    });

    it("ar trebui să gestioneze erorile de plată", () => {
      cy.intercept("GET", "**/getAvailableSubscriptions", {
        statusCode: 200,
        body: {
          subscriptions: [
            {
              id: "premium-plan",
              name: "Premium",
              credits: 120,
              price: 50.0,
            },
          ],
        },
      }).as("getSubscriptionsRequest");

      cy.intercept("POST", "**/processPayment", {
        statusCode: 400,
        body: {
          success: false,
          error: "Card declined",
          errorCode: "card_declined",
        },
      }).as("processPaymentErrorRequest");

      cy.visit("/subscriptions");
      cy.wait("@getSubscriptionsRequest");

      cy.get('[data-testid="subscription-card"]')
        .first()
        .within(() => {
          cy.get('[data-testid="purchase-button"]').click();
        });

      cy.get('[data-testid="card-number-input"]').type("4000000000000002"); // Card declined
      cy.get('[data-testid="expiry-input"]').type("12/25");
      cy.get('[data-testid="cvc-input"]').type("123");
      cy.get('[data-testid="cardholder-name-input"]').type("Test User");

      cy.get('[data-testid="confirm-payment-button"]').click();
      cy.wait("@processPaymentErrorRequest");

      cy.checkNotification("Plata a fost respinsă");
      cy.get('[data-testid="payment-error"]').should("be.visible");
    });

    it("ar trebui să valideze datele cardului", () => {
      cy.visit("/subscriptions");

      cy.intercept("GET", "**/getAvailableSubscriptions", {
        statusCode: 200,
        body: {
          subscriptions: [{ id: "basic-plan", name: "Basic", price: 25.0 }],
        },
      }).as("getSubscriptionsRequest");

      cy.wait("@getSubscriptionsRequest");

      cy.get('[data-testid="subscription-card"]')
        .first()
        .within(() => {
          cy.get('[data-testid="purchase-button"]').click();
        });

      // Test card number invalid
      cy.get('[data-testid="card-number-input"]').type("1234");
      cy.get('[data-testid="confirm-payment-button"]').click();
      cy.get('[data-testid="card-error"]').should(
        "contain",
        "Numărul cardului este invalid"
      );

      // Test expiry invalid
      cy.get('[data-testid="card-number-input"]')
        .clear()
        .type("4242424242424242");
      cy.get('[data-testid="expiry-input"]').type("01/20"); // Expirat
      cy.get('[data-testid="confirm-payment-button"]').click();
      cy.get('[data-testid="expiry-error"]').should(
        "contain",
        "Cardul este expirat"
      );
    });
  });

  describe("Gestionarea Abonamentului Activ", () => {
    beforeEach(() => {
      // Mock pentru abonament activ
      cy.intercept("GET", "**/getUserSubscription", {
        statusCode: 200,
        body: {
          subscription: {
            id: "user-sub-active",
            planId: "premium-plan",
            planName: "Premium",
            creditsLeft: 85,
            totalCredits: 120,
            status: "active",
            purchaseDate: new Date(Date.now() - 604800000).toISOString(), // 7 zile în urmă
            expiresAt: new Date(Date.now() + 4536000000).toISOString(), // 52.5 zile
            autoRenew: true,
          },
        },
      }).as("getUserSubscriptionRequest");

      cy.visit("/my-subscription");
    });

    it("ar trebui să afișeze detaliile abonamentului activ", () => {
      cy.wait("@getUserSubscriptionRequest");

      cy.get('[data-testid="subscription-status"]').should("contain", "Activ");
      cy.get('[data-testid="plan-name"]').should("contain", "Premium");
      cy.get('[data-testid="credits-remaining"]').should("contain", "85");
      cy.get('[data-testid="credits-total"]').should("contain", "120");
      cy.get('[data-testid="expiry-date"]').should("be.visible");
      cy.get('[data-testid="auto-renew-status"]').should("contain", "Activă");
    });

    it("ar trebui să afișeze progresul utilizării creditelor", () => {
      cy.wait("@getUserSubscriptionRequest");

      cy.get('[data-testid="credits-progress-bar"]').should("be.visible");
      cy.get('[data-testid="credits-used"]').should("contain", "35"); // 120 - 85
      cy.get('[data-testid="usage-percentage"]').should("contain", "29%"); // 35/120 * 100
    });

    it("ar trebui să permită dezactivarea auto-renewal", () => {
      cy.wait("@getUserSubscriptionRequest");

      cy.intercept("POST", "**/updateAutoRenew", {
        statusCode: 200,
        body: {
          success: true,
          autoRenew: false,
        },
      }).as("updateAutoRenewRequest");

      cy.get('[data-testid="auto-renew-toggle"]').click();
      cy.get('[data-testid="confirm-auto-renew-modal"]').should("be.visible");
      cy.get('[data-testid="confirm-disable-auto-renew"]').click();

      cy.wait("@updateAutoRenewRequest");
      cy.checkNotification("Auto-renewal dezactivat");
      cy.get('[data-testid="auto-renew-status"]').should(
        "contain",
        "Dezactivată"
      );
    });

    it("ar trebui să afișeze istoricul abonamentelor", () => {
      cy.intercept("GET", "**/getSubscriptionHistory", {
        statusCode: 200,
        body: {
          history: [
            {
              id: "sub-history-1",
              planName: "Premium",
              purchaseDate: new Date(Date.now() - 604800000).toISOString(),
              expiryDate: new Date(Date.now() + 4536000000).toISOString(),
              status: "active",
              totalCredits: 120,
              amountPaid: 50.0,
            },
            {
              id: "sub-history-2",
              planName: "Basic",
              purchaseDate: new Date(Date.now() - 3456000000).toISOString(),
              expiryDate: new Date(Date.now() - 864000000).toISOString(),
              status: "expired",
              totalCredits: 50,
              amountPaid: 25.0,
            },
          ],
        },
      }).as("getSubscriptionHistoryRequest");

      cy.get('[data-testid="subscription-history-tab"]').click();
      cy.wait("@getSubscriptionHistoryRequest");

      cy.get('[data-testid="history-item"]').should("have.length", 2);
      cy.get('[data-testid="history-item"]')
        .first()
        .should("contain", "Premium");
      cy.get('[data-testid="history-item"]').first().should("contain", "Activ");
      cy.get('[data-testid="history-item"]').last().should("contain", "Basic");
      cy.get('[data-testid="history-item"]')
        .last()
        .should("contain", "Expirat");
    });
  });

  describe("Notificări și Alerte Abonament", () => {
    it("ar trebui să afișeze alertă pentru credite scăzute", () => {
      cy.intercept("GET", "**/getUserSubscription", {
        statusCode: 200,
        body: {
          subscription: {
            id: "user-sub-low-credits",
            planName: "Premium",
            creditsLeft: 5, // Credite scăzute
            totalCredits: 120,
            status: "active",
            expiresAt: new Date(Date.now() + 2592000000).toISOString(),
          },
        },
      }).as("getUserSubscriptionRequest");

      cy.visit("/my-subscription");
      cy.wait("@getUserSubscriptionRequest");

      cy.get('[data-testid="low-credits-alert"]').should("be.visible");
      cy.get('[data-testid="low-credits-alert"]').should(
        "contain",
        "Ai doar 5 credite rămase"
      );
      cy.get('[data-testid="renew-subscription-button"]').should("be.visible");
    });

    it("ar trebui să afișeze alertă pentru abonament care expiră curând", () => {
      cy.intercept("GET", "**/getUserSubscription", {
        statusCode: 200,
        body: {
          subscription: {
            id: "user-sub-expiring",
            planName: "Basic",
            creditsLeft: 25,
            totalCredits: 50,
            status: "active",
            expiresAt: new Date(Date.now() + 259200000).toISOString(), // 3 zile
          },
        },
      }).as("getUserSubscriptionRequest");

      cy.visit("/my-subscription");
      cy.wait("@getUserSubscriptionRequest");

      cy.get('[data-testid="expiring-soon-alert"]').should("be.visible");
      cy.get('[data-testid="expiring-soon-alert"]').should(
        "contain",
        "Abonamentul expiră în 3 zile"
      );
      cy.get('[data-testid="extend-subscription-button"]').should("be.visible");
    });

    it("ar trebui să trimită notificare pentru abonament expirat", () => {
      cy.intercept("GET", "**/getUserSubscription", {
        statusCode: 200,
        body: {
          subscription: {
            id: "user-sub-expired",
            planName: "Basic",
            creditsLeft: 0,
            totalCredits: 50,
            status: "expired",
            expiresAt: new Date(Date.now() - 86400000).toISOString(), // Ieri
          },
        },
      }).as("getUserSubscriptionRequest");

      cy.visit("/my-subscription");
      cy.wait("@getUserSubscriptionRequest");

      cy.get('[data-testid="expired-subscription-alert"]').should("be.visible");
      cy.get('[data-testid="expired-subscription-alert"]').should(
        "contain",
        "Abonamentul a expirat"
      );
      cy.get('[data-testid="renew-now-button"]').should("be.visible");
    });
  });

  describe("Integrarea cu Sistemul QR", () => {
    it("ar trebui să verifice abonamentul înainte de generarea QR", () => {
      cy.intercept("GET", "**/getUserSubscription", {
        statusCode: 200,
        body: {
          subscription: {
            id: "user-sub-valid",
            creditsLeft: 30,
            status: "active",
          },
        },
      }).as("getUserSubscriptionRequest");

      cy.visit("/generateQR");
      cy.wait("@getUserSubscriptionRequest");

      cy.get('[data-testid="generate-qr-button"]').should("not.be.disabled");
      cy.get('[data-testid="credits-display"]').should("contain", "30");
    });

    it("ar trebui să blocheze generarea QR pentru abonament fără credite", () => {
      cy.intercept("GET", "**/getUserSubscription", {
        statusCode: 200,
        body: {
          subscription: {
            id: "user-sub-no-credits",
            creditsLeft: 0,
            status: "active",
          },
        },
      }).as("getUserSubscriptionRequest");

      cy.visit("/generateQR");
      cy.wait("@getUserSubscriptionRequest");

      cy.get('[data-testid="generate-qr-button"]').should("be.disabled");
      cy.get('[data-testid="no-credits-message"]').should("be.visible");
      cy.get('[data-testid="buy-credits-button"]').should("be.visible");
    });
  });
});
