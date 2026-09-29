# API Keys and Secrets
ParkPay currently uses two different credentials:
1. `PARKPAY_API_KEY`: Used to protect the API
2. `STRIPE_SECRET_KEY`: Used to authenticate the backend against Stripe

These keys **must not** be exchanged.


## ParkPay API Key
The endpoints require:
````http request
x-api-key: <PARKPAY_API_KEY>
````
For local development, configure a random local value:
````dotenv
PARKPAY_API_KEY=your_api_key_for_development
````


# Stripe Account
Stripe credentials are managed in the Stripe Dashboard.  
Use the Stripe Test Mode during development.

1. Go to [Stripe Dashboard login](https://dashboard.stripe.com/login)
2. Create an account or Log in
3. Click on your User-icon in the top-left corner and switch to your Sandbox (or create a Sandbox)
4. Click on API-Keys and copy-paste the Token of the secret key into your local environment file

````dotenv
STRIPE_SECRET_KEY=YOUR_STRIPE_API_KEY
````