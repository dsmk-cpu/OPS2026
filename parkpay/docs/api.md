# ParkPay REST API
This documentation explains the ParkPay payment API for external use.

## Authentication
Before using the API, please set up the local environment file shown in [Setup](setup.md)  
The endpoints require:

````http request
x-api-key: <PARKPAY_API_KEY> 
````

## Base Path
````text
/parkpay/v1
````

## Create Payment
````http request
POST /parkpay/v1
````
After performing, the request is first stored locally. Payment processing is performed asynchronously by the worker.

### Headers:
````http request
Content-Type: application/json
x-api-key: <PARKPAY_API_KEY>
````

### Request Body:

````json
{
    "id": 123,
    "kennzeichen": "DIL AB 1",
    "betrag": "12.50"
}
````

### Fields:

| Field       | Type    | Description                                             |
|-------------|---------|---------------------------------------------------------|
| id          | integer | Identifier for the parking payment                      |
| kennzeichen | string  | License plate                                           |
| betrag      | string  | Amount (with two decimal places) which needs to be paid |

In parkPay, money is stored in cents (using an integer). Therefore, `12.50` becomes `1250`. 

### Example Response

````json
{
  "id": 
}
````
