# FoodDash

A Next.js food delivery app with customer, restaurant, and delivery-partner accounts.

## Local setup

1. Copy `.env.example` to `.env.local` and add your MongoDB credentials.
2. Set `TOTP_ENCRYPTION_KEY` to a cryptographically random value of at least 32 characters. For example:

   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

   Keep this key private and use the same value wherever this database is deployed. It encrypts authenticator secrets; losing or changing it prevents enrolled accounts from verifying their codes.
3. Install dependencies and start the app:

   ```bash
   npm ci
   npm run dev
   ```

The app is served at `http://localhost:3000`. A reachable MongoDB connection is required for database-backed pages and APIs.

## Authenticator two-factor authentication

Customers, restaurants, and delivery partners can enable authenticator-based two-factor authentication from their profile. Confirm setup by scanning the QR code and entering a current six-digit code. Subsequent sign-ins verify the code automatically after all six digits are entered. Secrets are encrypted in MongoDB; they are never returned by account APIs.

## Installable app

The app includes a web manifest, app icons, a service worker, and an **Install App** header button. Installation prompts are available in supported browsers when served from HTTPS or localhost. On iOS, use the browser’s Share menu and choose **Add to Home Screen**.
