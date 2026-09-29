# Payment Flow
ParkPay stores payments locally before processing them with an external payment provider.

New payments start with the status: `PENDING`

## Normal Payment Flow

````text
POST /parkpay/v1 -> CreatePayment -> Save locally as PENDING -> PaymentWorker -> ProcessPayment -> PaymentProvider.execute() -> Stripe / Mock -> PAID
 -> PaymentWorker -> CapturePayment ->Y PaymentProvider.Capture() -> CAPTURED
````
After a successful authorization:
````text
status = PAID
paymentProviderReference= pi_.. / mock:..
nextRetryAt = NULL
requiresReconciliation = false
````
PAID means that the payment was successfully authorized by the payment provider.
The payment is then captured in a seperate step.

After a successful capture:
````text
status = CAPTURED
nextRetryAt = NULL
````

CAPTURED means that the authorized amount was successfully collected.


## Offline / Provider Unavailable
If the provider cannot be reached:
````text
Provider connection error -> Payment remains PENDING -> retryCount + 1 -> nextRetryAt scheduled -> Worker retries later
````
Retries use exponential backoff, starting at 30 seconds.
After the provider becomes available again, the worker retries the payment.

A successful retry results in:
````text
PENDING
 -> PAID
 -> CAPTURED
````
If the connection fails during the capture step, the payment remains PAID and the capture is retried later.

## Uncertain Payment Outcome
A payment may already have been processed by the provider while the response is lost:
````text
ParkPay 
    -> Provider 
    -> Payment processed 
    -> Response lost
````
In this case, we do not blindly execute another payment. Instead, we set the following:
````typescript
requiresReconciliation = true
````
The worker then uses ReconcilePayment to query the existing provider transaction.

### Reconciliation
`````text
PaymentWorker -> requiresReconciliation?
                   |                 |
                   |                 |
                 false               true
                   |                 |
             ProcessPayment      ReconcilePayment
`````
If a provider reference (e.g. pi_...) exists, then the payment is queried directly.
If the reference is missing, Stripe can recover the PaymentIntent using the internal `paymentId` stored inside the Stripe metadata.

A successful reconciliation result:
````typescript
status = PAID
requiresReconciliation = false
nextRetryAt = NULL
````

## Declined Payment
If stripe rejects the payment:
````text
StripeCardError -> Payment.markCancelled() -> CANCELED
````
Declined payments are not retried.

## Tested Offline Behavior
The offline retry flow was verified with the Stripe sandbox.
Following was done:
`````text
Set internet unavailable -> POST payment -> Payment stored locally as PENDING -> Stripe connections fails -> retryCount increases 
-> nextRetryAt is scheduled -> Internet restored -> Next retry reaches Stripe -> Payment changes to PAID -> Capture is executed -> Payment changes to CAPTURED
`````