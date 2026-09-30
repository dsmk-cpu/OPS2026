# Setup
This documentation explains how to install and set up ParkPay.

## Requirements
- Node.js 24
- npm
- Stripe account (for sandbox testing)
- Optionally Docker and Docker Compose 

## Endpoints
Frontend:
http://localhost:5173  
Backend:
http://localhost:3000  

## Install Dependencies
Inside the parkpay directory:
````shell
npm ci
````

Only use npm install when updating dependencies or the lock file.

## Configure Backend
Create a local environment file based on:
````text
apps/backend/.env.example
````
inside the backend folder ``apps/backend``.

Environment Variables:

| Variable                   | Description                                                                                                             |
|----------------------------|-------------------------------------------------------------------------------------------------------------------------|
| DATABASE_PATH              | Path to the local SQLite database file                                                                                  |
| PORT                       | Port used by the backend server                                                                                         |
| LOG_LEVEL                  | Controls backend logging level                                                                                          |
| NODE_ENV                   | Defines the runtime environment and controls environment-specific behavior such as log formatting and migration loading |
| PARKPAY_API_KEY            | API key required to access the endpoints. Must match the frontend API KEY                                               |
| PAYMENT_PROVIDER           | Selects the payment provider, e.g. mock or Stripe                                                                       |
| MOCK_PAYMENT_MODE          | Behavior of the mock payment provider                                                                                   |
| STRIPE_SECRET_KEY          | Stripe backend secret key when using Stripe                                                                             |
| STRIPE_TEST_PAYMENT_METHOD | Stripe test payment method used for sandbox testing                                                                     |

## Mock Payment Provider
For local development and controlled tests, ParkPay can use the mock payment provider.
Example:
````dotenv
PAYMENT_PROVIDER=mock
MOCK_PAYMENT_MODE=ONLINE_SUCCESS
````

Available mock modes:

| Mode                     | Behavior                                                           |
|--------------------------|--------------------------------------------------------------------|
| ONLINE_SUCCESS           | Payment processing succeeds normally                               |
| OFFLINE                  | Simulates an unavailable payment provider                          |
| TIMEOUT_AFTER_PROCESSING | Simulates a payment that was processed but whose response was lost |
| DECLINED                 | Simulates a declined payment                                       |
| PENDING                  | Provider keeps the payment pending                                 |
| PROVIDER_ERROR           | Simulates a general provider error                                 |

Example: Offline Retry
````dotenv
PAYMENT_PROVIDER=mock
MOCK_PAYMENT_MODE=OFFLINE
````
Example of a full environment file using mock provider
````dotenv
DATABASE_PATH=./data/parkpay.sqlite
PORT=3000
LOG_LEVEL=info
NODE_ENV=development
PARKPAY_API_KEY=YOUR_API_KEY
PAYMENT_PROVIDER=mock
MOCK_PAYMENT_MODE=ONLINE_SUCCESS
STRIPE_SECRET_KEY=
STRIPE_TEST_PAYMENT_METHOD=                 
````

## Stripe Sandbox
Example of a full environment file using Stripe as the payment provider:

````dotenv
DATABASE_PATH=./data/parkpay.sqlite
PORT=3000
LOG_LEVEL=info
NODE_ENV=development
PARKPAY_API_KEY=YOUR_API_KEY
PAYMENT_PROVIDER=stripe
MOCK_PAYMENT_MODE=
STRIPE_SECRET_KEY=YOUR_STRIPE_API_KEY
STRIPE_TEST_PAYMENT_METHOD=pm_card_visa
````
pm_card_visa is used for successful Stripe sandbox payments.


## Configure Frontend
Create a local environment file based on:
````text
apps/frontend/.env.example
````  
inside the folder `apps/frontend`.  

````dotenv
PARKPAY_API_KEY=YOUR_API_KEY
````

Both the Frontend and Backend must use the same `PARKPAY_API_KEY`.

## Start Backend

````shell
npm run dev --workspace=apps/backend
````

## Start Frontend

````shell
npm run dev --workspace=apps/frontend
````

## Run Tests

````shell
npm run test --workspace=apps/backend
````


## Build

Backend:
````shell
npm run build --workspace=apps/backend
````

Frontend:
````shell
npm run build --workspace=apps/frontend
````


## Lint
From repository root:
````shell
npm run lint
````

# Start with Docker
Make sure both environment files exist:

```text
apps/backend/.env
apps/frontend/.env
````

From repository root:
````shell
docker compose up --build
````

The Docker backend runs with `NODE_ENV=production` and uses structured JSON logs.

Stop the stack:
````shell
docker compose down
````
