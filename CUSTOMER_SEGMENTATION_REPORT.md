# Customer Segmentation Report

## Segmentation Logic Defined

The SmartServe-AI CRM module automatically classifies customers into strategic segments dynamically at runtime based on their interaction history:

1. **VIP Customers**
   - Criteria: Lifetime spend exceeds ₹50,000 or manually flagged as VIP.
   - Purpose: Priority reservations and customized high-value service.

2. **Frequent Visitors**
   - Criteria: Minimum 5 total visits AND the last visit occurred within the past 30 days.
   - Purpose: Reward consistency and foster brand loyalty through perks.

3. **At Risk Customers**
   - Criteria: The customer's last recorded visit was more than 60 days ago.
   - Purpose: Target with win-back campaigns and special promotional discounts.

4. **New Customers**
   - Criteria: Exactly 1 visit.
   - Purpose: Trigger onboarding flows and encourage a rapid second visit.

5. **Regular Customers**
   - Criteria: Any customer not fitting the conditions above.

## AI Intelligence Overlay
The AI Operations engine constantly evaluates these segments to generate active insights for the executive dashboard. Examples include highlighting approaching birthdays for segmented users and alerting staff of returning VIPs.
