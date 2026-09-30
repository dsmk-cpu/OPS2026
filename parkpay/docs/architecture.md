# Architecture
The backend uses a layered architecture to separate business logic from the actual implementations.

Main layers:
- **Presentation**: Handles HTTP requests, responses and DTOs
- **Application**: Handles use cases and payment processing
- **Domain**: Handles payment states, validation and business rules
- **Infrastructure**: Implements database access, payment provider integrations and workers

External systems are accessed through interfaces such as `PaymentProvider` and `PaymentRepository`.
Following this architecture, we can replace technical components.
For example, the application can either use the Mock or Stripe payment provider without changing the business logic.  
The same principle allows the current SQLite persistence implementation to be replaced later.
