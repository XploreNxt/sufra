# Surfa Customer App

The customer-facing food discovery app, built with Expo SDK 52, React Native, TypeScript, and React Navigation. The home screen currently uses typed local sample data; its data hook is the seam for a future Supabase integration.

## Requirements

- Node.js 20 or newer
- npm
- Expo Go compatible with SDK 52, or an iOS simulator / Android emulator

## Setup

From this directory:

```sh
npm install
```

Native dependencies are pinned to versions compatible with Expo SDK 52. If you add an Expo or React Native native module, install it with `npx expo install <package>` so Expo selects a compatible version.

## Run

From the repository root, first enter the mobile app folder:

```sh
cd apps/mobile
```

Then start Expo:

```sh
npx expo start
```

Scan the QR code with Expo Go, or press `a` for Android and `i` for the iOS simulator. You can also use `npm run android` or `npm run ios`.

The navigation does not contain a login screen. If a login page appears, confirm that Expo is running from `apps/mobile`; the repository-root `npm run dev` starts the separate web app.

## Customer, vendor and rider apps

This one codebase builds three apps. `EXPO_PUBLIC_APP_MODE` picks which one opens, and also sets the app name and Android package in `app.config.js`:

| Mode       | Run with                 | App name     | Package              |
| ---------- | ------------------------ | ------------ | -------------------- |
| `vendor`   | `npm run start:vendor`   | Surfa Vendor | `com.surfa.vendor`   |
| `customer` | `npm run start:customer` | Surfa        | `com.surfa.customer` |
| `rider`    | `npm run start:rider`    | Surfa Rider  | `com.surfa.rider`    |

With no mode set, the vendor app opens. The mode is read when the JavaScript is bundled, so restart Expo with `-c` after changing it (for example `npm run start:rider -- -c`).

## Checks

```sh
npx tsc --noEmit
npx expo-doctor
npm run lint
```

## Structure

- `src/screens/customer/` — customer home and product-details placeholder screens
- `src/screens/vendor/` — vendor dashboard, menu management, orders and earnings
- `src/screens/rider/` — rider dashboard (available jobs), order management (pickup and dropoff), earnings and performance
- `src/context/` — in-memory state for the cart, orders, vendor and rider, seeded from `src/data/`
- `src/navigation/` — typed native-stack and bottom-tab navigation
- `src/components/` — reusable common and home components
- `src/theme/` — shared colors, spacing, radii, and typography
- `src/data/mockFood.ts` — sample menu items, categories, and favorites
- `src/hooks/useHomeData.ts` — loading, refresh, and error boundary for home data

Mobile types mirror the relevant root menu-item fields without importing files from outside `apps/mobile`. No Metro monorepo watch-folder configuration is needed until the app imports shared files from the repository root.
