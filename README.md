# Tindahan Mobile App

A mobile companion for Filipino sari-sari stores. Manage point-of-sale (POS),
inventory, utang (credit ledger), expenses, restocking, expiry tracking, pricing,
and reports — fully offline with on-device storage.

Built with **Expo SDK 57 + React Native + TypeScript + React Navigation**.
No backend required: auth and store data persist in `AsyncStorage`, and the
inventory database persists in embedded SQLite (`pos_inventory.db`).

---

## Offline-first inventory database

`InventoryScreen` (`src/screens/InventoryScreen.tsx`) implements the lab:
- DB service `src/services/db.ts`: `openDatabaseSync('pos_inventory.db')`,
  `PRAGMA journal_mode = WAL`, `CREATE TABLE IF NOT EXISTS products (...)`,
  index on `name`, auto-seed of 5 photo-backed products when empty
  (one-time `user_version` migration refreshes samples from earlier versions).
- `loadData(search)`: `SELECT *` or parameterized `WHERE name LIKE ?`,
  rendered in a virtualized `<FlatList>`; category chips filter in memory.
- `+ Add New Stock` (`AddStockScreen`) → parameterized `INSERT` (with photo);
  trash icon → confirm → `DELETE`; `−/+` → `UPDATE stock`; tap row →
  `EditProductScreen` (name, category, price, stock, photo).
- Product photos: bundled assets stored as `asset:<key>` and resolved via
  `imageSourceFor()`; camera/library shots stored as file URIs.
- Durability test: add 2, delete 1, enable Airplane Mode, kill Expo Go, relaunch — rows preserved.

---

## 1. Features

### Auth (local-only)
- Splash intro with branded mascot animation, then routes to `Main` or `Login`.
- Signup validates store name/email/password and goes to Login — new accounts
  are NOT signed in automatically (`@tindahan/pending-store` carries the name).
- Login accepts any credentials and Home greets `Mabuhay, <store>!`.
- Google button uses `expo-auth-session` for the OAuth flow UI, then enters `Main`.
- Logout clears the local session and resets to `Login`.
- No email confirmation, no network calls.

### POS
- `POSScreen`: same SQLite products as Inventory (reloaded every visit), category
  chips, cart building, photos.
- `PaymentScreen`: Cash/GCash/Credit, tendered/change math, cash-shortfall guard
  (cash under total is blocked), stock deducted per item on confirm.
- Sale completion returns to a cleared cart via `saleId`; going back keeps the cart.

### Inventory
- `InventoryScreen`: virtualized `FlatList`, SQL `LIKE` search, category chips,
  low-stock flags, per-row `−/+` steppers and delete, error box with retry.
- `AddStockScreen`: name, category sheet, price, qty, camera/library photo.
- `EditProductScreen` (modal): edit name, category, price, stock, photo.
- `StockExpiryEditorScreen` (modal): edit expiry info (draft-only).
- `ExpiryTrackerScreen`: view items by expiry.

### Utang (credit ledger)
- `UtangLedgerScreen`: per-customer rows (total, credit count, last-credited date).
- `UtangCustomerScreen`: full dated credit history per customer — product × qty,
  amount, credited date, due date; edit due dates, void entries.
- `AddUtangScreen`: multi-product staging list (search-gated SQLite products),
  existing-balance preview, one save writes a dated entry per product.
- `CreditPaymentModalScreen`: oldest-credit-first payments, customer picker.
- Every credit is date-stamped; ledger persists in `AsyncStorage`.

### More / utilities
- `DashboardScreen` (Home tab): store overview.
- `RestockListScreen`: restock drafts.
- `PricingCalculatorScreen`: price computation helper.
- `ExpensesScreen`: add/list expenses (`@tindahan/expenses`).
- `ReportsScreen`: summary view.
- `MoreScreen`: menu sheet + logout.

### Offline-first data
- Products persist in embedded SQLite (`pos_inventory.db`); auth session,
  ledger, and expenses persist in `AsyncStorage`.
- Every mutation persists immediately; data survives restarts and Airplane Mode.
- `OfflineBanner` auto-hides online (real NetInfo connectivity) and appears
  offline. No "sync" is claimed anywhere — there is no backend to sync to.

---

## 2. Tech stack

| Layer | Package | Version |
|---|---|---|
| Runtime | `expo` | `~57.0.26` |
| UI | `react`, `react-native` | `19.2.3`, `0.86.3` |
| Navigation | `@react-navigation/native`, `native-stack`, `bottom-tabs` | `^7.x` |
| Storage | `@react-native-async-storage/async-storage` | `2.2.0` |
| Database | `expo-sqlite` | `~57.0.4` (WAL, sync API, Expo Go compatible) |
| Photos | `expo-image-picker` | `~57.x` (camera + library, Expo Go compatible) |
| Connectivity | `@react-native-community/netinfo` | `^12.x` (real online/offline detection) |
| Auth UI | `expo-auth-session`, `expo-web-browser`, `expo-crypto` | `^57.x` |
| Styling | `expo-linear-gradient`, `expo-status-bar`, `expo-splash-screen` | `~57.x` |
| Gestures/screens | `react-native-gesture-handler`, `react-native-screens`, `react-native-safe-area-context`, `react-native-svg` | pinned for SDK 57 |
| Language | `typescript` | `~6.0.3` |
| Lint | `eslint`, `eslint-config-expo` | `^9`, `~57.0.2` |

Entry: `index.js` → `registerRootComponent(App)` → `App.tsx`.

---

## 3. Getting started

### Prerequisites
- Node.js LTS
- `npm` (repo uses `package-lock.json`)
- Expo Go app on a physical device, or an Android emulator / iOS simulator
- For native builds: EAS cloud builds (no local Xcode / Android Studio needed)

### Install
```bash
npm install
```

### Run
```bash
npx expo start          # dev server + QR for Expo Go
npx expo start --android
npx expo start --ios
npx expo start --web
```

Use `npx expo install <package>` (not plain `npm add`) when adding Expo-module
dependencies so SDK-compatible versions are resolved.

### Quality gates
```bash
npx tsc --noEmit   # typecheck
npx expo lint      # eslint
npx expo-doctor    # diagnose deps/config
npx expo install --fix  # fix incompatible versions
```

### Development build (only if you add native code)
Expo Go bundles a fixed set of native modules. After adding a library with
native code:
```bash
npx expo run:android
npx expo run:ios
# or cloud:
eas build --profile development
```

---

## 4. Project structure

```
App.tsx                    # AuthProvider > StoreProvider > NavigationContainer > AppNavigator
index.js                   # Expo root registration
app.json                   # Expo config (name, slug, scheme, icons, splash plugin)
package.json               # deps + scripts
tsconfig.json              # TypeScript config
eslint.config.js           # lint config
assets/                    # root icons/splash/favicon (Expo needs these at root)
src/
  assets/                  # bundled images: cat-avatar, cat-mascot, store-artwork,
                           # tab icons (home/pos/inventory/ledger/more), product photos
  auth/
    AuthContext.tsx        # canonical local auth (LocalSession, signIn/signUp/signOut)
    google.ts              # useGoogleAuth() via expo-auth-session/providers/google
  context/
    AuthContext.tsx        # re-export shim -> ../auth/AuthContext
  store/
    AppStore.tsx           # local store (ledger with credited dates, expenses + seeds)
  services/
    db.ts                  # SQLite: pos_inventory.db, seeds, CRUD, imageSourceFor()
  navigation/
    AppNavigator.tsx       # RootStack + 4 nested stacks + bottom tabs
    types.ts               # RootStack, POS, Inventory, Utang, More param lists + CartItem
  screens/                 # 20 screens (see table below)
  components/
    AuthHero.tsx           # mascot hero header for auth screens
    GoogleButton.tsx       # Google sign-in button
    SariSariHeader.tsx     # store header
    ProductCard.tsx        # inventory row
    CategorySheet.tsx      # category picker sheet
    EmptyState.tsx         # empty list placeholder
    OfflineBanner.tsx      # offline/queue banner (currently informational)
  theme/
    theme.ts               # colors, fontSize, fontWeight, radius, spacing, shadow
```

No `ios/` or `android/` directories: this project uses Continuous Native
Generation. Configure native behavior in `app.json`, never hand-edit native
folders.

---

## 5. Architecture

```
AuthProvider (src/auth/AuthContext.tsx)
  └─ StoreProvider (src/store/AppStore.tsx)
       └─ NavigationContainer
            └─ AppNavigator (RootStack: Splash → Login/Signup → Main tabs)
```

### Auth state
`src/auth/AuthContext.tsx`:
```ts
interface LocalSession { email: string; storeName?: string }
interface Auth {
  session: LocalSession | null;
  ready: boolean;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (email: string, password: string, storeName: string) => Promise<boolean>;
  signOut: () => Promise<void>;
}
```
- `ready=false` until `AsyncStorage '@tindahan/session'` is read.
- `SplashScreen` waits for `ready`, then `replace(session ? 'Main' : 'Login')`.
- `signUp` validates only (no auto-login); `signIn` persists the session.
- `signOut` removes the key and nulls state.
- Import via `useAuth()` from `src/auth/AuthContext` (or the
  `src/context/AuthContext` re-export).

### Store state
`src/store/AppStore.tsx`:
```ts
interface Product { id, name, meta, priceLabel, unitPrice, unit, supplier, stockLabel, status, low, cat, image? }
interface LedgerEntry { id, name, amount, note, status, pill, due?, date, productName?, qty? }
interface ExpenseEntry { id, label, amount }
```
- Keys: `@tindahan/products`, `@tindahan/ledger`, `@tindahan/expenses`, `@tindahan/session`.
- Products live in SQLite now; the store keeps the legacy product seeds plus ledger/expenses.
- Actions: `addProduct`, `addLedgerEntry` (date-stamped), `updateLedgerEntry`,
  `removeLedgerEntry`, `recordPayment`, `recordCustomerPayment` (oldest-first),
  `addExpense`, `updateProductPrice`.
- Import via `useStore()`.

### Navigation
`src/navigation/AppNavigator.tsx` + `types.ts`:
- `RootStack`: `Splash | Login | Signup | Main`.
- `Main` = bottom tabs: `Home (Dashboard) | POS (stack) | Inventory (stack) | Utang (stack) | More (stack)`.
- Stacks:
  - POS: `POSHome → Payment`
  - Inventory: `InventoryHome → AddStock`, modal `EditProduct`
  - Utang: `UtangHome → AddUtang → UtangCustomer`, modal `CreditPaymentModal`
  - More: `MoreHome → RestockList | ExpiryTracker | PricingCalculator | Expenses | Reports | StockExpiryEditor`
- Headers are hidden (`headerShown: false`); each screen renders its own header.
- Tab icons: `src/assets/home-storefront.png`, `pos-bayong.png`, `inventory-garapon.png`, `ledger-notebook.png`, `more-crate.png`.

---

## 6. Screens

| Screen | Route | Purpose |
|---|---|---|
| `SplashScreen` | `Splash` | Animated intro, waits for auth `ready`, auto-routes |
| `LoginScreen` | `Login` | Email/password + Google, inline validation, 48dp targets |
| `SignupScreen` | `Signup` | Store name + email + password (6+ chars), inline validation |
| `DashboardScreen` | `Home` | Store overview |
| `POSScreen` | `POSHome` | Cart building |
| `PaymentScreen` | `Payment` | Payment method + confirm |
| `InventoryScreen` | `InventoryHome` | SQLite `FlatList`, LIKE search, steppers, delete |
| `AddStockScreen` | `AddStock` | New product form + photo |
| `EditProductScreen` | `EditProduct` | Full product editor modal |
| `StockExpiryEditorScreen` | `StockExpiryEditor` | Expiry modal (Inventory + More stacks) |
| `UtangLedgerScreen` | `UtangHome` | Per-customer credit rows |
| `AddUtangScreen` | `AddUtang` | Multi-product credit staging + save |
| `UtangCustomerScreen` | `UtangCustomer` | Dated per-customer credit history |
| `CreditPaymentModalScreen` | `CreditPaymentModal` | Record payment modal |
| `MoreScreen` | `MoreHome` | Utility menu + logout → reset to `Login` |
| `RestockListScreen` | `RestockList` | Restock drafts |
| `ExpiryTrackerScreen` | `ExpiryTracker` | Expiry list |
| `PricingCalculatorScreen` | `PricingCalculator` | Pricing helper |
| `ExpensesScreen` | `Expenses` | Expense add/list |
| `ReportsScreen` | `Reports` | Summaries |

---

## 7. Components & theme

- `AuthHero`: mascot + greeting header on auth screens.
- `GoogleButton`: Google-branded button with loading state.
- `SariSariHeader`: `storeName + subtitle` header.
- `ProductCard`: inventory row (image, meta, price, stock pill).
- `CategorySheet`, `EmptyState`: sheets/placeholders.
- `OfflineBanner`: shows only when actually offline (NetInfo); hidden online.
- Theme (`src/theme/theme.ts`): `colors` (primary `#4F46E5`, background `#F5F6FC`, text `#1E1B4B`), `fontSize` (xs–xxl), `fontWeight`, `radius`, `spacing`, `shadow.card`.

---

## 8. Configuration

`app.json`:
- `name/slug`: `Tindahan-Mobile-App`
- `scheme`: `tindahan` (deep links, Google redirect via `makeRedirectUri({ scheme: 'tindahan' })`)
- `orientation`: `portrait`, `userInterfaceStyle`: `light`
- `icon`, Android adaptive icon, web favicon under `./assets/`
- `plugins`: `expo-splash-screen`, `expo-sqlite`
- Android status bar: `#4F46E5`, light content

Google OAuth (`src/auth/google.ts`): replace `CLIENT_IDS` placeholders with real
Google Cloud console client IDs for Android/iOS/Web to enable real Google auth.
Current flow enters `Main` after the auth-session success.

---

## 9. Future backend notes

The app is intentionally backend-free right now. To attach one in a future activity:
1. Add a client module (e.g. `src/auth/backend.ts` or `src/services/`).
2. Swap `AuthContext` persistence for token/session handling.
3. Replace `AppStore` mutations with API calls + local cache.
4. Wire env vars via `.env.local` (gitignored by `.env*.local`) and document them here.
5. Add `eas build --profile development` if new deps include native code.

---

## 10. Troubleshooting

| Symptom | Fix |
|---|---|
| QR won't load in Expo Go | Same Wi-Fi, or `npx expo start --tunnel` |
| Stuck on splash | Clear app storage (`@tindahan/session` corrupt → defaults to signed out) |
| Lint `react-hooks/refs` in `SplashScreen` | Pre-existing animation-ref pattern, unrelated to auth/store |
| `expo-doctor` version warnings | `npx expo install --fix` |
| Added native module crashes in Expo Go | Build a dev client (`npx expo run:android/ios` or EAS) |

---

## 11. Scripts reference

| Command | What it does |
|---|---|
| `npm install` | install deps |
| `npx expo start` | dev server |
| `npx expo start --android/ios/web` | platform target |
| `npx expo lint` | eslint (`eslint.config.js` + `eslint-config-expo`) |
| `npx tsc --noEmit` | typecheck (`tsconfig.json`) |
| `npx expo-doctor` | dependency/config diagnosis |

---

## License

School lab project. No license file controls reuse — ask your instructor before publishing.
