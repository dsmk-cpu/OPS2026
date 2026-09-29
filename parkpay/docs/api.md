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
  "id": "62f17978-5d6c-46dc-826b-d87b192934ac",
  "parkingId": 131,
  "status": "PENDING"
}
````

### Idempotency
`parkingId` is used to check for duplicate requests.  
If the same `parkingId` is used again with the same payment data, then parkPay returns
the existing payment instead of creating another payment.  

If the same `parkingId` is submitted with conflicting data, parkPay returns a conflict.  


## Get Payment Status
````http request
GET /parkpay/v1/:parkingId
````

Example:
````http request
GET /parkpay/v1/131
````

### Headers
````http request
x-api-key: <PARKPAY_API_KEY>
````

### Example Response
````json
{
  "status": "PENDING"
}
````

### Payment States
- `PENDING`: payment created locally, retry scheduled, provider pending or reconciliation required
- `PAID`: provider confirmed the payment
- `CAPTURED`: payment transitioned from `PAID` to captured
- `CANCELED`: payment was canceled or declined



## curl Examples
Create payment:
````shell
curl -X POST http://localhost:3000/parkpay/v1 \
  -H "Content-Type: application/json" \
  -H "x-api-key: testKey" \
  -d '{
        "id": 123,
        "kennzeichen": "DIL AB 12",
        "betrag": "12.50"  
      }'
````

Get payment status:
````shell
curl http://localhost:3000/parkpay/v1/123 \
  -H "x-api-key: testKey"
````
