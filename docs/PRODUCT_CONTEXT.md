# Farmely product context

Source: [RP392 (NEW) — Google Docs](https://docs.google.com/document/d/1jXS2c9DiXrcG9yXU9TpF0V3H52QuoEaiYZCJaLBqTCI/edit?usp=sharing)  
Source version: 2.1  
Last reviewed: 2026-10-09  
Google Docs revision reviewed: `ANLCKQl1stlwhS5invpsuGKcZEgrpGKQpf-sPEZ5w0qCc6q0MFQhar44POVmIW8gRK0YUqgbA4vgyV-SKXb8yizO_pa_q-4raBYmnjHuzqQ`

## Product position

Farmely owns and operates one farm, prepares the land, and divides it into ready to rent plots. This is not a C2C marketplace and outside landowners do not list land.

The customer rents a plot to experience or follow cultivation without owning suitable land. Every plot has its own location, area, actual images, price, availability, water and technical conditions, IoT station data, and approved compatible crops or varieties.

The public experience should explain what customers receive and can do. Keep raw technology details secondary.

## Core lifecycle

Marketplace → optional pre-rental consultation → 15 minute reservation → 100% upfront payment → Confirmed rental → Active on start date → Self or Assisted cultivation → monitoring and Farm Diary → harvest → Completed → plot maintenance before it becomes available again.

- Payment is 100% upfront with no deposit.
- Payment pending receives one 10 minute grace period.
- The minimum rental duration must cover crop growth time plus buffer time.
- Availability checks include confirmed and active rentals, live reservations, and plot rest periods.
- Each plot in a contract can have its own crop, dates, and cultivation mode.

## Actors and boundaries

### Customer (KH)

- Finds plots, books visits, optionally asks for advice, rents plots, selects an approved crop and cultivation mode, pays, follows progress, chats with an agricultural expert, receives harvest results, and reviews rental history.
- Cannot directly assign or command field workers.

### Agricultural expert (CGNN)

- Owns crop knowledge, compatibility, standard processes, environmental thresholds, technical documents, customer advice, and field issue guidance.
- Supports both potential customers before rental and active renters while preserving the same conversation history.
- Does not perform physical field labor.

### Field worker (CVLĐ)

- Sees assigned shifts, plots, and care tasks; starts tasks; uploads required field evidence; records material use; completes work; reports issues; asks CGNN for technical guidance; and records harvest results.
- Cannot change the approved cultivation process.

### Administrator (AD)

- Manages users and RBAC, lands and plot boundaries, listing visibility, pricing, rentals, payments, services, task assignments, IoT monitoring, reports, and audit logs.
- Uses compatibility data defined by CGNN and does not override biological standards.

## Cultivation modes and Farm Diary

Cultivation mode is selected during reservation and belongs to the rented plot.

### Self-growing

- Customer performs care work.
- Customer can read the standard process as guidance.
- Customer creates Farm Diary entries and may attach photos.
- Customer may request paid temporary care or emergency help.
- IoT alerts notify the customer and offer a quick care request.

### Assisted-growing

- Farmely follows the full approved standard process.
- The system creates Care Tasks and assigns them to CVLĐ.
- CVLĐ must attach at least one real plot photo before completing a task.
- Completed task content and evidence are automatically copied into the plot's Farm Diary.
- The customer can read the diary but does not manually create assisted care entries.
- A dangerous IoT condition lasting more than 30 minutes creates an emergency task during 08:00–17:00.

## Communication model

- KH ↔ CGNN: optional advice before rental and ongoing 1:1 cultivation advice after rental. Preserve the contact and conversation when a lead becomes a renter.
- CVLĐ ↔ CGNN: field issue reporting and technical guidance.
- General AI assistant: common cultivation knowledge only and no cross-session memory.
- Prototype chat uses five second HTTP polling rather than real time WebSocket behavior.

## Dashboard focus

- Customer: My Gardens first, Marketplace and paid Services inside the customer space, plot details opened from a garden, crop progress, read-only IoT and weather, Farm Diary, service requests, CGNN chat, harvest acceptance, and contract renewal. The standalone Services entry follows service → owned plot → preferred time → mock payment. Opening Services from a plot preselects that plot and uses the shorter service → mock payment flow.
- The customer demo shows two active plots so both cultivation modes can be reviewed: one Self-growing plot and one Assisted-growing plot. Garden cards identify the cultivation mode rather than repeating a generic active status. Plot details combine read-only IoT readings and related warnings under “Cảm biến & cảnh báo”.
- CGNN: field issues, a manageable customer consultation inbox, crop and process knowledge, compatibility, and conversations with customers and CVLĐ.
- CVLĐ: mobile friendly daily work, assigned plots, task details, photo and material evidence, issue reporting, CGNN chat, and harvest logging.
- Admin: occupancy, revenue, users and RBAC, land and plot management, task coordination, IoT alerts, transactions, and audit logs.

Only show information needed for the current actor's next decisions and actions.

## Important business rules

- Customers may choose only approved varieties compatible with the plot.
- Self-growing deviations from the standard process need CGNN guidance or approval.
- Assisted-growing follows the standard process without customer specific process customization.
- Tasks incomplete after 23:59 become Overdue.
- Heavy rain or soil moisture at or above 80% postpones watering tasks.
- Harvest is performed by CVLĐ, weighed, photographed, and accepted by the customer.
- Without renewal, a completed plot enters Maintenance for cleanup and soil rest before reopening.
- CGNN accesses assigned operational plots; CVLĐ accesses assigned work and only the related information.
- IoT, weather, images, diary, and task data provide traceability. They do not constitute a legal food safety or organic certification.

## Prototype boundaries

- Four actors, marketplace, rental and mock payment, care tasks, diary synchronization, IoT and weather, AI knowledge lookup, harvest, and acceptance are in scope.
- External land listings, real IoT hardware, real banking integration, automated logistics, payroll, and complex attendance are out of scope.
- One farm with at most 50 plots, Vietnamese only, GMT+7, simulated IoT every three hours, mock successful payments, and manual dispute handling.
- Image uploads are limited to 5 MB per file and 10 images per task in the formal requirements. Demo helpers may be stricter but must not exceed these limits.

