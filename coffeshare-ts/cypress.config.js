const { defineConfig } = require("cypress");

module.exports = defineConfig({
  projectId: "or1bs7", // Project ID pentru Cypress Cloud
  e2e: {
    baseUrl: "http://localhost:8081", // URL-ul aplicației Expo web
    supportFile: "cypress/support/e2e.js",
    specPattern: "cypress/e2e/**/*.cy.{js,jsx,ts,tsx}",
    viewportWidth: 375,
    viewportHeight: 667,
    video: true,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
  component: {
    devServer: {
      framework: "react",
      bundler: "webpack",
    },
    specPattern: "cypress/component/**/*.cy.{js,jsx,ts,tsx}",
    supportFile: "cypress/support/component.js",
  },
});
