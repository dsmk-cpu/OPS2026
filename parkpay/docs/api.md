# ParkPay REST API
This documentation explains the ParkPay payment API for external use.

## Authentication
Before using the API, please set up the local environment file shown in [Setup](setup.md)  
The endpoints require:

````
x-api-key: <PARKPAY_API_KEY> 
````

## Base Path
``
/parkpay/v1
``

## Create Payment
``
POST /parkpay/v1
``
After performing, the request is first stored locally. Payment processing is performed asynchronously by the worker.

Headers:
````
Content-Type: application/json
x-api-key: <PARKPAY_API_KEY>
````

Request Body:

````
{
"id": 123,
"kennzeichen": "DIL AB 1",
"betrag": ""
}
````
