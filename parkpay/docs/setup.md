# Setup
This documention explains how to install and setup up ParkPay.

## Requirements
- Node.js 24
- npm
- Stripe account (for sandbox testing)
- Optionally Docker and Docker Compose 


## Install Dependencies
Inside the parkpay directory:
``
npm ci
``

Only use npm install when updating dependencies or the lock file.

## Configure Backend
Create a local environment file based on:
``
apps/backend/.env.exmaple
``
inside the backend folder ``apps/backend``.

Example setup with a mock payment provider:

``
PORT=3000
PARKPAY_API_KEY=YOUR_API_KEY
PAYMENT_PROVIDER=mock
STRIPE_SECRET_KEY=
STRIPE_TEST_PAYMENT_METHOD=                 
``

Example setup with Stripe as the payment provider:

``
PORT=3000
PARKPAY_API_KEY=YOUR_API_KEY
PAYMENT_PROVIDER=stripe
STRIPE_SECRET_KEY=YOUR_STRIPE_API_KEY
STRIPE_TEST_PAYMENT_METHOD=pm_card_visa
``


## Start Backend

``
npm run dev --workspace=apps/backend
``

## Start Frontend

``
npm run dev --workspace=apps/frontend
``

## Run Tests

``
npm run test --workspace=apps/backend
``


## Build

Backend:
``
npm run build --workspace=apps/backend
``

Frontend:
``
npm run build --workspace=apps/frontend
``


## Lint
From repository root:
``
npm run lint
``



# Start with Docker
From repository root:
``
docker compose up --build
``

Stop the stack:
``
docker compose down
``
