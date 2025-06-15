describe("CoffeeShare - Sistemul QR", () => {
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
  });

  describe("Generarea QR Code", () => {
    beforeEach(() => {
      cy.visit("/generateQR");
    });

    it("ar trebui să afișeze pagina de generare QR", () => {
      cy.get('[data-testid="generate-qr-title"]').should(
        "contain",
        "Generează QR Code"
      );
      cy.get('[data-testid="generate-qr-button"]').should("be.visible");
      cy.get('[data-testid="qr-instructions"]').should("be.visible");
    });

    it("ar trebui să genereze un QR code valid", () => {
      // Mock pentru generarea QR token
      cy.intercept("POST", "**/generateQRToken", {
        statusCode: 200,
        body: {
          success: true,
          qrToken: "mock-qr-token-123",
          expiresAt: new Date(Date.now() + 300000).toISOString(), // 5 minute
          cafeId: "mock-cafe-id",
        },
      }).as("generateQRRequest");

      cy.generateQRCode();
      cy.wait("@generateQRRequest");

      // Verificare că QR code-ul este afișat
      cy.get('[data-testid="qr-code-display"]').should("be.visible");
      cy.get('[data-testid="qr-token"]').should("contain", "mock-qr-token-123");
      cy.get('[data-testid="qr-expiry"]').should("be.visible");
    });

    it("ar trebui să afișeze timpul de expirare al QR code-ului", () => {
      cy.intercept("POST", "**/generateQRToken", {
        statusCode: 200,
        body: {
          success: true,
          qrToken: "mock-qr-token-456",
          expiresAt: new Date(Date.now() + 300000).toISOString(),
          cafeId: "mock-cafe-id",
        },
      }).as("generateQRRequest");

      cy.generateQRCode();
      cy.wait("@generateQRRequest");

      cy.get('[data-testid="qr-expiry-timer"]').should("be.visible");
      cy.get('[data-testid="qr-expiry-timer"]').should("contain", "4:");
    });

    it("ar trebui să permită regenerarea QR code-ului", () => {
      // Prima generare
      cy.intercept("POST", "**/generateQRToken", {
        statusCode: 200,
        body: {
          success: true,
          qrToken: "mock-qr-token-first",
          expiresAt: new Date(Date.now() + 300000).toISOString(),
          cafeId: "mock-cafe-id",
        },
      }).as("firstQRRequest");

      cy.generateQRCode();
      cy.wait("@firstQRRequest");

      // A doua generare
      cy.intercept("POST", "**/generateQRToken", {
        statusCode: 200,
        body: {
          success: true,
          qrToken: "mock-qr-token-second",
          expiresAt: new Date(Date.now() + 300000).toISOString(),
          cafeId: "mock-cafe-id",
        },
      }).as("secondQRRequest");

      cy.get('[data-testid="regenerate-qr-button"]').click();
      cy.wait("@secondQRRequest");

      cy.get('[data-testid="qr-token"]').should(
        "contain",
        "mock-qr-token-second"
      );
    });

    it("ar trebui să gestioneze erorile de generare QR", () => {
      cy.intercept("POST", "**/generateQRToken", {
        statusCode: 400,
        body: {
          success: false,
          error: "Nu ai suficiente credite pentru a genera QR code",
        },
      }).as("generateQRErrorRequest");

      cy.get('[data-testid="generate-qr-button"]').click();
      cy.wait("@generateQRErrorRequest");

      cy.checkNotification("Nu ai suficiente credite");
      cy.get('[data-testid="qr-code-display"]').should("not.exist");
    });
  });

  describe("Scanarea QR Code", () => {
    it("ar trebui să proceseze un QR code valid", () => {
      // Mock pentru validarea QR token
      cy.intercept("POST", "**/validateQRToken", {
        statusCode: 200,
        body: {
          success: true,
          valid: true,
          userId: "mock-user-id",
          cafeId: "mock-cafe-id",
          cafeName: "Test Cafe",
          beansToDeduct: 10,
        },
      }).as("validateQRRequest");

      // Mock pentru procesarea tranzacției
      cy.intercept("POST", "**/processTransaction", {
        statusCode: 200,
        body: {
          success: true,
          transactionId: "mock-transaction-id",
          newBalance: 90,
          earningsRon: 5.5,
        },
      }).as("processTransactionRequest");

      // Simulare scan QR
      cy.simulateQRScan("mock-qr-token-123");

      cy.wait("@validateQRRequest");
      cy.wait("@processTransactionRequest");

      // Verificare notificare de succes
      cy.checkNotification("Tranzacție procesată cu succes");
      cy.get('[data-testid="transaction-details"]').should("be.visible");
      cy.get('[data-testid="new-balance"]').should("contain", "90");
    });

    it("ar trebui să respingă un QR code expirat", () => {
      cy.intercept("POST", "**/validateQRToken", {
        statusCode: 400,
        body: {
          success: false,
          error: "QR code expirat",
          expired: true,
        },
      }).as("validateExpiredQRRequest");

      cy.simulateQRScan("expired-qr-token");
      cy.wait("@validateExpiredQRRequest");

      cy.checkNotification("QR code expirat");
      cy.get('[data-testid="transaction-details"]').should("not.exist");
    });

    it("ar trebui să respingă un QR code invalid", () => {
      cy.intercept("POST", "**/validateQRToken", {
        statusCode: 400,
        body: {
          success: false,
          error: "QR code invalid",
          valid: false,
        },
      }).as("validateInvalidQRRequest");

      cy.simulateQRScan("invalid-qr-token");
      cy.wait("@validateInvalidQRRequest");

      cy.checkNotification("QR code invalid");
    });
  });

  describe("Istoricul QR și Tranzacții", () => {
    beforeEach(() => {
      cy.visit("/transactions");
    });

    it("ar trebui să afișeze istoricul tranzacțiilor", () => {
      // Mock pentru istoricul tranzacțiilor
      cy.intercept("GET", "**/getUserTransactions", {
        statusCode: 200,
        body: {
          transactions: [
            {
              id: "trans-1",
              cafeName: "Test Cafe 1",
              beansUsed: 10,
              earningsRon: 5.5,
              createdAt: new Date().toISOString(),
              status: "completed",
            },
            {
              id: "trans-2",
              cafeName: "Test Cafe 2",
              beansUsed: 15,
              earningsRon: 8.25,
              createdAt: new Date(Date.now() - 86400000).toISOString(),
              status: "completed",
            },
          ],
        },
      }).as("getTransactionsRequest");

      cy.wait("@getTransactionsRequest");

      cy.get('[data-testid="transaction-item"]').should("have.length", 2);
      cy.get('[data-testid="transaction-item"]')
        .first()
        .should("contain", "Test Cafe 1");
      cy.get('[data-testid="transaction-item"]')
        .first()
        .should("contain", "10 beans");
      cy.get('[data-testid="transaction-item"]')
        .first()
        .should("contain", "5.50 RON");
    });

    it("ar trebui să filtreze tranzacțiile după dată", () => {
      cy.intercept("GET", "**/getUserTransactions**", {
        statusCode: 200,
        body: {
          transactions: [
            {
              id: "trans-today",
              cafeName: "Today Cafe",
              beansUsed: 10,
              earningsRon: 5.5,
              createdAt: new Date().toISOString(),
              status: "completed",
            },
          ],
        },
      }).as("getFilteredTransactionsRequest");

      cy.get('[data-testid="date-filter"]').click();
      cy.get('[data-testid="today-filter"]').click();

      cy.wait("@getFilteredTransactionsRequest");
      cy.get('[data-testid="transaction-item"]').should("have.length", 1);
      cy.get('[data-testid="transaction-item"]').should(
        "contain",
        "Today Cafe"
      );
    });

    it("ar trebui să afișeze detaliile unei tranzacții", () => {
      cy.intercept("GET", "**/getUserTransactions", {
        statusCode: 200,
        body: {
          transactions: [
            {
              id: "trans-detail",
              cafeName: "Detail Cafe",
              beansUsed: 20,
              earningsRon: 11.0,
              createdAt: new Date().toISOString(),
              status: "completed",
              qrToken: "detail-qr-token",
              cafeAddress: "Strada Test 123",
            },
          ],
        },
      }).as("getTransactionsRequest");

      cy.wait("@getTransactionsRequest");

      cy.get('[data-testid="transaction-item"]').first().click();
      cy.get('[data-testid="transaction-modal"]').should("be.visible");
      cy.get('[data-testid="transaction-cafe-name"]').should(
        "contain",
        "Detail Cafe"
      );
      cy.get('[data-testid="transaction-address"]').should(
        "contain",
        "Strada Test 123"
      );
      cy.get('[data-testid="transaction-qr-token"]').should(
        "contain",
        "detail-qr-token"
      );
    });
  });

  describe("Integrarea cu Abonamentele", () => {
    it("ar trebui să verifice abonamentul activ înainte de generarea QR", () => {
      // Mock pentru verificarea abonamentului
      cy.intercept("GET", "**/getUserSubscription", {
        statusCode: 200,
        body: {
          subscription: {
            id: "sub-1",
            name: "Premium",
            creditsLeft: 50,
            status: "active",
            expiresAt: new Date(Date.now() + 2592000000).toISOString(), // 30 zile
          },
        },
      }).as("getSubscriptionRequest");

      cy.visit("/generateQR");
      cy.wait("@getSubscriptionRequest");

      cy.checkActiveSubscription();
      cy.get('[data-testid="credits-remaining"]').should("contain", "50");
      cy.get('[data-testid="generate-qr-button"]').should("not.be.disabled");
    });

    it("ar trebui să blocheze generarea QR pentru abonament expirat", () => {
      cy.intercept("GET", "**/getUserSubscription", {
        statusCode: 200,
        body: {
          subscription: {
            id: "sub-expired",
            name: "Basic",
            creditsLeft: 0,
            status: "expired",
            expiresAt: new Date(Date.now() - 86400000).toISOString(), // Ieri
          },
        },
      }).as("getExpiredSubscriptionRequest");

      cy.visit("/generateQR");
      cy.wait("@getExpiredSubscriptionRequest");

      cy.get('[data-testid="subscription-status"]').should(
        "contain",
        "Expirat"
      );
      cy.get('[data-testid="generate-qr-button"]').should("be.disabled");
      cy.get('[data-testid="renew-subscription-link"]').should("be.visible");
    });
  });
});
