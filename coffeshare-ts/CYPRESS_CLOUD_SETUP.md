# Configurare Cypress Cloud pentru CoffeeShare

## Pasul 1: Crearea Contului Cypress Cloud

1. **Accesează Cypress Cloud:**

   - Mergi la: https://cloud.cypress.io/
   - Creează un cont nou sau loghează-te cu contul existent

2. **Creează un Proiect Nou:**
   - Click pe "Create new project"
   - Numele proiectului: `CoffeeShare Mobile App`
   - Descriere: `React Native mobile application for coffee subscription management`

## Pasul 2: Configurarea Proiectului Local

După ce ai creat proiectul în Cypress Cloud, vei primi:

- **Project ID** (ex: `abc123`)
- **Record Key** (ex: `d0afa9f3-3e9c-4c4b-aceb-f440a75453fc`)

### Actualizează cypress.config.js:

```javascript
const { defineConfig } = require("cypress");

module.exports = defineConfig({
  projectId: "PUNE_AICI_PROJECT_ID_UL_TAU", // Înlocuiește cu Project ID-ul real
  e2e: {
    baseUrl: "http://localhost:8081",
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
```

## Pasul 3: Rularea Testelor în Cloud

### Comenzi NPM disponibile:

```bash
# Rulează toate testele cu înregistrare în cloud
npm run cypress:run:record

# Rulează doar testele QR cu înregistrare în cloud
npm run test:e2e:qr:record

# Rulează toate testele E2E cu înregistrare în cloud
npm run test:e2e:record
```

### Comenzi directe Cypress:

```bash
# Rulează toate testele cu înregistrare
npx cypress run --record --key TU_RECORD_KEY_AICI

# Rulează teste specifice cu înregistrare
npx cypress run --spec 'cypress/e2e/qr-system-working.cy.js' --record --key TU_RECORD_KEY_AICI

# Rulează cu tag-uri pentru organizare
npx cypress run --record --key TU_RECORD_KEY_AICI --tag "production,qr-tests"
```

## Pasul 4: Configurarea CI/CD (Opțional)

### Pentru GitHub Actions:

```yaml
name: Cypress Tests
on: [push, pull_request]
jobs:
  cypress-run:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"

      - name: Install dependencies
        run: npm ci

      - name: Start Expo dev server
        run: npm run web &

      - name: Wait for server
        run: npx wait-on http://localhost:8081

      - name: Run Cypress tests
        run: npx cypress run --record --key ${{ secrets.CYPRESS_RECORD_KEY }}
        env:
          CYPRESS_RECORD_KEY: ${{ secrets.CYPRESS_RECORD_KEY }}
```

## Pasul 5: Beneficiile Cypress Cloud

### Dashboard Features:

- **Test Results:** Vizualizare rezultate în timp real
- **Screenshots & Videos:** Capturi automate la eșecuri
- **Test Analytics:** Statistici despre performanța testelor
- **Flaky Test Detection:** Identificarea testelor instabile
- **Parallelization:** Rularea testelor în paralel
- **Test Replay:** Revederea testelor eșuate

### Organizarea Testelor:

- **Tags:** Organizează testele pe categorii
- **Groups:** Grupează rulările de teste
- **Branches:** Urmărește testele pe diferite branch-uri

## Pasul 6: Comenzi Utile

```bash
# Verifică statusul proiectului
npx cypress info

# Rulează teste cu tag-uri specifice
npx cypress run --record --key YOUR_KEY --tag "smoke,critical"

# Rulează teste în paralel (necesită plan plătit)
npx cypress run --record --key YOUR_KEY --parallel

# Rulează cu grup specific
npx cypress run --record --key YOUR_KEY --group "Chrome Tests"
```

## Troubleshooting

### Probleme Comune:

1. **"Record Key not valid":**

   - Verifică că Project ID și Record Key sunt corecte
   - Asigură-te că Record Key-ul nu a fost revocat

2. **"Project not found":**

   - Verifică Project ID în cypress.config.js
   - Asigură-te că proiectul există în Cypress Cloud

3. **"Network errors":**
   - Verifică conexiunea la internet
   - Verifică firewall-ul companiei

### Comenzi de Debug:

```bash
# Rulează cu debug activat
DEBUG=cypress:* npx cypress run --record --key YOUR_KEY

# Verifică configurația
npx cypress verify

# Curăță cache-ul
npx cypress cache clear
```

## Status Actual

✅ **Testele locale funcționează perfect:** 10/10 teste QR passed  
✅ **Infrastructura Cypress configurată complet**  
✅ **Comenzi NPM pregătite pentru cloud**  
⏳ **Necesită configurarea Project ID în Cypress Cloud**

## Următorii Pași

1. Creează proiectul în Cypress Cloud
2. Copiază Project ID în `cypress.config.js`
3. Rulează: `npm run test:e2e:qr:record`
4. Verifică rezultatele în dashboard-ul Cypress Cloud

---

**Nota:** Record Key-ul `d0afa9f3-3e9c-4c4b-aceb-f440a75453fc` pe care l-ai furnizat trebuie să corespundă cu un proiect existent în Cypress Cloud. Dacă nu ai creat încă proiectul, urmează pașii de mai sus.
