# CoffeeShare - Context

## Descriere Generală

CoffeeShare este o aplicație mobilă dezvoltată cu Expo React Native care permite utilizatorilor să achiziționeze abonamente pentru cafea. Similar cu aplicații precum 7card sau ESX, CoffeeShare oferă acces la o rețea de cafenele partenere prin intermediul unui abonament lunar.

## Funcționalități Principale

### Pentru Utilizatori

- Înregistrare și autentificare în aplicație
- Vizualizarea cafenelelor partenere pe o hartă interactivă
- Achiziționarea de abonamente lunare cu diferite limite de cafele pe zi
- Generarea unui cod QR pentru a fi scanat la cafenea
- Istoricul consumului de cafele
- Profilul utilizatorului cu detalii despre abonament

### Pentru Cafenele (Admin)

- Panou de administrare dedicat
- Adăugarea și gestionarea produselor disponibile
- Scanarea codurilor QR ale clienților
- Vizualizarea statisticilor și rapoartelor
- Configurarea tipurilor de abonamente acceptate

## Tipuri de Abonamente

CoffeeShare oferă mai multe tipuri de abonamente:

- **Student Pack**: 2 cafele pe zi, preț accesibil pentru studenți
- **Elite**: 3 cafele pe zi, acces la produse premium
- **Premium**: Cafele nelimitate, acces la toate produsele și oferte speciale

## Tehnologii Utilizate

- **Frontend**: React Native cu Expo
- **Backend & Bază de Date**: Firebase (Firestore, Authentication, Storage)
- **Hărți**: Google Maps API / Mapbox
- **Autentificare**: Firebase Authentication
- **Plăți**: Stripe / PayPal

## Interfețe Principale

Aplicația va avea două interfețe principale:

1. **Interfața pentru Utilizatori**: Focusată pe explorarea cafenelelor, gestionarea abonamentului și generarea codurilor QR
2. **Interfața pentru Cafenele**: Focusată pe scanarea codurilor, gestionarea produselor și vizualizarea statisticilor

## Design și Experiență Utilizator

Aplicația va avea un UI interactiv și modern, cu:

- Navigare intuitivă
- Animații fluide
- Mod întunecat/luminos
- Experiență consistentă pe iOS și Android
- Design adaptat pentru diferite dimensiuni de ecran

## Fluxul de Utilizare

1. Utilizatorul își creează un cont
2. Alege și achiziționează un abonament
3. Explorează cafenelele disponibile pe hartă
4. Vizitează o cafenea
5. Generează un cod QR din aplicație
6. Codul este scanat de cafenea
7. Utilizatorul primește cafeaua, iar contorul zilnic se actualizează

## Obiective de Dezvoltare

- Crearea unei experiențe utilizator fluide și intuitive
- Asigurarea scalabilității pentru adăugarea de noi cafenele partenere
- Implementarea unui sistem robust de gestionare a abonamentelor
- Dezvoltarea unui sistem securizat de autentificare și plăți

## Cerințe Comprehensive

### Cerințe Funcționale Esențiale

#### Autentificare și Gestionare Utilizatori

- Înregistrare cu email/parolă și opțiuni de social login (Google, Facebook)
- Recuperare parolă și verificare email
- Profiluri de utilizator cu informații personale și preferințe
- Roluri diferite pentru utilizatori și administratori de cafenele

#### Sistem de Abonamente

- Procesare plăți securizată pentru abonamente
- Notificări pentru reînnoirea abonamentelor
- Posibilitatea de upgrade/downgrade între abonamente
- Opțiuni de cadou/transfer abonament către alți utilizatori

#### Hartă și Localizare

- Afișarea cafenelelor în funcție de locația utilizatorului
- Filtrare cafenele după distanță, rating, tipuri de cafea oferite
- Rute și indicații către cafenelele selectate
- Informații detaliate despre program, facilități și meniu pentru fiecare cafenea

#### Sistem de Coduri QR

- Generare coduri QR unice și securizate
- Validare în timp real a codurilor
- Prevenirea fraudelor și a utilizării multiple
- Backup pentru situații când scanarea nu funcționează

#### Interfața Cafenelelor

- Dashboard cu statistici și analize
- Gestionarea inventarului și a produselor disponibile
- Sistem de notificări pentru comenzi noi
- Rapoarte financiare și de utilizare

### Cerințe Non-Funcționale

#### Performanță

- Timp de încărcare sub 2 secunde pentru ecranele principale
- Funcționare offline pentru funcționalități de bază
- Optimizare pentru consum redus de baterie
- Sincronizare eficientă a datelor

#### Securitate

- Criptarea datelor sensibile
- Conformitate cu GDPR și alte reglementări de protecție a datelor
- Autentificare în doi pași pentru conturi de administrator
- Audit logs pentru acțiunile importante

#### Scalabilitate

- Arhitectură care permite adăugarea rapidă de noi cafenele
- Suport pentru creșterea numărului de utilizatori
- Capacitate de a gestiona vârfuri de trafic

#### Accesibilitate

- Conformitate cu standardele WCAG 2.1
- Suport pentru cititor de ecran
- Contrast adecvat și opțiuni de text redimensionabil
- Navigare intuitivă fără dependență de culoare

### Cerințe Specifice Proiectului

#### Sistem de Loialitate

- Puncte bonus pentru utilizare frecventă
- Recompense pentru vizitarea de cafenele noi
- Program de referral pentru atragerea de noi utilizatori
- Oferte speciale pentru zile de naștere sau alte ocazii

#### Funcționalități Sociale

- Posibilitatea de a vedea prietenii apropiați
- Opțiuni de a invita prieteni la cafea
- Recenzii și evaluări pentru cafenele
- Partajare experiențe pe rețele sociale

#### Analitică Avansată

- Preferințe de cafea pentru utilizatori
- Tendințe de consum pentru cafenele
- Predicții pentru perioade aglomerate
- Recomandări personalizate bazate pe istoric

### Standarde și Bune Practici

#### Design și Usabilitate

- Respectarea principiilor Material Design/Human Interface Guidelines
- Consistență în interfață și interacțiuni
- Testare de utilizabilitate cu utilizatori reali
- Design responsive pentru toate dimensiunile de ecran

#### Dezvoltare și Implementare

- Arhitectură modulară pentru mentenabilitate
- Testare automată pentru funcționalitățile critice
- CI/CD pentru actualizări frecvente și stabile
- Documentație completă pentru dezvoltatori și utilizatori

#### Conformitate și Etică

- Transparență în colectarea și utilizarea datelor
- Opțiuni clare pentru preferințe de confidențialitate
- Conformitate cu reglementările locale pentru servicii de abonament
- Politici echitabile pentru cafenelele partenere

## Plan de Implementare Fazată

### Faza 1: MVP (Minimum Viable Product)

- Autentificare de bază
- Hartă simplă cu cafenele
- Sistem de abonamente de bază
- Generare și scanare coduri QR

### Faza 2: Îmbunătățiri Funcționale

- Sistem de plăți avansat
- Interfață administrativă completă
- Filtre avansate pentru hartă
- Istoric și statistici pentru utilizatori

### Faza 3: Caracteristici Avansate

- Funcționalități sociale
- Sistem de loialitate
- Analitică avansată
- Integrări cu alte servicii

## Site Map și Structura Aplicației

### Structura Generală

CoffeeShare
├── Autentificare
│ ├── Login
│ └── Register
├── Home
│ └── Map
├── Abonamente
│ └── Subscription
├── Cafenea
│ └── Details
└── Profil
└── Settings

### Detalii Pagini și Interconexiuni

#### Autentificare

- **Login**: Acces pentru utilizatori și cafenele cu opțiuni de social login
  - Conexiuni: → Înregistrare, → Recuperare Parolă, → Pagina Principală (după autentificare)
- **Înregistrare**: Formular pentru crearea unui cont nou (utilizator sau cafenea)
  - Conexiuni: → Login, → Pagina Principală (după înregistrare)
- **Recuperare Parolă**: Sistem de resetare a parolei prin email
  - Conexiuni: → Login

#### Interfața Utilizator

- **Pagina Principală (Dashboard)**

  - Rezumat abonament activ
  - Cafenele recomandate/favorite
  - Cafele consumate astăzi/săptămâna aceasta
  - Notificări și noutăți
  - Conexiuni: → Toate paginile utilizator

- **Hartă Cafenele**

  - Hartă interactivă cu toate cafenelele partenere
  - Filtre și opțiuni de căutare
  - Detalii cafenea la selectare
  - Conexiuni: → Profil Cafenea, → Cod QR, → Indicații Rutiere

- **Profil Utilizator**

  - Informații personale
  - Preferințe cafea
  - Istoric activitate
  - Conexiuni: → Setări, → Istoric Cafele, → Abonamente

- **Abonamente**a

  - Lista abonamentelor disponibile
  - Detalii abonament curent
  - Opțiuni de upgrade/downgrade
  - Procesare plăți
  - Conexiuni: → Profil Utilizator, → Istoric Cafele

- **Istoric Cafele**

  - Calendar cu cafele consumate
  - Statistici și grafice
  - Cafenele vizitate
  - Conexiuni: → Profil Utilizator, → Hartă Cafenele

- **Cod QR**

  - Generator cod QR pentru cafeneaua curentă
  - Validare și confirmare
  - Conexiuni: → Hartă Cafenele, → Istoric Cafele

- **Setări**
  - Preferințe aplicație
  - Notificări
  - Confidențialitate
  - Ajutor și suport
  - Conexiuni: → Profil Utilizator

#### Interfața Cafenea (Admin)

- **Dashboard Cafenea**

  - Rezumat activitate zilnică
  - Statistici rapide
  - Notificări importante
  - Conexiuni: → Toate paginile admin

- **Scanner QR**

  - Cameră pentru scanare coduri QR
  - Validare și confirmare
  - Istoric scanări recente
  - Conexiuni: → Dashboard Cafenea, → Rapoarte și Statistici

- **Gestionare Produse**

  - Adăugare/editare produse
  - Categorii și prețuri
  - Disponibilitate produse
  - Conexiuni: → Dashboard Cafenea, → Gestionare Abonamente

- **Rapoarte și Statistici**

  - Analize detaliate
  - Grafice de utilizare
  - Exportare date
  - Conexiuni: → Dashboard Cafenea, → Gestionare Produse

- **Setări Cafenea**

  - Profil cafenea
  - Ore de funcționare
  - Locație și contact
  - Preferințe aplicație
  - Conexiuni: → Dashboard Cafenea

- **Gestionare Abonamente**
  - Configurare abonamente acceptate
  - Reguli și restricții
  - Oferte speciale
  - Conexiuni: → Dashboard Cafenea, → Gestionare Produse

### Fluxuri de Navigare Principale

#### Flux Utilizator Nou

1. Înregistrare → Pagina Principală → Abonamente → Procesare Plată → Hartă Cafenele → Cod QR

#### Flux Utilizator Existent

1. Login → Pagina Principală → Hartă Cafenele → Cod QR → Istoric Cafele

#### Flux Cafenea

1. Login → Dashboard Cafenea → Scanner QR → Confirmare Comandă → Rapoarte și Statistici

### Componente Comune

- **Bară de Navigare**: Prezentă în toate paginile după autentificare
- **Meniu Lateral**: Acces rapid la funcționalitățile principale
- **Notificări**: Sistem de alerte accesibil din orice pagină
- **Căutare**: Funcționalitate globală pentru găsirea cafenelelor
- **Footer**: Informații de contact, termeni și condiții, politica de confidențialitate

### Responsive Design

Toate paginile vor fi adaptate pentru:

- Telefoane mobile (prioritate maximă)
- Tablete
- Desktop (pentru interfața de administrare a cafenelelor)

Structura va fi fluidă, cu elemente care se reorganizează în funcție de dimensiunea ecranului, menținând aceeași funcționalitate pe toate dispozitivele.

## Design Pagini Principale

### Dashboard Utilizator

#### Structură și Layout

![Customer Dashboard Mockup](https://placeholder-for-dashboard-mockup.png)

**Header**

- Logo CoffeeShare (stânga)
- Buton de notificări cu indicator pentru notificări necitite (dreapta)
- Avatar utilizator cu meniu dropdown pentru profil, setări și logout (dreapta)

**Secțiunea Principală**

1. **Card Abonament Activ**

   - Tip abonament (Student Pack/Elite/Premium) cu badge colorat
   - Dată expirare abonament
   - Contor cafele disponibile astăzi (ex: "1/2 cafele rămase astăzi")
   - Progres vizual (bară de progres circulară)
   - Buton "Reînnoire" sau "Upgrade" (dacă e cazul)

2. **Cafenele Recomandate**

   - Carusel orizontal cu 3-4 cafenele
   - Pentru fiecare cafenea:
     - Imagine cafenea
     - Nume cafenea
     - Distanța (ex: "300m")
     - Rating (stele)
     - Indicator de aglomerație (verde/galben/roșu)
   - Buton "Vezi toate" care duce la harta completă

3. **Activitate Recentă**

   - Ultimele 3 cafele consumate cu:
     - Nume cafenea
     - Data și ora
     - Tip cafea (dacă e disponibil)
     - Iconița cafenelei
   - Buton "Istoric complet"

4. **Statistici Rapide**

   - Card cu statistici săptămânale:
     - Total cafele consumate săptămâna aceasta
     - Comparație cu săptămâna anterioară (procent +/-)
     - Cafeneaua preferată
     - Grafic simplu cu consum pe zile

5. **Secțiune Socială** (opțional pentru MVP)
   - Prieteni apropiați care folosesc aplicația
   - Buton "Invită la cafea"
   - Activitate recentă a prietenilor

**Bară de Navigare (Bottom)**

- Buton Home/Dashboard (activ)
- Buton Hartă
- Buton QR (central, mai mare)
- Buton Abonamente
- Buton Profil

#### Funcționalități Interactive

1. **Generare Rapidă QR**

   - Buton mare "Comandă Cafea" care deschide un modal cu:
     - Selectare cafenea (dacă locația curentă e aproape de mai multe cafenele)
     - Generare cod QR
     - Opțiune de a selecta tipul de cafea (dacă cafeneaua permite)

2. **Notificări Contextuale**

   - Alertă pentru abonament care expiră curând
   - Oferte speciale de la cafenelele favorite
   - Reminder pentru cafele neutilizate ("Ai încă 2 cafele disponibile astăzi!")

3. **Widget Meteo** (opțional)

   - Temperatură curentă
   - Sugestie de cafea bazată pe vreme (ex: "Zi perfectă pentru un Frappuccino!")

4. **Căutare Rapidă**
   - Bară de căutare pentru găsirea rapidă a cafenelelor
   - Sugestii bazate pe istoric și preferințe

#### Personalizare și Adaptabilitate

- **Teme**: Suport pentru mod întunecat/luminos
- **Personalizare**: Opțiuni pentru reorganizarea cardurilor în dashboard
- **Adaptare Contextuală**:
  - Dimineața: Focus pe cafenele deschise și aproape
  - Weekend: Sugestii de cafenele cu spații pentru lucru/studiu
  - Seara: Cafenele cu program prelungit

#### Stări și Feedback

- **Stare Inactivă**: Informații generale și recomandări
- **Stare Activă**: Când utilizatorul este într-o cafenea, dashboard-ul se transformă pentru a facilita comanda
- **Feedback**: După fiecare comandă, opțiune rapidă de rating (1-5 stele)
- **Erori**: Notificări clare pentru probleme (ex: "Abonamentul a expirat", "Ai atins limita de cafele pentru astăzi")

#### Experiență First-Time User

Pentru utilizatorii noi, dashboard-ul va afișa:

- Tutorial rapid cu overlay explicativ
- Sugestii pentru primii pași (completare profil, alegere abonament, explorare cafenele)
- Ofertă specială pentru primul abonament

#### Optimizare pentru Performanță

- Încărcare progresivă a conținutului
- Caching local pentru date frecvent accesate
- Prioritizare vizuală a elementelor esențiale

#### Accesibilitate

- Contrast adecvat pentru text și elemente interactive
- Etichete pentru cititor de ecran
- Opțiuni de mărire text
- Navigare completă prin tastatură/gesturi alternative

Acest dashboard este proiectat pentru a oferi utilizatorilor o experiență intuitivă și eficientă, concentrându-se pe funcționalitățile cele mai frecvent utilizate, oferind în același timp acces rapid la toate caracteristicile aplicației.

---
