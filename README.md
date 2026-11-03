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

## Run with Docker Compose

1. Copy `.env.example` to `.env` and set `TOTP_ENCRYPTION_KEY` to a random value of at least 32 characters. Keep this key stable; it encrypts authenticator secrets.
2. Start the app and bundled MongoDB:

   ```bash
   docker compose up --build -d
   ```

   Open `http://localhost:3000`. MongoDB data is stored in the `mongodb_data` volume and is not published to the host.
3. To use MongoDB Atlas or another MongoDB server, set `MONGODB_URI` in `.env`. Leave it empty to use the bundled MongoDB service.
4. Stop the services with `docker compose down`. This keeps database data; `docker compose down -v` also deletes it.

## Authenticator two-factor authentication

Customers, restaurants, and delivery partners can enable authenticator-based two-factor authentication from their profile. Confirm setup by scanning the QR code and entering a current six-digit code. Subsequent sign-ins verify the code automatically after all six digits are entered. Secrets are encrypted in MongoDB; they are never returned by account APIs.

## Installable app

The app includes a web manifest, app icons, a service worker, and an **Install App** header button. Installation prompts are available in supported browsers when served from HTTPS or localhost. On iOS, use the browser’s Share menu and choose **Add to Home Screen**.
