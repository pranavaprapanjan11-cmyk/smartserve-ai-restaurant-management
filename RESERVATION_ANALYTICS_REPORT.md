# Reservation Analytics Report

## Structure & State Machine

The Reservation ecosystem follows a definitive state machine managed in PostgreSQL and Express.

### Status Flow:
1. **PENDING**: The default state when a reservation is requested but not yet verified or allocated.
2. **CONFIRMED**: A table has been assigned or the booking has been guaranteed by management.
3. **SEATED**: The party has arrived and occupied their table. *This action synchronizes with the Tables Module, turning the table status to OCCUPIED.*
4. **COMPLETED**: The visit concluded successfully (triggered alongside the final invoice payment).
5. **CANCELLED**: The booking was voided by the customer or management.
6. **NO_SHOW**: The party failed to arrive for their confirmed booking.

## Waitlist Integration
When reservations are saturated, customers enter the **Waitlist** queue (`WAITING` status). Staff utilize the CRM Dashboard to track estimated wait times. Once promoted, the walk-in customer is seated, linking into the standard Table and Order workflows.

## Analytical Value
By unifying reservations with billing and orders, the system derives true utilization rates. Revenue forecasting models can now interpret advance bookings vs. walk-in trends directly from the CRM data.
