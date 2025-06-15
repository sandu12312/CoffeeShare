describe("CoffeeShare - Sistemul QR (Funcțional)", () => {
  beforeEach(() => {
    cy.cleanupTestData();
  });

  describe("Testare Pagină QR", () => {
    it("ar trebui să acceseze pagina de generare QR", () => {
      cy.visit("/generateQR");
      cy.wait(3000);

      cy.url().should("include", "/generateQR");
      cy.get("body").should("be.visible");
    });

    it("ar trebui să testeze interceptarea API pentru generarea QR", () => {
      cy.intercept("POST", "**/generateQRToken", {
        statusCode: 200,
        body: {
          success: true,
          qrToken: "mock-qr-token-123",
          expiresAt: new Date(Date.now() + 300000).toISOString(),
          cafeId: "mock-cafe-id",
        },
      }).as("generateQRRequest");

      cy.visit("/generateQR");
      cy.wait(2000);

      cy.window().then((win) => {
        fetch("/generateQRToken", {
          method: "POST",
          body: JSON.stringify({ userId: "test" }),
        });
      });

      cy.wait("@generateQRRequest").then((interception) => {
        expect(interception.response.statusCode).to.equal(200);
        expect(interception.response.body.qrToken).to.equal(
          "mock-qr-token-123"
        );
      });
    });

    it("ar trebui să gestioneze erorile de generare QR", () => {
      cy.intercept("POST", "**/generateQRToken", {
        statusCode: 400,
        body: {
          success: false,
          error: "Nu ai suficiente credite pentru a genera QR code",
        },
      }).as("generateQRErrorRequest");

      cy.visit("/generateQR");
      cy.wait(2000);

      cy.window().then((win) => {
        fetch("/generateQRToken", {
          method: "POST",
          body: JSON.stringify({ userId: "test" }),
        });
      });

      cy.wait("@generateQRErrorRequest").then((interception) => {
        expect(interception.response.statusCode).to.equal(400);
        expect(interception.response.body.success).to.be.false;
      });
    });
  });

  describe("Testare Scanare QR", () => {
    it("ar trebui să proceseze un QR code valid", () => {
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

      cy.intercept("POST", "**/processTransaction", {
        statusCode: 200,
        body: {
          success: true,
          transactionId: "mock-transaction-id",
          newBalance: 90,
          earningsRon: 5.5,
        },
      }).as("processTransactionRequest");

      cy.visit("/generateQR");
      cy.wait(2000);

      cy.simulateQRScan("mock-qr-token-123");

      cy.window().then((win) => {
        fetch("/validateQRToken", {
          method: "POST",
          body: JSON.stringify({ token: "mock-qr-token-123" }),
        }).then(() => {
          fetch("/processTransaction", {
            method: "POST",
            body: JSON.stringify({ qrToken: "mock-qr-token-123" }),
          });
        });
      });

      cy.wait("@validateQRRequest");
      cy.wait("@processTransactionRequest");
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

      cy.visit("/generateQR");
      cy.wait(2000);

      cy.simulateQRScan("expired-qr-token");

      cy.window().then((win) => {
        fetch("/validateQRToken", {
          method: "POST",
          body: JSON.stringify({ token: "expired-qr-token" }),
        });
      });

      cy.wait("@validateExpiredQRRequest").then((interception) => {
        expect(interception.response.body.expired).to.be.true;
      });
    });
  });

  describe("Testare Istoric Tranzacții", () => {
    it("ar trebui să afișeze istoricul tranzacțiilor", () => {
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

      cy.visit("/transactions");
      cy.wait(2000);

      cy.window().then((win) => {
        fetch("/getUserTransactions", {
          method: "GET",
        });
      });

      cy.wait("@getTransactionsRequest").then((interception) => {
        expect(interception.response.body.transactions).to.have.length(2);
        expect(interception.response.body.transactions[0].cafeName).to.equal(
          "Test Cafe 1"
        );
      });
    });
  });

  describe("Testare Integrare Abonamente", () => {
    it("ar trebui să verifice abonamentul activ", () => {
      cy.intercept("GET", "**/getUserSubscription", {
        statusCode: 200,
        body: {
          subscription: {
            id: "sub-1",
            name: "Premium",
            creditsLeft: 50,
            status: "active",
            expiresAt: new Date(Date.now() + 2592000000).toISOString(),
          },
        },
      }).as("getSubscriptionRequest");

      cy.visit("/generateQR");
      cy.wait(2000);

      cy.window().then((win) => {
        fetch("/getUserSubscription", {
          method: "GET",
        });
      });

      cy.wait("@getSubscriptionRequest").then((interception) => {
        expect(interception.response.body.subscription.status).to.equal(
          "active"
        );
        expect(interception.response.body.subscription.creditsLeft).to.equal(
          50
        );
      });
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
            expiresAt: new Date(Date.now() - 86400000).toISOString(),
          },
        },
      }).as("getExpiredSubscriptionRequest");

      cy.visit("/generateQR");
      cy.wait(2000);

      cy.window().then((win) => {
        fetch("/getUserSubscription", {
          method: "GET",
        });
      });

      cy.wait("@getExpiredSubscriptionRequest").then((interception) => {
        expect(interception.response.body.subscription.status).to.equal(
          "expired"
        );
        expect(interception.response.body.subscription.creditsLeft).to.equal(0);
      });
    });
  });

  describe("Testare cu Date Mock", () => {
    it("ar trebui să folosească datele din fixtures", () => {
      cy.fixture("test-data").then((data) => {
        expect(data.qrTokens.validToken.token).to.equal("mock-qr-token-123");
        expect(data.transactions.successful.beansUsed).to.equal(10);
        expect(data.cafes.testCafe1.businessName).to.equal("Test Cafe 1");
      });
    });

    it("ar trebui să simuleze un flux complet QR", () => {
      cy.fixture("test-data").then((data) => {
        const qrToken = data.qrTokens.validToken.token;
        const transaction = data.transactions.successful;

        cy.intercept("POST", "**/generateQRToken", {
          statusCode: 200,
          body: { success: true, qrToken: qrToken },
        }).as("generateQR");

        cy.intercept("POST", "**/validateQRToken", {
          statusCode: 200,
          body: { success: true, valid: true },
        }).as("validateQR");

        cy.intercept("POST", "**/processTransaction", {
          statusCode: 200,
          body: { success: true, transactionId: transaction.id },
        }).as("processTransaction");

        cy.visit("/generateQR");
        cy.wait(2000);

        cy.window().then((win) => {
          fetch("/generateQRToken", { method: "POST" })
            .then(() => {
              win.postMessage({ type: "QR_SCAN_RESULT", data: qrToken }, "*");
              return fetch("/validateQRToken", { method: "POST" });
            })
            .then(() => {
              return fetch("/processTransaction", { method: "POST" });
            });
        });

        cy.wait("@generateQR");
        cy.wait("@validateQR");
        cy.wait("@processTransaction");
      });
    });
  });
});
