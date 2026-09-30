# ParkPay
ParkPay is a payment backend for parking management systems.
The application accepts parking payments, stores them locally and processes them
asynchronously through a configurable payment provider.

The system is designed to work when no permanent internet connection is available. Payments
are retried later when the provider becomes reachable again.

# Features
- REST API for creating and querying payments
- Local persistence before provider processing
- Offline-capable payment workflow
- Retry handling
- Idempotent payment processing
- Replaceable payment providers
- Stripe Sandbox integration
- Mock payment provider for testing


# Quick Start
For a full setup guide, see [Setup](docs/setup.md)   
Inside the parkpay directory:  
Install dependencies:
````shell
npm ci
````
Create backend environment file based on:
````text
apps/backend/.env.example
````
Example configuration:
````dotenv
# Database
DATABASE_PATH=./data/parkpay.sqlite
PORT=3000

# Logging
LOG_LEVEL=info
NODE_ENV=development

# API key
PARKPAY_API_KEY=CHANGE_IN_LOCAL_ENV

# Payment Provider
PAYMENT_PROVIDER=mock
MOCK_PAYMENT_MODE=ONLINE_SUCCESS
````
For Stripe Sandbox testing, use the following instead of mock:
````dotenv
PAYMENT_PROVIDER=stripe
STRIPE_SECRET_KEY=CHANGE_IN_LOCAL_ENV
STRIPE_TEST_PAYMENT_METHOD=pm_card_visa
````

Start the backend:
````shell
npm run dev --workspace=apps/backend
````
Start the frontend:
````shell
npm run dev --workspace=apps/frontend
````
Or start the project with Docker:
````shell
docker compose up --build
````


# API
Full API documentation: [ParkPay API](docs/api.md)

Base path:
````http request
/parkpay/v1
````
Create a payment:
````http request
POST /parkpay/v1
````
Get payment status:
````http request
GET /parkpay/v1/:parkingId
````
The endpoints require an API-Key
````http request
x-api-key: <PARKPAY_API_KEY>
````

# Full Documentation
- [Setup](docs/setup.md)
- [ParkPay API](docs/api.md)
- [API Keys and Secrets](docs/api_keys.md)
- [Payment Flow](docs/payment_flow.md)
- [Architecture](docs/architecture.md)
- [Technology Stack](docs/tech_stack.md)
