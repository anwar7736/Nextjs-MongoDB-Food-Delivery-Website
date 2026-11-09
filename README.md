# FoodFlow AI

A Next.js food delivery app with customer, restaurant, and delivery-partner accounts.

## Local setup

1. Copy `.env.example` to `.env.local` and add your MongoDB credentials. Set `MONGODB_URI` if you use a cluster other than the default Atlas cluster; local development requires a network that can resolve and reach the MongoDB host.
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
2. Start the app and bundled single-node MongoDB replica set (required for transactional order placement):

   ```bash
   docker compose up --build -d
   ```

   Open `http://localhost:3000`. MongoDB data is stored in the `mongodb_data` volume and is not published to the host.
3. To use MongoDB Atlas or another MongoDB server, set `MONGODB_URI` in `.env`. Leave it empty to use the bundled MongoDB service.
4. Stop the services with `docker compose down`. This keeps database data; `docker compose down -v` also deletes it.

## Authenticator two-factor authentication

Customers, restaurants, and delivery partners can enable authenticator-based two-factor authentication from their profile. Confirm setup by scanning the QR code and entering a current six-digit code. Subsequent sign-ins verify the code automatically after all six digits are entered. Secrets are encrypted in MongoDB; they are never returned by account APIs.

All three account types must verify their email during registration. Verification codes expire after 10 minutes, can be resent once per minute, and allow at most five attempts.

## n8n customer assistant

The website's floating chat button now opens a FoodFlow assistant that accepts typed or spoken messages, recommends local restaurants/food, and takes a guest order by asking for city, restaurant, menu items and quantities, customer name, delivery address, and phone. It shows a price summary and only places the order after the customer confirms. The browser's speech-recognition support depends on the browser and microphone permission. The website chat uses `/api/v1/assistant` and talks directly to FoodFlow's database-backed assistant, even when `N8N_WEBHOOK_URL` is configured. The optional n8n webhook is for external chat channels; it does not proxy the website's menu or order steps.

An optional importable generic-webhook workflow is available at [n8n/foodflow-customer-assistant.json](./n8n/foodflow-customer-assistant.json). It forwards external customer messages to the n8n API and returns recommendations or an order invoice with a greeting. The webhook response includes a customer-facing `reply` string; display that string in the channel's message box so order confirmations show the greeting and invoice as readable text. The response also preserves structured invoice data. Successful chat recommendations pass through a Google Gemini AI Agent for concise, language-aware phrasing. A Simple Memory node keeps the last five chat interactions per session to help with language and conversational context. Send a stable, opaque `sessionId` for each active customer conversation (and an optional `channel` to separate channels); never use a shared session ID or put customer personal information in it. If `sessionId` is omitted, memory is isolated to that single execution. Chat messages and short-term memory are sent to Gemini; order actions and API errors bypass Gemini. Memory does not store carts, confirmation tokens, or order state—keep those in the channel's conversation state. Simple Memory is not supported by n8n in queue mode. FoodFlow response facts remain authoritative, and structured response data is preserved. After importing the workflow, configure a Google Gemini credential with your Gemini API key in the **Google Gemini Chat Model** node; no Gemini or FoodFlow secrets are included in the exported workflow.

Use one shared n8n integration key. The imported **Customer Chat Webhook** requires Header Auth: configure its **FoodFlow Webhook Header Auth** credential with header `Authorization` and value `Bearer YOUR_N8N_API_KEY`. Use the same `N8N_API_KEY` value for the **FoodFlow n8n API Key** credential on the HTTP Request node. Generate one private key with at least 32 random bytes; keep it only in server environment variables and n8n credentials, never in the exported workflow or browser code. Direct callers must send `Authorization: Bearer YOUR_N8N_API_KEY` over HTTPS.

1. Set a single `N8N_API_KEY` in the FoodFlow server environment and restart the app. For Docker Compose, put it in `.env` and recreate the app service.
2. Import the workflow. Set the HTTP Request URL to `https://YOUR_FOODFLOW_DOMAIN/api/v1/n8n`; configure the Webhook Header Auth and HTTP Request Header Auth credentials to both use `Authorization` and the same value `Bearer YOUR_N8N_API_KEY`.
3. Set `N8N_WEBHOOK_URL` on the FoodFlow server to the activated workflow's Production URL. The website proxy sends the shared key server-side. Leave the URL empty to use the built-in FoodFlow assistant directly. For cross-message chat context, send the same opaque `sessionId` for every message in a conversation.
4. Activate the workflow. Other applications can call its Production URL over HTTPS with `Authorization: Bearer YOUR_N8N_API_KEY`. Send `message` and optional `location`; the response contains the customer-facing `reply`.
5. For orders, send `action: "order"`, a `customer` object with `name`, `phone`, and `address`, and `items` containing menu item `id`, `restaurant_id`, and `quantity`. The first call returns a priced quote and a short-lived `confirmationToken`; only after the customer explicitly confirms, repeat the same request with the returned `requestId` and `confirmationToken`, and `confirmed: true`. Keep those values in the channel's conversation state; do not auto-confirm.
The order API rechecks menu prices, assigns a delivery partner when available, and places orders only after the signed quote is confirmed. The workflow never contains API keys or MongoDB access. `N8N_API_KEY` protects both the inbound n8n webhook and n8n-to-app API; the website's built-in assistant works without n8n when `N8N_WEBHOOK_URL` is empty.

## Installable app

The app includes a web manifest, app icons, a service worker, and an **Install App** header button. Installation prompts are available in supported browsers when served from HTTPS or localhost. On iOS, use the browser’s Share menu and choose **Add to Home Screen**.
