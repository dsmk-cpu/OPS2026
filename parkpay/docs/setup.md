# Setup
This documentation explains how to install and setup up ParkPay.

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
apps/backend/.env.exmaple
````
inside the backend folder ``apps/backend``.

Environment Variables:

| Variable          | Description                                       |
|-------------------|---------------------------------------------------|
| DATABASE_PATH     | Path to the local SQLite database file            |
| PORT              | Port used by the backend server                   |
| LOG_LEVEL         | Controls backend logging level                    |
| PARKPAY_API_KEY   | API key required to access the endpoints          |
| PAYMENT_PROVIDER  | Selects the payment provider, e.g. mock or Stripe |
| STRIPE_SECRET_KEY | Stripe backend secret key when using Stripe       |

Example setup with a mock payment provider:

````dotenv
DATABASE_PATH=./data/parkpay.sqlite
PORT=3000
LOG_LEVEL=info
PARKPAY_API_KEY=YOUR_API_KEY
PAYMENT_PROVIDER=mock
STRIPE_SECRET_KEY=
STRIPE_TEST_PAYMENT_METHOD=                 
````

Example setup with Stripe as the payment provider:

````dotenv
DATABASE_PATH=./data/parkpay.sqlite
PORT=3000
LOG_LEVEL=info
PARKPAY_API_KEY=YOUR_API_KEY
PAYMENT_PROVIDER=stripe
STRIPE_SECRET_KEY=YOUR_STRIPE_API_KEY
STRIPE_TEST_PAYMENT_METHOD=pm_card_visa
````


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
From repository root:
````shell
docker compose up --build
````

Stop the stack:
````shell
docker compose down
````
