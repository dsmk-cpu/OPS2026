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
After receiving the request, the payment is first stored locally. Payment processing is performed asynchronously by the worker.

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

In ParkPay, money is stored in cents (using an integer). Therefore, `12.50` becomes `1250`. 

### Example Response

````json
{
  "id": "62f17978-5d6c-46dc-826b-d87b192934ac",
  "parkingId": 123,
  "status": "PENDING"
}
````

### Idempotency
`parkingId` is used to check for duplicate requests.  
If the same `parkingId` is used again with the same payment data, then parkPay returns
the existing payment instead of creating another payment.  

If the same `parkingId` is submitted with conflicting data, ParkPay returns a conflict.  


## Get Payment Status
````http request
GET /parkpay/v1/:parkingId
````

Example:
````http request
GET /parkpay/v1/123
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
- `PENDING`: Payment created locally and is waiting for processing, retry or reconciliation.
- `PAID`: Payment was successfully authorized by the payment provider but has not been captured yet.
- `CAPTURED`: The authorized amount was successfully captured and the payment is complete.
- `CANCELED`: Payment was canceled or declined

Typical successful flow:
````text
PENDING -> PAID -> CAPTURED
````

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
