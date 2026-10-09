# II. Functional Requirements

## 1. Account Management and Authentication

### a. User Registration (SCR-PUB-02)

**Function trigger:**  
An unauthenticated guest clicks the "Register" button on the global top navigation bar of the landing page (SCR-PUB-01) or selects the "Don't have an account? Sign up" hyperlink on the login page (SCR-PUB-03). The browser navigates to `/register`.

**Function description:**  
Allows new customers to create a personal account. The system validates input criteria, checks for identity uniqueness, creates a new record in `users` with `role_id` mapped to `ROLE_CUSTOMER`, and activates the account. Internal roles (Agricultural Specialist, Field Staff, Administrator) cannot self-register; those accounts are provisioned exclusively by the Administrator.

**Screen layout:**
```
+-------------------------------------------------------------------------------+
| FARMELY LOGO                     Home   Marketplace   About   [Login] [Register]|
+-------------------------------------------------------------------------------+
|                                                                               |
|                            Create Customer Account                            |
|                                                                               |
|       Full Name:      [ Enter your full name                      ]           |
|       Email Address:  [ user@example.com                          ]           |
|       Phone Number:   [ 0901234567                                ]           |
|       Password:       [ ********                                  ]           |
|       Confirm Pass:   [ ********                                  ]           |
|                                                                               |
|                       [ Create Account ]                                      |
|                                                                               |
|                       Already registered? Log in here                         |
|                                                                               |
+-------------------------------------------------------------------------------+
| Footer: (c) 2026 Farmely Agricultural Platform. All rights reserved.          |
+-------------------------------------------------------------------------------+
```

**Function Details:**

*Field Description:*

| # | Field | Type | Required | Constraint | Default | Note / DB Column |
|:--|:------|:-----|:---------|:-----------|:--------|:-----------------|
| 1 | Full Name | Text | Yes | 2 to 100 characters | None | `users.full_name` |
| 2 | Email | Email | Yes | Valid RFC 5322 format, unique | None | `users.email` (Primary login identity) |
| 3 | Phone Number | Tel | Yes | 10 digits starting with `0`, unique | None | `users.phone_number` |
| 4 | Password | Password | Yes | Minimum 8 characters, >= 1 uppercase, >= 1 lowercase, >= 1 digit | None | Hashed with bcrypt (cost 12) -> `users.password_hash` |
| 5 | Confirm Password | Password | Yes | Exact match with Password field | None | Client/Server validation only (not persisted) |

*Validations:*

| ID | Field | Validation Rule |
|:---|:------|:----------------|
| V1.1 | Full Name | Must not be blank. Length between 2 and 100 characters. No leading or trailing spaces. |
| V1.2 | Email | Must match standard email format. Must not exist in `users.email`. Checked via `GET /api/v1/auth/check-email`. |
| V1.3 | Phone Number | Regex `^0[0-9]{9}$`. Must not exist in `users.phone_number`. Checked via `GET /api/v1/auth/check-phone`. |
| V1.4 | Password | Minimum 8 characters. Must contain at least one uppercase letter, one lowercase letter, and one numerical digit. |
| V1.5 | Confirm Password | Value must be identical to Password. Evaluated before network dispatch. |

*Messages:*

| ID | Condition | Message | Type |
|:---|:----------|:--------|:-----|
| M1.1 | Duplicate email address | "This email address is already registered." | Inline Error |
| M1.2 | Duplicate phone number | "This phone number is already linked to an account." | Inline Error |
| M1.3 | Weak password pattern | "Password must be at least 8 characters long and contain uppercase, lowercase, and numbers." | Inline Error |
| M1.4 | Password mismatch | "Passwords do not match." | Inline Error |
| M1.5 | Registration success | "Account created successfully. Please log in." | Toast (Success) |
| M1.6 | Database connection failure | "Unable to complete registration. Please try again later." | Toast (Error) |

*Business Logic:*
1. Passwords are salted and hashed on the server using bcrypt with a work factor of 12 before persistence.
2. The newly registered record automatically receives `role_id = 1` (`ROLE_CUSTOMER`) and `status = 'ACTIVE'`.
3. Upon successful registration (HTTP 201), the application clears sensitive form fields and redirects the user to the Login page (`/login`) with a confirmation toast.

---

### b. User Login (SCR-PUB-03)

**Function trigger:**  
An unauthenticated user clicks the "Login" button on the top navigation bar or is redirected from protected route guards. The browser navigates to `/login`.

**Function description:**  
Authenticates credentials for all user roles (Customer, Agricultural Specialist, Field Staff, Administrator). The backend verifies the password hash, produces a signed JSON Web Token (JWT), and returns user profile metadata to determine client-side role authorization and view routing.

**Screen layout:**
```
+-------------------------------------------------------------------------------+
| FARMELY LOGO                     Home   Marketplace   About   [Login] [Register]|
+-------------------------------------------------------------------------------+
|                                                                               |
|                             Sign In to Farmely                                |
|                                                                               |
|       Email Address:  [ user@example.com                          ]           |
|       Password:       [ ********                                  ]           |
|                                                                               |
|                       [ Remember Me ]         Forgot password?                |
|                                                                               |
|                       [ Log In ]                                              |
|                                                                               |
|                       Don't have an account? Register here                    |
|                                                                               |
+-------------------------------------------------------------------------------+
```

**Function Details:**

*Field Description:*

| # | Field | Type | Required | Constraint | Default | Note |
|:--|:------|:-----|:---------|:-----------|:--------|:-----|
| 1 | Email Address | Email | Yes | Valid email format | None | Authenticates identity |
| 2 | Password | Password | Yes | Non-empty string | None | Verified against stored bcrypt hash |
| 3 | Remember Me | Checkbox | No | Boolean | False | Extends JWT refresh window from 2h to 14d |

*Validations:*

| ID | Field | Validation Rule |
|:---|:------|:----------------|
| V2.1 | Email Address | Required. Must conform to valid email syntax. |
| V2.2 | Password | Required. Minimum length 1 character. |

*Messages:*

| ID | Condition | Message | Type |
|:---|:----------|:--------|:-----|
| M2.1 | Invalid credentials | "Incorrect email or password." | Inline Error |
| M2.2 | Inactive or suspended status | "Your account is currently disabled. Please contact the administrator." | Modal (Alert) |
| M2.3 | Login success | "Welcome back, {full_name}." | Toast (Success) |

*Business Logic:*
1. The server checks the credential pair against the database. If verification fails, it returns a generic error message (M2.1) without revealing whether the email or the password was incorrect.
2. If account status is `SUSPENDED` or `INACTIVE`, authentication is rejected (HTTP 403 Forbidden).
3. On successful authentication, the server generates a JWT containing `user_id`, `role`, and token expiration timestamp. The token is stored securely in an HTTP-only cookie.
4. Role-based client redirection:
   - `ROLE_CUSTOMER` -> `/customer/dashboard` (SCR-KH-01)
   - `ROLE_EXPERT` -> `/expert/dashboard` (SCR-CGNN-01)
   - `ROLE_STAFF` -> `/staff/dashboard` (SCR-CVLD-01)
   - `ROLE_ADMIN` -> `/admin/dashboard` (SCR-AD-01)

---

### c. On-Site Inspection Booking for Guests (SCR-PUB-05)

**Function trigger:**  
A prospective client visits the marketplace or plot detail page and clicks "Book Farm Tour" without being required to log in. Routes to `/site-visit/book`.

**Function description:**  
Captures pre-lease marketing leads by allowing guests and prospective customers to schedule physical plot visits. Collects contact info, preferred plot, date, and time slot (Morning or Afternoon). If the visitor is logged in, their user ID is tied directly to the record; otherwise, the guest's contact info is saved for administrative dispatch.

**Screen layout:**
```
+-------------------------------------------------------------------------------+
| FARMELY LOGO                     Home   Marketplace   About   [Login] [Register]|
+-------------------------------------------------------------------------------+
|                                                                               |
|                      Schedule an On-Farm Inspection                           |
|                                                                               |
|       Full Name:          [ John Doe                              ]           |
|       Phone Number:       [ 0987654321                            ]           |
|       Email (Optional):   [ john@example.com                      ]           |
|       Selected Plot:      [ Plot B04 - 30m2 (Vegetable Garden)  V ]           |
|       Visit Date:         [ 2026-10-15                          D ]           |
|       Time Slot:          (o) Morning (08:30 - 10:30)                         |
|                           ( ) Afternoon (14:30 - 16:30)                       |
|       Party Size:         [ 2 Persons                           V ]           |
|       Notes:              [ Looking to grow organic kale          ]           |
|                                                                               |
|                           [ Confirm Booking ]                                 |
|                                                                               |
+-------------------------------------------------------------------------------+
```

**Function Details:**

*Field Description:*

| # | Field | Type | Required | Constraint | Default | Note / DB Column |
|:--|:------|:-----|:---------|:-----------|:--------|:-----------------|
| 1 | Full Name | Text | Yes | 2 to 100 characters | None (or user's name if logged in) | `site_visits.guest_name` |
| 2 | Phone Number | Tel | Yes | 10 digits starting with `0` | None (or user's phone if logged in) | `site_visits.guest_phone` |
| 3 | Email | Email | No | Valid email syntax if provided | None | `site_visits.guest_email` |
| 4 | Selected Plot | Dropdown | Yes | Active plot ID | None | `site_visits.plot_id` |
| 5 | Visit Date | Date | Yes | >= Current Date + 1 day, <= Current Date + 30 days | Tomorrow | `site_visits.visit_date` |
| 6 | Time Slot | Radio | Yes | `MORNING` or `AFTERNOON` | `MORNING` | `site_visits.time_slot` |
| 7 | Party Size | Number | Yes | Integer between 1 and 5 | 1 | `site_visits.number_of_visitors` |
| 8 | Notes | Textarea | No | Max 500 characters | Empty | `site_visits.note` |

*Validations:*

| ID | Field | Validation Rule |
|:---|:------|:----------------|
| V3.1 | Phone Number | Must match Vietnamese phone format: `^0[0-9]{9}$`. |
| V3.2 | Visit Date | Booking must be scheduled at least 24 hours in advance to allow staff coordination. |
| V3.3 | Capacity Cap | Maximum 5 visitors per booking session to maintain farm safety. |

*Messages:*

| ID | Condition | Message | Type |
|:---|:----------|:--------|:-----|
| M3.1 | Past date selected | "Inspection dates must be scheduled at least one day in advance." | Inline Error |
| M3.2 | Booking confirmed | "Inspection booked. Farm reception will confirm your tour within 2 hours." | Modal (Success) |

*Business Logic:*
1. If authenticated, `customer_id` is linked to `site_visits.customer_id`; otherwise, the field remains `NULL`.
2. Initial record status is set to `PENDING_CONFIRMATION`.
3. System sends a notification to the Administrator dashboard queue (SCR-AD-01) for tour assignment.

---

## 2. Marketplace and Plot Lease Contracts

### a. Marketplace Plot Directory (SCR-KH-02)

**Function trigger:**  
The user clicks "Marketplace" on the main navigation bar. Accessible by both public visitors and authenticated customers. Routes to `/marketplace`.

**Function description:**  
Presents all plots marked as `AVAILABLE` across the farm. Users can filter by land sector, square footage, monthly rental pricing, and supported crop varieties. Clicking any card opens the detailed plot specifications.

**Screen layout:**
```
+-------------------------------------------------------------------------------+
| FARMELY LOGO                     Home  [Marketplace]  My Garden   (User Profile)|
+-------------------------------------------------------------------------------+
|  Filter Plots:                                                                |
|  Sector: [ All Sectors    V ]  Area: [ 20m2 - 50m2 V ]  Crop: [ All Crops V ] |
|  Price:  [ Under 2M VND   V ]  Status: [ Available Only ]       [ Reset Filters ]|
+-------------------------------------------------------------------------------+
|  Available Plots (Showing 12 results)                                          |
|                                                                               |
|  +-------------------------+  +-------------------------+  +----------------+ |
|  | [ Image: Plot A01 ]     |  | [ Image: Plot A02 ]     |  | [ Image: B01 ] | |
|  | Plot Code: A01 (30 m2)  |  | Plot Code: A02 (45 m2)  |  | Code: B01      | |
|  | Sector: Organic Garden  |  | Sector: Organic Garden  |  | Sector: Herb   | |
|  | Rate: 1,500,000 VND/mo  |  | Rate: 2,100,000 VND/mo  |  | 1,200,000 VND  | |
|  | Suitable: Kale, Cabbage |  | Suitable: Tomato, Pepper|  | Mint, Basil    | |
|  | [ View Plot Details ]   |  | [ View Plot Details ]   |  | [ View Details]| |
|  +-------------------------+  +-------------------------+  +----------------+ |
|                                                                               |
|  Pagination: [ < Prev ] [ 1 ] [ 2 ] [ 3 ] [ Next > ]                          |
+-------------------------------------------------------------------------------+
```

**Function Details:*

*Field Description:*

| # | Filter Control | Type | Values / Constraints | Default |
|:--|:---------------|:-----|:---------------------|:--------|
| 1 | Sector | Dropdown | Populated from active `lands` records | All Sectors |
| 2 | Area Range | Dropdown | `< 25m2`, `25 - 50m2`, `> 50m2` | All Ranges |
| 3 | Crop Compatibility | Dropdown | Populated from active `crops` records | All Crops |
| 4 | Price Ceiling | Dropdown | `< 1.5M`, `1.5M - 3.0M`, `> 3.0M VND` | All Prices |

*Business Logic:*
1. Only records where `plots.status = 'AVAILABLE'` and `plots.is_published = TRUE` are queried.
2. Plots undergoing the 4-day soil fallow cycle (`plots.status = 'MAINTENANCE'`) or currently occupied (`RENTED`, `RESERVED`) are hidden from standard listings.
3. Pagination standard: 9 cards per page, sorted by `plots.plot_code` ascending.

---

### b. Master Lease Agreement and Plot Configuration (SCR-KH-04)

**Function trigger:**  
An authenticated customer selects one or multiple available plots from the marketplace and clicks "Proceed to Agreement". Routes to `/contracts/create`.

**Function description:**  
Formalizes the Master Lease Agreement. Enables the tenant to lease multiple adjacent or distinct plots under a single legal contract. For each leased plot, the customer selects the intended crop variety (constrained to certified compatible varieties) and the cultivation mode (Self-growing or Assisted-growing). The system computes the total contract amount, validates duration constraints, and places a 15-minute temporary reservation lock on the plots.

**Screen layout:**
```
+-------------------------------------------------------------------------------+
| FARMELY LOGO                     Home   Marketplace  [My Garden]  (User Profile)|
+-------------------------------------------------------------------------------+
|                      MASTER AGRICULTURAL LEASE AGREEMENT                      |
|                                                                               |
| Tenant: Nguyen Van A | Phone: 0901234567 | Term: 2026-11-01 to 2027-01-31     |
+-------------------------------------------------------------------------------+
| Configured Plot Allocations:                                                  |
|                                                                               |
| [1] Plot A01 (30 m2) - Base: 1,500,000 VND/mo                                 |
|     * Crop Variety:     [ Curly Kale (Brassica oleracea)         V ]          |
|     * Cultivation Mode: (o) Self-growing (Free weekend garden visits)          |
|                         ( ) Assisted-growing (Full-care by Farm Staff)        |
|     * Plot Subtotal:    4,500,000 VND (3 Months)                              |
|                                                                               |
| [2] Plot A02 (45 m2) - Base: 2,100,000 VND/mo                                 |
|     * Crop Variety:     [ Roma Tomato (Solanum lycopersicum)     V ]          |
|     * Cultivation Mode: ( ) Self-growing                                      |
|                         (o) Assisted-growing (+800,000 VND/mo full care)      |
|     * Plot Subtotal:    8,700,000 VND (3 Months + Dedicated Care)             |
+-------------------------------------------------------------------------------+
| Financial Summary:                                                            |
| Total Leased Area: 75 m2 | Total Plots: 2                                     |
| Cultivation Supplies: Included in Package (Seeds, Bio-Fertilizers, Soil Prep) |
| Total Contract Value: 13,200,000 VND (100% Upfront Lease Payment)             |
|                                                                               |
| [x] I agree to the Farm Standard Terms of Service and Operational Rules.      |
|                                                                               |
|                 [ Cancel ]         [ Sign Contract & Pay ]                    |
+-------------------------------------------------------------------------------+
```

**Function Details:*

*Field Description:*

| # | Field | Type | Required | Constraint | Default | Note / DB Column |
|:--|:------|:-----|:---------|:-----------|:--------|:-----------------|
| 1 | Leased Plots | Multi-select | Yes | Minimum 1 plot, status must be `AVAILABLE` | Pre-selected | Maps to `contract_plots` |
| 2 | Start Date | Date | Yes | >= Current Date + 3 days (prep buffer) | Current Date + 3d | `contracts.start_date` |
| 3 | End Date | Date | Yes | `end_date >= start_date + max(expected_duration + buffer_time)` | Computed | `contracts.end_date` |
| 4 | Variety Selection | Dropdown | Yes | Must be in `plot_crop_compatibility` for that specific plot | None | `contract_plots.variety_id` |
| 5 | Cultivation Mode | Radio | Yes | `SELF_GROWING` or `ASSISTED_GROWING` | `SELF_GROWING` | `contract_plots.cultivation_mode` |
| 6 | Service Package | Dropdown | Conditional | Required if mode is `ASSISTED_GROWING` | Standard Care | `contract_plots.service_id` |
| 7 | Terms Acceptance | Checkbox | Yes | Must be checked | False | System prerequisite |

*Validations:*

| ID | Field | Validation Rule |
|:---|:------|:----------------|
| V4.1 | Compatibility | Checked against `plot_crop_compatibility`. Selecting an uncertified variety is rejected. |
| V4.2 | Lease Duration | Lease tenure must equal or exceed the biological maturity duration plus safety buffer: `(end_date - start_date) >= (varieties.expected_duration + varieties.buffer_time)`. |
| V4.3 | Schedule Overlap | Target plot must not have an active or reserved tenancy during `[start_date, end_date + 4 days]`. |

*Messages:*

| ID | Condition | Message | Type |
|:---|:----------|:--------|:-----|
| M4.1 | Duration too short | "Lease period must be at least {min_days} days to accommodate the growth cycle of {variety_name}." | Inline Error |
| M4.2 | Race condition collision | "Plot {plot_code} was just reserved by another tenant. Please select an alternate plot." | Modal (Warning) |
| M4.3 | Reservation lock created | "Plot reserved for 15 minutes. Redirecting to payment checkout." | Toast (Info) |

*Business Logic:*
1. Database transaction creates one master record in `contracts` (`status = 'PENDING_PAYMENT'`).
2. Inserts individual allocated lines into `contract_plots` linking `contract_id`, `plot_id`, `variety_id`, and `cultivation_mode`.
3. Sets `plots.status = 'RESERVED'` with an expiration timestamp: `reservation_expires_at = NOW() + INTERVAL '15 minutes'`.
4. Material inventory is not tracked. All baseline seeds, compost, and organic inputs are bundled into the lease and care service rates.

---

### c. Contract Payment and Grace Period Processing (SCR-KH-05)

**Function trigger:**  
Triggered immediately upon contract submission from SCR-KH-04, routing to `/checkout/{contractId}`.

**Function description:**  
Processes full 100% upfront lease payments via integrated Payment Gateway (mock or QR bank transfer). Applies a 10-minute Grace Period extension once the user reaches the checkout screen to prevent accidental reservation timeouts while entering banking credentials or OTPs.

**Screen layout:**
```
+-------------------------------------------------------------------------------+
| FARMELY LOGO                     Home   Marketplace  [My Garden]  (User Profile)|
+-------------------------------------------------------------------------------+
|                              PAYMENT CHECKOUT                                 |
|                                                                               |
| Master Contract Code: CTR-2026-089                                            |
| Time Remaining to Complete Payment: [ 09:42 ] (10-Minute Grace Period Active)  |
+-------------------------------------------------------------------------------+
| Invoice Breakdown:                                                            |
| * Plot A01 (30m2 - Kale, Self-growing):                  4,500,000 VND        |
| * Plot A02 (45m2 - Tomato, Assisted-growing):            8,700,000 VND        |
| ----------------------------------------------------------------------------- |
| Total Payable Amount:                                   13,200,000 VND        |
+-------------------------------------------------------------------------------+
| Select Payment Method:                                                        |
| (o) VietQR / Bank Transfer (Instant Confirmation)                             |
| ( ) Domestic ATM Card / Napas                                                 |
|                                                                               |
|               [ QR Code Displayed Here: Scan via Banking App ]                |
|                                                                               |
|               [ I Have Completed Payment ]           [ Cancel Order ]         |
+-------------------------------------------------------------------------------+
```

**Function Details:*

*Field Description:*

| # | Field | Type | Note |
|:--|:------|:-----|:-----|
| 1 | Contract ID | Integer | Foreign key referencing `contracts.contract_id` |
| 2 | Total Amount | Decimal | Exact payable sum from `contracts.total_price` |
| 3 | Payment Method | Radio | `VIETQR`, `VNPAY`, or `MOCK_BANKING` |

*Business Logic:*
1. **Grace Period Execution:** When the checkout page loads, the system updates `contracts.status = 'PAYMENT_PENDING'` and grants an extra 10 minutes to the reservation expiry clock.
2. Upon receiving payment callback or webhook confirming transaction success:
   - Inserts record into `payment_transactions` (`transaction_type = 'PAYMENT'`, `status = 'SUCCESS'`).
   - Updates `contracts.status = 'CONFIRMED'`.
   - Updates all plots in `contract_plots` to `plots.status = 'RENTED'`.
3. When `contracts.start_date` arrives, a backend cron job switches `contracts.status` from `CONFIRMED` to `ACTIVE`.
4. If the payment timer hits zero without transaction completion:
   - System reverts `plots.status = 'AVAILABLE'`.
   - Sets `contracts.status = 'CANCELLED'`.

---

### d. Contract Renewal (SCR-KH-15)

**Function trigger:**  
An authenticated customer views an active contract on their dashboard and selects "Renew Contract" at least 3 days before the agreement expires. Routes to `/contracts/{contractId}/renew`.

**Function description:**  
Permits existing tenants to extend their lease tenure without vacating the plot or losing continuous soil history and diary timelines. If the plots remain unbooked by other users, the system creates a successor contract linked back to the prior agreement via `parent_contract_id`.

**Screen layout:**
```
+-------------------------------------------------------------------------------+
| FARMELY LOGO                     Home   Marketplace  [My Garden]  (User Profile)|
+-------------------------------------------------------------------------------+
|                            RENEW LEASE AGREEMENT                              |
|                                                                               |
| Current Contract: CTR-2026-089 | Current Expiry Date: 2027-01-31              |
| Leased Plots: Plot A01 (Kale), Plot A02 (Tomato)                              |
+-------------------------------------------------------------------------------+
| Extension Options:                                                            |
|                                                                               |
| Additional Lease Duration: [ 3 Months (Standard Season Extension)          V ]|
| New Agreement End Date:   2027-04-30                                          |
|                                                                               |
| Plot Maintenance Selection:                                                   |
| * Plot A01: [ Continue Cultivation with Same Variety                       V ]|
| * Plot A02: [ Rotate to Certified Compatible Crop: Bell Pepper             V ]|
|                                                                               |
| Renewal Subtotal: 13,200,000 VND (Includes continuing maintenance packages)  |
|                                                                               |
|                 [ Back to Dashboard ]        [ Confirm & Proceed to Pay ]     |
+-------------------------------------------------------------------------------+
```

**Function Details:*

*Business Logic:*
1. **Eligibility Threshold:** Renewal must be requested at least 3 days prior to `contracts.end_date` (BR11b).
2. The system verifies that no future reservations exist for the leased plots beyond `end_date`.
3. Creates a new contract with `parent_contract_id = old_contract.contract_id`.
4. The existing contract remains `ACTIVE` until its original expiration date, at which point its status shifts to `RENEWED` while the successor contract becomes `ACTIVE`.

---

### e. Lease Cancellation and Refund Audit (SCR-KH-16)

**Function trigger:**  
The customer clicks "Request Cancellation" on an upcoming or active contract details page. Routes to `/contracts/{contractId}/cancel`.

**Function description:**  
Processes contract termination requests. The system calculates statutory penalty deductions based on cancellation lead time, logs the formal request into `cancellation_requests`, and schedules the refund for administrative clearance.

**Screen layout:**
```
+-------------------------------------------------------------------------------+
| FARMELY LOGO                     Home   Marketplace  [My Garden]  (User Profile)|
+-------------------------------------------------------------------------------+
|                         CANCEL LEASE CONTRACT REQUEST                         |
|                                                                               |
| Contract: CTR-2026-089 | Total Paid: 13,200,000 VND | Start Date: 2026-11-01  |
+-------------------------------------------------------------------------------+
| Cancellation Policy Evaluation:                                               |
| Current Date: 2026-10-25 (7 Days prior to Start Date)                         |
| Applicable Deduction Tier: >= 3 Days Prior to Start (20% Processing Penalty)  |
|                                                                               |
| Financial Assessment:                                                         |
| * Gross Paid Amount:                                    13,200,000 VND        |
| * Cancellation Penalty Deduction (20%):                 -2,640,000 VND        |
| ----------------------------------------------------------------------------- |
| Estimated Refund Amount:                                10,560,000 VND        |
+-------------------------------------------------------------------------------+
| Reason for Cancellation:                                                      |
| [ Relocating to another city for work and unable to attend the plot        ]  |
|                                                                               |
| Banking Details for Refund Disbursement:                                      |
| Bank Name: [ Vietcombank V ] Account Number: [ 01234567890 ] Account Name: [ NGUYEN VAN A ] |
|                                                                               |
|                 [ Keep My Lease ]            [ Submit Cancellation Request ]  |
+-------------------------------------------------------------------------------+
```

**Function Details:*

*Business Logic:*
1. **Deduction Schedule (BR10):**
   - Cancelled >= 3 days before `start_date`: 20% penalty deduction, 80% refund.
   - Cancelled < 3 days before `start_date`: 50% penalty deduction, 50% refund.
   - Cancelled on or after `start_date`: 100% penalty, 0% refund.
2. Submission creates a record in `cancellation_requests` with `status = 'PENDING_APPROVAL'`.
3. Once approved by the Administrator, the backend generates a `payment_transactions` record with `transaction_type = 'REFUND'`, and the leased plots transition to `AVAILABLE` (after mandatory maintenance).

---

## 3. Standard Agronomy Processes and Cultivation

### a. Crop Variety Process Formulation (SCR-CGNN-04)

**Function trigger:**  
An Agricultural Specialist logs in, navigates to the Agronomy Management section on the sidebar, and selects "Process Templates". Routes to `/expert/process-templates/new`.

**Function description:**  
Allows agricultural specialists to author and publish standardized technical agronomy templates (`process_templates` and `template_steps`) tied to specific crop varieties. Defines day-by-day care steps, job types (irrigation, fertilization, pest inspection), and environmental thresholds (safe temperature and humidity ranges). These templates serve as the sole execution baseline for Assisted-growing contracts and provide guidance for Self-growing tenants.

**Screen layout:**
```
+-------------------------------------------------------------------------------+
| FARMELY SPECIALIST               Knowledge Base   Process Templates   (Dr. Green)|
+-------------------------------------------------------------------------------+
|                       DEFINE STANDARD AGRONOMY TEMPLATE                       |
|                                                                               |
| Crop Variety: [ Curly Kale - Variety #04 V ]   Template Version: [ v2.1     ] |
| Climate Bounds: Temp: [ 18.0 ]C to [ 30.0 ]C | Soil Moisture: [ 60% ] to [ 80% ] |
+-------------------------------------------------------------------------------+
| Sequential Operational Steps:                                                 |
|                                                                               |
| Day 01: [ Seedbed Preparation and Soil Aeration     ] Type: [ Soil Prep     V]|
|         Instructions: Lightly till top 5cm soil and place starter seedlings.  |
| Day 05: [ Initial Root Irrigation                   ] Type: [ Watering      V]|
|         Instructions: Apply 2 liters per m2 before 09:00 AM.                  |
| Day 15: [ Organic Compost Top-Dressing              ] Type: [ Fertilizing   V]|
|         Instructions: Distribute worm castings evenly around base of stems.   |
| Day 40: [ Final Harvest Assessment                  ] Type: [ Harvesting    V]|
|         Instructions: Check leaf surface span >= 15cm; prepare harvesting box.|
|                                                                               |
| [ + Add Next Operational Step ]                                               |
|                                                                               |
|                 [ Discard Draft ]            [ Publish Official Template ]    |
+-------------------------------------------------------------------------------+
```

**Function Details:*

*Field Description:*

| # | Field | Type | Required | Constraint | DB Mapping |
|:--|:------|:-----|:---------|:-----------|:-----------|
| 1 | Variety | Dropdown | Yes | Active record in `varieties` | `process_templates.variety_id` |
| 2 | Version | Text | Yes | Semantic versioning format (e.g., `v1.0`, `v2.0`) | `process_templates.version` |
| 3 | Safe Climate Limits | Numbers | Yes | `min_temp < max_temp`, `min_humidity < max_humidity` | `process_templates.min_temp`, etc. |
| 4 | Step Offset | Integer | Yes | Days elapsed from start date (`>= 0`) | `template_steps.day_offset` |
| 5 | Task Type | Dropdown | Yes | `WATERING`, `FERTILIZING`, `PEST_CONTROL`, `HARVESTING` | `template_steps.task_type` |

*Business Logic:*
1. Templates are standardized per biological variety. No customized variations are permitted for individual customers (anti-customization rule).
2. Material inventory quantities are omitted; steps specify operational guidelines and best practices.
3. Once published, any Assisted-growing plot allocated with this variety automatically generates `care_tasks` on the matching calendar day.

---

### b. Cultivation Progress Monitoring (SCR-KH-07)

**Function trigger:**  
An authenticated customer selects a leased plot from their "My Garden" dashboard view. Routes to `/customer/plots/{contractPlotId}/progress`.

**Function description:**  
Provides a transparent view of the plot's cultivation lifecycle. Assisted-growing tenants see upcoming, completed, and in-progress operational tasks handled by farm staff. Self-growing tenants view the recommended agronomic schedule as a reference roadmap while retaining full autonomy over their own gardening activities.

**Screen layout:**
```
+-------------------------------------------------------------------------------+
| FARMELY LOGO                     Home   Marketplace  [My Garden]  (User Profile)|
+-------------------------------------------------------------------------------+
| Plot A02: Roma Tomato | Mode: Assisted-growing | Specialist: Dr. Le Van B     |
| Cycle: Day 24 of 75   | Overall Progress: [=========>               ] 32%     |
+-------------------------------------------------------------------------------+
| Agronomic Progress Roadmap:                                                   |
|                                                                               |
| [x] Day 01: Initial Seedbed Planting                   Completed: 2026-11-01  |
|     * Executed by: Worker Tran Van C (Staff ID #12)                           |
|     * Evidence: [ Photo: Seedling Tray ] [ Photo: Planting Bed ]               |
|                                                                               |
| [x] Day 10: Organic Root Feeding                       Completed: 2026-11-10  |
|     * Executed by: Worker Tran Van C | Notes: Soil aeration optimal           |
|     * Evidence: [ Photo: Fertilizer Distribution ]                            |
|                                                                               |
| [>] Day 24: Foliage Pruning and Trellis Securing       IN PROGRESS (Today)    |
|     * Assigned Staff: Worker Tran Van C | Target Completion: 17:00            |
|                                                                               |
| [ ] Day 35: Flowering Nutrient Inspection              Scheduled: 2026-12-05  |
| [ ] Day 65: Color Break Harvest Readiness              Scheduled: 2027-01-04  |
+-------------------------------------------------------------------------------+
```

**Function Details:*

*Business Logic:*
1. For Assisted-growing plots, clicking any completed task opens the high-resolution photo proof submitted from the field worker's mobile interface.
2. For Self-growing plots, the UI displays: *"Recommended Reference Roadmap by Farm Specialist. You may follow these milestones or apply your own cultivation schedule."* No specialist approval is required for departures from the template.

---

## 4. Field Operations and Care Tasks

### a. Field Staff Mobile Work Queue (SCR-CVLD-01)

**Function trigger:**  
A field staff member logs in using a mobile device or navigates to `/staff/tasks`.

**Function description:**  
Displays the daily task queue for assigned plots. Organizes activities by priority (Urgent IoT alerts first, scheduled routine tasks second) and geographic sector. Workers can view plot locations, inspect technical instructions, update task states, and attach on-site photos as proof of completion.

**Screen layout:**
```
+-------------------------------------------------------------------------------+
| [=] FARMELY FIELD STAFF                         Logged: Staff #12 (Tran Van C)|
+-------------------------------------------------------------------------------+
| TODAY'S SCHEDULE - 2026-11-24                                                 |
| Assigned Plots: 8 | Tasks Remaining: 3 | Overdue: 0                           |
+-------------------------------------------------------------------------------+
| ( ! ) URGENT ACTION:                                                          |
| Plot B03 - Strawberry | Mode: Assisted | Emergency Rescue Task                |
| * Reason: Soil moisture dropped below critical 40% (Sensor: 34%)              |
| * Action: Inspect drip irrigation nozzle and apply manual 5L drenching.       |
| [ Start Emergency Task ]                                                      |
+-------------------------------------------------------------------------------+
| ROUTINE CARE TASKS:                                                           |
|                                                                               |
| [>] Task #1042: Plot A02 (Tomato) - Trellis Securing                          |
|     * Scheduled Window: 13:30 - 17:00 | Status: IN PROGRESS                   |
|     * Instructions: Tie vertical growing shoots to guide trellis wires.       |
|     [ Open Camera & Submit Completion Proof ]                                 |
|                                                                               |
| [ ] Task #1043: Plot A05 (Kale) - Organic Pest Inspection                     |
|     * Scheduled Window: 14:00 - 17:00 | Status: PENDING                       |
|     [ Start Task ]                                                            |
+-------------------------------------------------------------------------------+
```

**Function Details:*

*Business Logic:*
1. Emergency tasks generated by IoT threshold alerts take top visual priority and display a warning banner.
2. Staff must transition a task to `IN_PROGRESS` before completing it.
3. Transitioning to `COMPLETED` requires uploading at least one real-time photograph taken at the plot (enforced via camera capture).
4. Material usage inputs are not required. The worker confirms completion and includes qualitative notes if needed.
5. Tasks remaining incomplete at 23:59 are flagged as `OVERDUE` by the night-audit cron job, notifying the Administrator.

---

## 5. Microclimate Telemetry and Alerts

### a. Plot Telemetry Dashboard (SCR-KH-10)

**Function trigger:**  
The customer selects "Environmental Sensors" from the plot management menu. Routes to `/customer/plots/{plotId}/telemetry`.

**Function description:**  
Presents near-real-time sensor readings collected from the physical plot (ambient temperature, air humidity, soil moisture). Graphs illustrate 24-hour trends alongside safe agronomic operating bands established by the agricultural specialist.

**Screen layout:**
```
+-------------------------------------------------------------------------------+
| FARMELY LOGO                     Home   Marketplace  [My Garden]  (User Profile)|
+-------------------------------------------------------------------------------+
| Environmental Monitoring: Plot A01 (Curly Kale)                               |
| Sensor Station: IOT-A01-STATION | Last Ingestion: 2026-11-24 14:00:12         |
+-------------------------------------------------------------------------------+
| Current Readings:                                                             |
| [ Temp: 24.5 C - Normal ]  [ Air Hum: 68% - Normal ]  [ Soil Moisture: 72% - OK ]|
+-------------------------------------------------------------------------------+
| 24-Hour Microclimate Historical Trend:                                        |
|                                                                               |
|   Moisture %                                                                  |
|   100 |                                                                       |
|    80 |================== Safe Maximum Bound (80%) ========================== |
|    60 |      .-.     .-.     .-.  (Recorded Moisture Level: 68% - 74%)         |
|    40 |-----/---\---/---\---/---\- Safe Minimum Bound (40%) ----------------- |
|     0 +------------------------------------------------------------           |
|       00:00    04:00    08:00    12:00    16:00    20:00                      |
+-------------------------------------------------------------------------------+
| Integrated Weather Forecast (Next 3 Days - Hoc Mon Station):                  |
| * Tomorrow: 26 C - Scattered Showers (Automatic rain suspension active)       |
| * Day After: 28 C - Partly Cloudy                                             |
+-------------------------------------------------------------------------------+
```

**Function Details:*

*Business Logic:*
1. Telemetry data is tied directly to the physical asset (`plots.plot_id`), independent of tenant tenancy records.
2. If soil moisture exceeds 80% or heavy rain is forecast via weather API, the system auto-pauses scheduled irrigation tasks to prevent root rot.
3. If soil moisture falls below 40% for more than 30 consecutive minutes:
   - For Assisted-growing plots: Automatically generates an Emergency Care Task for the on-duty field staff.
   - For Self-growing plots: Dispatches an SMS/push alert to the tenant with a "Request Emergency Care" shortcut button.

---

## 6. Farm Diary and Produce Harvest

### a. Automated Farm Diary Feed (SCR-KH-08)

**Function trigger:**  
The customer navigates to the "Farm Diary" tab on their active garden view. Routes to `/customer/plots/{plotId}/diary`.

**Function description:**  
Provides a social-feed-style timeline documenting the plot's growth journey. For Assisted-growing contracts, the diary updates automatically whenever field staff mark a care task complete, displaying on-site photo proof and field observations (BR17). Self-growing tenants can upload their own journal entries, field notes, and family photos.

**Screen layout:**
```
+-------------------------------------------------------------------------------+
| FARMELY LOGO                     Home   Marketplace  [My Garden]  (User Profile)|
+-------------------------------------------------------------------------------+
| Farm Diary Timeline - Plot A01 (Curly Kale)                                   |
| Mode: Assisted-growing | System Auto-Sync Enabled                             |
+-------------------------------------------------------------------------------+
| [ Auto-Generated Entry ] - 2026-11-20 09:30 AM                               |
| Title: Organic Root Irrigation and Aeration Completed                         |
| Attending Staff: Tran Van C (Field Staff #12)                                 |
| Field Notes: Seedlings rooting firmly; no signs of flea beetles or leaf spot. |
|                                                                               |
| [ Photo Proof: Healthy Green Leaves ]    [ Photo Proof: Moist Root Zone ]      |
+-------------------------------------------------------------------------------+
| [ Auto-Generated Entry ] - 2026-11-05 08:15 AM                               |
| Title: Seedling Germination Milestone                                         |
| Attending Staff: Tran Van C                                                   |
| Field Notes: 95% germination rate across all 4 planting beds.                 |
| [ Photo Proof: Emerging Shoots ]                                              |
+-------------------------------------------------------------------------------+
```

**Function Details:*

*Business Logic:*
1. **Automated Synchronization (BR17):** Completing a care task (`care_tasks.status = 'COMPLETED'`) triggers an event that inserts a corresponding record into `farm_diaries`. Staff do not need to create separate diary posts manually.
2. Self-growing tenants create manual posts via the "New Diary Entry" form (SCR-KH-09).

---

### b. Harvest Yield Logging and Customer Acceptance (SCR-CVLD-07 & SCR-KH-14)

**Function trigger:**  
- **Field Staff:** Clicks "Record Harvest" on a mature plot at `/staff/harvest/{plotId}`.
- **Customer:** Clicks "Review Harvest Yield" upon receiving an alert at `/customer/harvest/{harvestId}`.

**Function description:**  
Records the final yield from the plot. The field staff member cuts the produce, weighs it on a digital scale, photographs the scale readout, and logs the weight under their staff ID. The customer receives a notification to review the photos, accept the yield, and select their delivery preference (free on-farm pickup or home delivery with shipping fee).

**Screen layout (Field Staff Recording View):**
```
+-------------------------------------------------------------------------------+
| [=] FARMELY FIELD STAFF                         Logged: Staff #12 (Tran Van C)|
+-------------------------------------------------------------------------------+
| RECORD HARVEST WEIGHT - Plot A01 (Curly Kale)                                 |
| Tenant: Nguyen Van A | Master Contract: CTR-2026-089                          |
+-------------------------------------------------------------------------------+
| Harvest Details:                                                              |
|                                                                               |
| Actual Measured Weight: [ 18.5 ] Kilograms (kg)                               |
| Digital Scale Photo:    [ Camera / Choose File ] -> scale_reading_2026.jpg     |
| Basket Produce Photo:   [ Camera / Choose File ] -> harvest_produce_2026.jpg   |
| Quality Grading:        (o) Grade A (Premium Market Quality)                  |
|                         ( ) Grade B (Standard Table Quality)                  |
| Worker Field Notes:     [ Clean harvest; crisp leaves, no insect blemish.  ]  |
|                                                                               |
|                 [ Cancel ]                   [ Submit Official Yield ]        |
+-------------------------------------------------------------------------------+
```

**Screen layout (Customer Acceptance View):**
```
+-------------------------------------------------------------------------------+
| FARMELY LOGO                     Home   Marketplace  [My Garden]  (User Profile)|
+-------------------------------------------------------------------------------+
| HARVEST YIELD INSPECTION & ACCEPTANCE                                         |
| Plot A01: Curly Kale | Harvest Date: 2027-01-20                               |
+-------------------------------------------------------------------------------+
| Certified Field Measurements:                                                 |
| Total Weight Logged: 18.5 Kilograms                                           |
| Weighed by Staff Member: Tran Van C (Staff ID #12)                            |
|                                                                               |
| Verification Proof:                                                           |
| [ Photo: 18.5 kg Scale Reading ]       [ Photo: Freshly Packed Crates ]       |
+-------------------------------------------------------------------------------+
| Produce Delivery Method:                                                      |
| (o) Weekend Farm Pickup (Free)                                                |
|     * Location: Farm Depot Gate 2, Hoc Mon Farm (Saturday/Sunday 08:00 - 17:00)|
| ( ) Home Delivery (+120,000 VND Flat Courier Fee)                             |
|     * Address: 123 Nguyen Hue Street, District 1, Ho Chi Minh City            |
|                                                                               |
|                 [ Dispute Yield ]            [ Accept Produce Yield ]         |
+-------------------------------------------------------------------------------+
```

**Function Details:*

*Field Description:*

| # | Field | Type | Required | Constraint | DB Mapping |
|:--|:------|:-----|:---------|:-----------|:-----------|
| 1 | Actual Weight | Decimal | Yes | Greater than 0.00 kg | `harvest_results.actual_yield` |
| 2 | Staff ID | Integer | Yes | Session ID of logged staff | `harvest_results.staff_id` |
| 3 | Photo Evidence | File/URL | Yes | Image file showing scale reading | `harvest_results.photo_url` |
| 4 | Delivery Option | Radio | Yes | `FARM_PICKUP` or `HOME_DELIVERY` | `harvest_results.delivery_option` |
| 5 | Tenant Approval | Boolean | Yes | Set to true upon acceptance | `harvest_results.customer_confirmed` |

*Business Logic:*
1. Field staff accountability: Every harvest record is permanently tied to the staff member who conducted the weighing (`staff_id`).
2. After customer acceptance, if the contract term is complete, the plot transitions to `MAINTENANCE` status for a mandatory 4-day soil recovery and aeration cycle before reopening as `AVAILABLE` (BR23).

---

## 7. Direct Consultation and System Communication

### a. Agricultural Advisory Messaging (SCR-KH-12 / SCR-CGNN-09)

**Function trigger:**  
The customer clicks "Ask Specialist" from their garden view or plot monitoring screen. Routes to `/customer/messages/expert/{contractId}`.

**Function description:**  
Provides a direct communication channel between the tenant and their assigned agricultural specialist. Tenants can share plant photos and ask about pest treatment or growth concerns. Specialists review the plot's telemetry history and diary logs to provide diagnostic advice.

**Screen layout:**
```
+-------------------------------------------------------------------------------+
| FARMELY LOGO                     Home   Marketplace  [My Garden]  (User Profile)|
+-------------------------------------------------------------------------------+
| Consultation Channel: Plot A02 (Tomato)                                       |
| Participant: Dr. Le Van B (Agronomy Specialist)                               |
+-------------------------------------------------------------------------------+
| Conversation History:                                                         |
|                                                                               |
| [2026-11-22 10:14] Nguyen Van A:                                              |
| Hello Doctor, I noticed small yellow spots on the lower leaves of my tomato   |
| plants this morning. Attaching a close-up photo here.                         |
| [ Attached Image: leaf_spot_detail.jpg ]                                      |
|                                                                               |
| [2026-11-22 10:35] Dr. Le Van B:                                              |
| Good morning. That appears to be early blight caused by recent humid weather. |
| I have instructed the field crew to apply an organic copper-fungicide spray   |
| this afternoon. Please keep foliage dry during any self-visits.               |
+-------------------------------------------------------------------------------+
| Type Message: [                                            ] [ Attach Image ] |
|                                                              [ Send Message ] |
+-------------------------------------------------------------------------------+
```

**Function Details:*

*Business Logic:*
1. Two discrete communication channels are maintained:
   - **Customer <-> Specialist:** Cultivation advice and diagnostic support.
   - **Staff <-> Specialist:** Internal technical reporting and field escalation.
2. Direct customer-to-field-worker messaging is prohibited to prevent conflicting instructions on the farm (BR25).

---

### b. AI Farming Assistant Chatbot (SCR-PUB-06 / SCR-KH-13)

**Function trigger:**  
The user clicks the floating "AI Assistant" icon in the lower-right corner of the interface.

**Function description:**  
Provides a 24/7 informational Q&A assistant powered by Retrieval-Augmented Generation (RAG) over the platform's agricultural knowledge base (`knowledge_documents`). Answers general questions about organic vegetable care, plant varieties, and farm operations.

**Screen layout:**
```
+-------------------------------------------------------------------------------+
|                                                    [X Close AI Chatbot Assistant]
| Farmely AI Knowledge Assistant (Automated Advisor)                            |
+-------------------------------------------------------------------------------+
| AI: Hello! I can assist with general vegetable cultivation guidelines, ideal  |
| planting windows, and farm platform procedures. How can I help you today?     |
|                                                                               |
| User: How often should I water curly kale during sunny weeks?                 |
|                                                                               |
| AI: Based on Farmely's organic kale guidelines, kale requires roughly 25 to   |
| 30 mm of water weekly. During hot spells, a deep watering every 2-3 days in  |
| the early morning (before 09:00 AM) is recommended to prevent water loss and  |
| maintain root zone moisture.                                                  |
|                                                                               |
| *Notice: AI guidance is for general reference only. For active pest or crop   |
| disease issues, please open a direct advisory ticket with your farm specialist.|
+-------------------------------------------------------------------------------+
| Ask a question... [                                             ] [ Send ]    |
+-------------------------------------------------------------------------------+
```

**Function Details:*

*Business Logic:*
1. **Scope Boundary:** The AI serves purely as an informational chatbot. It does not automatically generate binding farm treatment plans, adjust contracts, or diagnose critical crop failure.
2. Every AI response includes a disclaimer directing users to contact farm specialists for actual field issues.

---

## 8. System Administration and Master Data Management

### a. Master Services Catalog Management (SCR-AD-06)

**Function trigger:**  
The Administrator logs in, expands "Service Management" in the admin sidebar, and selects "Services Master Catalog". Routes to `/admin/services`.

**Function description:**  
Maintains the centralized catalog of billable agricultural services (`services`). Covers itemized à-la-carte care services (single weeding, pest spraying) and full-care packages. Self-growing tenants can purchase temporary 30-day full-care coverage when away, with rates calculated at 1.2x the standard monthly care fee (BR27).

**Screen layout:**
```
+-------------------------------------------------------------------------------+
| [=] FARMELY ADMIN CONSOLE             Users   Plots  [Services]   (Administrator)|
+-------------------------------------------------------------------------------+
| MASTER AGRICULTURAL SERVICES CATALOG                                          |
|                                                     [ + Add New Service Item ]|
+-------------------------------------------------------------------------------+
| Search Catalog: [ Search by name or code... ]  Filter: [ All Service Types V ]|
|                                                                               |
| ID | Service Code | Service Name           | Type         | Base Price  | Status | Actions|
|:---|:-------------|:-----------------------|:-------------|:------------|:-------|:-------|
| 01 | SRV-IRR-01   | Manual Deep Irrigation | A-la-carte   | 50,000 VND  | Active | Edit   |
| 02 | SRV-PEST-01  | Bio Neem Oil Spraying  | A-la-carte   | 80,000 VND  | Active | Edit   |
| 03 | SRV-WEED-01  | Plot Bed Weeding       | A-la-carte   | 70,000 VND  | Active | Edit   |
| 04 | SRV-CARE-30D | 30-Day Full Care Pass  | Package      | 960,000 VND | Active | Edit   |
|    |              | (Assisted Care x 1.2)  | (Temporary)  |             |        |        |
+-------------------------------------------------------------------------------+
| Showing 4 active service definitions                                          |
+-------------------------------------------------------------------------------+
```

**Function Details:*

*Business Logic (BR27):*
1. **À-la-carte Services:** Purchasing an individual service automatically inserts one `care_tasks` record for the plot, scheduled for the requested date.
2. **30-Day Full Care Package:** Allows Self-growing tenants to delegate care during vacations or busy periods.
   - Pricing formula: `Package Fee = Monthly Assisted Care Rate * 1.2` (the 20% surcharge covers short-term staff allocation).
   - System scans active `template_steps` for the plot's variety where `day_offset` falls within the 30-day window, then batch-inserts corresponding `care_tasks` for field staff.
   - When the 30-day window expires, the plot returns to self-growing mode automatically.

---

### b. Land Allocation and Plot Lifecycle Governance (SCR-AD-03 & SCR-AD-04)

**Function trigger:**  
Administrator selects "Land & Plots" from the sidebar navigation. Routes to `/admin/plots`.

**Function description:**  
Manages farm sectors (`lands`) and individual plot subdivisions (`plots`). Allows the Administrator to configure plot boundaries, square footage, monthly base rates, connected IoT device IDs, and certified crop compatibilities (`plot_crop_compatibility`). Also monitors plot availability across the tenancy and maintenance lifecycles.

**Screen layout:**
```
+-------------------------------------------------------------------------------+
| [=] FARMELY ADMIN CONSOLE             Users  [Plots]   Services   (Administrator)|
+-------------------------------------------------------------------------------+
| PLOT INVENTORY MANAGEMENT                                                     |
| Sector: [ Sector A - High-Tech Greenhouse V ]                [ + Create Plot ]|
+-------------------------------------------------------------------------------+
| Summary: Total Plots: 20 | Rented: 14 | Available: 4 | In Maintenance: 2       |
|                                                                               |
| Plot | Area | Monthly Rate | Current Status | Compatible Crops | IoT Device  | Actions|
|:-----|:-----|:-------------|:---------------|:-----------------|:------------|:-------|
| A01  | 30m2 | 1,500,000    | RENTED         | Kale, Cabbage    | IOT-A01-01  | View   |
| A02  | 45m2 | 2,100,000    | RENTED         | Tomato, Pepper   | IOT-A02-01  | View   |
| A03  | 30m2 | 1,500,000    | MAINTENANCE    | Kale, Salad      | IOT-A03-01  | Logs   |
|      |      |              | (Day 2 of 4)   |                  |             |        |
| A04  | 30m2 | 1,500,000    | AVAILABLE      | Kale, Cabbage    | IOT-A04-01  | Edit   |
+-------------------------------------------------------------------------------+
```

**Function Details:*

*Business Logic:*
1. **Soil Maintenance Cycle (BR23):** When a contract ends or produce is harvested, the plot automatically enters `MAINTENANCE` status for 4 days. During this period, staff turn and solarize the soil. Once 4 full days elapse, a nightly cron job automatically updates the status back to `AVAILABLE`.
2. **Asset-Centric Telemetry:** IoT telemetry hardware is bound directly to the physical plot record (`plots.iot_device_code`) during setup, completely separate from tenant contract records.

---

## 9. Non-Screen Background Functions

| # | Feature | Background Function | Trigger & Interval | Operational Description |
|:--|:--------|:--------------------|:-------------------|:------------------------|
| 1 | Reservation | `ExpireStaleReservationsJob` | Every 60 seconds | Scans `contracts` where `status = 'PENDING_PAYMENT'` and `reservation_expires_at < NOW()`. Reverts associated plots to `AVAILABLE` and marks the contract `EXPIRED`. |
| 2 | Contract | `ActivateCommencingContractsJob` | Daily at 00:01 AM | Scans `contracts` where `status = 'CONFIRMED'` and `start_date <= TODAY`. Updates contract status to `ACTIVE`. |
| 3 | Plot Fallow | `CompletePlotMaintenanceJob` | Daily at 01:00 AM | Scans `plots` where `status = 'MAINTENANCE'` and maintenance elapsed time >= 4 days. Updates plot status to `AVAILABLE`. |
| 4 | Operations | `GenerateDailyCareTasksJob` | Daily at 05:00 AM | Evaluates active Assisted-growing plots and temporary 30-day packages. Maps current growth day against `template_steps.day_offset` and batch-inserts daily records into `care_tasks`. |
| 5 | Operations | `FlagOverdueTasksJob` | Daily at 23:59 PM | Identifies `care_tasks` where `status IN ('PENDING', 'IN_PROGRESS')` and `due_date = TODAY`. Updates status to `OVERDUE` and alerts the Administrator. |
| 6 | Telemetry | `IngestIoTSensorTelemetry` | Every 10 minutes | Ingests data packets from plot sensor hardware, logs readings to `sensor_readings`, and checks values against crop threshold bounds. |
| 7 | Alerting | `EvaluateMicroclimateThresholds` | Triggered by telemetry | If soil moisture remains out of bounds for >30 minutes: auto-generates an urgent `care_tasks` record for Assisted plots; dispatches a push alert with an emergency care booking link for Self-growing plots. |
| 8 | Weather | `SyncWeatherForecastJob` | Every 3 hours | Queries the OpenWeatherMap API for regional weather data. If rainfall probability exceeds 80%, sets an automated pause on scheduled irrigation tasks. |
