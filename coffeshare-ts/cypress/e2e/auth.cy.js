describe("CoffeeShare - Modulul de Autentificare", () => {
  beforeEach(() => {
    cy.cleanupTestData();
  });

  describe("Pagina de Welcome", () => {
    it("ar trebui să afișeze pagina de welcome corect", () => {
      cy.visit("/welcome");
      cy.get('[data-testid="welcome-title"]').should("contain", "CoffeeShare");
      cy.get('[data-testid="login-link"]').should("be.visible");
      cy.get('[data-testid="register-link"]').should("be.visible");
    });

    it("ar trebui să navigheze la login când se apasă butonul de login", () => {
      cy.visit("/welcome");
      cy.get('[data-testid="login-link"]').click();
      cy.url().should("include", "/login");
    });

    it("ar trebui să navigheze la register când se apasă butonul de înregistrare", () => {
      cy.visit("/welcome");
      cy.get('[data-testid="register-link"]').click();
      cy.url().should("include", "/register");
    });
  });

  describe("Pagina de Login", () => {
    beforeEach(() => {
      cy.visit("/login");
    });

    it("ar trebui să afișeze formularul de login", () => {
      cy.get('[data-testid="email-input"]').should("be.visible");
      cy.get('[data-testid="password-input"]').should("be.visible");
      cy.get('[data-testid="login-button"]').should("be.visible");
      cy.get('[data-testid="forgot-password-link"]').should("be.visible");
    });

    it("ar trebui să afișeze eroare pentru email invalid", () => {
      cy.get('[data-testid="email-input"]').type("email-invalid");
      cy.get('[data-testid="password-input"]').type("password123");
      cy.get('[data-testid="login-button"]').click();
      cy.get('[data-testid="error-message"]').should(
        "contain",
        "Email invalid"
      );
    });

    it("ar trebui să afișeze eroare pentru câmpuri goale", () => {
      cy.get('[data-testid="login-button"]').click();
      cy.get('[data-testid="error-message"]').should("be.visible");
    });

    it("ar trebui să navigheze la forgot password", () => {
      cy.get('[data-testid="forgot-password-link"]').click();
      cy.url().should("include", "/forgot_password");
    });

    // Test pentru login cu credențiale valide (necesită mock sau test user)
    it("ar trebui să facă login cu credențiale valide", () => {
      // Acest test necesită un utilizator de test sau mock Firebase
      cy.intercept("POST", "**/identitytoolkit.googleapis.com/**", {
        statusCode: 200,
        body: {
          idToken: "mock-id-token",
          email: "test@coffeeshare.com",
          refreshToken: "mock-refresh-token",
          expiresIn: "3600",
          localId: "mock-user-id",
        },
      }).as("loginRequest");

      cy.get('[data-testid="email-input"]').type("test@coffeeshare.com");
      cy.get('[data-testid="password-input"]').type("password123");
      cy.get('[data-testid="login-button"]').click();

      cy.wait("@loginRequest");
      cy.url().should("not.include", "/login");
    });
  });

  describe("Pagina de Register", () => {
    beforeEach(() => {
      cy.visit("/register");
    });

    it("ar trebui să afișeze formularul de înregistrare", () => {
      cy.get('[data-testid="email-input"]').should("be.visible");
      cy.get('[data-testid="password-input"]').should("be.visible");
      cy.get('[data-testid="confirm-password-input"]').should("be.visible");
      cy.get('[data-testid="display-name-input"]').should("be.visible");
      cy.get('[data-testid="phone-input"]').should("be.visible");
      cy.get('[data-testid="register-button"]').should("be.visible");
    });

    it("ar trebui să valideze că parolele se potrivesc", () => {
      cy.get('[data-testid="password-input"]').type("password123");
      cy.get('[data-testid="confirm-password-input"]').type("password456");
      cy.get('[data-testid="register-button"]').click();
      cy.get('[data-testid="error-message"]').should(
        "contain",
        "Parolele nu se potrivesc"
      );
    });

    it("ar trebui să valideze formatul email-ului", () => {
      cy.get('[data-testid="email-input"]').type("email-invalid");
      cy.get('[data-testid="register-button"]').click();
      cy.get('[data-testid="error-message"]').should(
        "contain",
        "Email invalid"
      );
    });

    it("ar trebui să valideze lungimea parolei", () => {
      cy.get('[data-testid="password-input"]').type("123");
      cy.get('[data-testid="register-button"]').click();
      cy.get('[data-testid="error-message"]').should(
        "contain",
        "Parola trebuie să aibă cel puțin"
      );
    });

    it("ar trebui să înregistreze un utilizator nou cu date valide", () => {
      // Mock pentru înregistrare reușită
      cy.intercept("POST", "**/identitytoolkit.googleapis.com/**", {
        statusCode: 200,
        body: {
          idToken: "mock-id-token",
          email: "newuser@coffeeshare.com",
          refreshToken: "mock-refresh-token",
          expiresIn: "3600",
          localId: "mock-new-user-id",
        },
      }).as("registerRequest");

      const userData = {
        email: "newuser@coffeeshare.com",
        password: "password123",
        displayName: "Test User",
        phone: "+40123456789",
      };

      cy.registerUser(userData);
      cy.wait("@registerRequest");
      cy.url().should("not.include", "/register");
    });
  });

  describe("Pagina de Forgot Password", () => {
    beforeEach(() => {
      cy.visit("/forgot_password");
    });

    it("ar trebui să afișeze formularul de resetare parolă", () => {
      cy.get('[data-testid="email-input"]').should("be.visible");
      cy.get('[data-testid="reset-password-button"]').should("be.visible");
      cy.get('[data-testid="back-to-login-link"]').should("be.visible");
    });

    it("ar trebui să trimită email de resetare pentru email valid", () => {
      cy.intercept("POST", "**/identitytoolkit.googleapis.com/**", {
        statusCode: 200,
        body: { email: "test@coffeeshare.com" },
      }).as("resetPasswordRequest");

      cy.get('[data-testid="email-input"]').type("test@coffeeshare.com");
      cy.get('[data-testid="reset-password-button"]').click();

      cy.wait("@resetPasswordRequest");
      cy.checkNotification("Email de resetare trimis");
    });

    it("ar trebui să navigheze înapoi la login", () => {
      cy.get('[data-testid="back-to-login-link"]').click();
      cy.url().should("include", "/login");
    });
  });

  describe("Fluxul complet de autentificare", () => {
    it("ar trebui să permită înregistrarea și apoi login-ul", () => {
      // Mock pentru înregistrare
      cy.intercept(
        "POST",
        "**/identitytoolkit.googleapis.com/v1/accounts:signUp**",
        {
          statusCode: 200,
          body: {
            idToken: "mock-id-token",
            email: "flowtest@coffeeshare.com",
            refreshToken: "mock-refresh-token",
            expiresIn: "3600",
            localId: "mock-flow-user-id",
          },
        }
      ).as("registerRequest");

      // Mock pentru login
      cy.intercept(
        "POST",
        "**/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword**",
        {
          statusCode: 200,
          body: {
            idToken: "mock-id-token-login",
            email: "flowtest@coffeeshare.com",
            refreshToken: "mock-refresh-token-login",
            expiresIn: "3600",
            localId: "mock-flow-user-id",
          },
        }
      ).as("loginRequest");

      // Înregistrare
      const userData = {
        email: "flowtest@coffeeshare.com",
        password: "password123",
        displayName: "Flow Test User",
        phone: "+40123456789",
      };

      cy.registerUser(userData);
      cy.wait("@registerRequest");

      // Logout (dacă este logat automat)
      cy.logoutUser();

      // Login
      cy.loginUser("flowtest@coffeeshare.com", "password123");
      cy.wait("@loginRequest");

      // Verificare că suntem logați
      cy.url().should("not.include", "/login");
      cy.url().should("not.include", "/register");
    });
  });
});
