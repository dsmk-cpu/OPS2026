# Payment Flow
ParkPay stores payments locally before processing them with an external payment provider.

New payments start with the status: `PENDING`

## Normal Payment Flow

````text
POST /parkpay/v1 -> CreatePayment -> Save locally as PENDING -> PaymentWorker -> ProcessPayment -> PaymentProvider.execute() -> Stripe / Mock -> PAID
````
After a successfull payment:
````typescript
status = PAID
paymentProviderReference= pi_... / mock:...
nextRetryAt = NULL
requiresReconciliation = false
````

## Offline / Provider Unavailable
If the provider cannot be reached:
````text
Provider connection error -> Payment remains PENDING -> retryCount + 1 -> nextRetryAt scheduled -> Worker retries later
````
Retries use exponential backoff, starting at 30 seconds.
After the provider becomes available again, the payment processes normally.

## Uncertain Payment Outcome
A payment may already have been processed by the provider while the response is lost:
````text
ParkPay -> Provider -> Payment processed -> Response lost
````
In this case, we do not blindly execute another payment. Instead, we do the following:
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
If stripe rejects the card:
````text
StripeCardError -> Payment.markCancelled() -> CANCELED
````
Declined payments are not retried.