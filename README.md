# 🌾 Farmely — Smart Farm Plot Rental & Urban Cultivation Experience Platform

> **An Enterprise System Analysis & Full-Stack Platform for Farmland Subdivision, Plot Leasing, and IoT-Tracked Agricultural Experiences.**

<div align="center">

[![Course: ISP392](https://img.shields.io/badge/Course-FPTU_ISP392_Capstone-blue.svg?style=flat-square)](#)
[![Backend: Spring Boot](https://img.shields.io/badge/Backend-Spring_Boot_3-6DB33F.svg?style=flat-square&logo=springboot)](#)
[![Frontend: React](https://img.shields.io/badge/Frontend-React_19_Vite-61dafb.svg?style=flat-square&logo=react)](#)
[![Database: PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL_3NF-336791.svg?style=flat-square&logo=postgresql)](#)
[![Architecture: Modular Monolith](https://img.shields.io/badge/Architecture-Modular_Monolith-orange.svg?style=flat-square)](#)
[![SSoT: BR01-BR27](https://img.shields.io/badge/Business_Rules-BR01_to_BR27-purple.svg?style=flat-square)](#)

</div>

---

## 📌 1. Project Overview & Business Background

Urban residents in metropolitan areas increasingly desire food transparency — wanting to know exactly where their vegetables are grown, by whom, and using what methods. However, individual farming is heavily constrained by land availability, technical expertise, and personal time.

**Farmely** solves this by establishing an integrated agricultural marketplace and operations management system:
* **Farmland Master Planning:** The platform operates pre-planned, renovated land divided into standardized **Plots** (with individual GPS coordinates, area, soil health, and IoT monitoring).
* **Flexible Cultivation Models:**
  1. **Self-growing:** Customers experience hands-on farming following standard SOP guidelines.
  2. **Assisted-growing:** A turnkey end-to-end service where on-site agricultural staff perform daily farming tasks under expert agronomic supervision.
* **Full Transparency:** Real-time microclimate IoT metrics, Farm Diary logging, and expert agricultural consultation.

---

## 📐 2. Business Analysis & System Architecture Deliverables

As the **System Analyst & Requirements Lead**, the system was architected around a strict Single Source of Truth (SSoT) comprising 27 formal business rules (**BR01 – BR27**):

### Key Business Architecture Decisions:
1. **Master Lease Agreement (BR01):** Single unified contract covering multiple plots (`contract_plots`). Eliminates fragmented e-commerce cart mechanics; contracts are signed and paid in a single atomic transaction while maintaining independent plot dashboards.
2. **Grace Period & Concurrency Control (BR08):** Implemented a 10-minute automated reservation hold with atomic rollback to prevent ghost plot hoarding during peak booking periods.
3. **Traceability Matrix (RTM):** 100% bidirectional traceability linking:
   `Business Goals ➔ Stakeholder Needs ➔ Functional Requirements (FR) ➔ Use Cases ➔ DFD Level 0/1 ➔ Database Schema (ERD) ➔ UAT Test Cases`.
4. **Normalized Relational Data Model (3NF):** 12 core business entities (`Farm`, `Plot`, `CropVariety`, `Contract`, `ServiceMaster`, `FarmDiary`, `IoTStation`, `User`) structured in Third Normal Form to prevent update anomalies.
5. **No Material Consumption Tracking (YAGNI Trade-off):** All farming services utilize a lump-sum pricing engine (BR27), deliberately eliminating raw material inventory overhead while preserving operational simplicity.

---

## 🔄 3. Process Modeling & Workflow (DFD & BPMN)

```
[Customer]
    │
    ├──► 1. Browse Marketplace & Filter Available Plots
    ├──► 2. Select Crop & Farming Model (Self / Assisted)
    ├──► 3. [Optional] Pre-Rental Agronomist Consultation
    └──► 4. 100% Lump-Sum Payment & Master Lease Activation (BR01, BR08)
             │
[Field Staff & IoT] ──► Daily Task Execution ──► Farm Diary Log ──► Customer Dashboard
```

* **Main Flow:** Booking ➔ Payment Verification ➔ Plot Handover ➔ Cultivation Cycle ➔ Harvest Delivery.
* **Exception Flows:** Payment Timeout Rollback (BR08), Weather Emergency Task Re-scheduling (BR15), Contract Early Termination & Deposit Settlement.

---

## 🧪 4. Quality Assurance & UAT Verification

* **UAT Coverage:** Formulated and executed **40+ structured UAT test scenarios** covering Happy Path, Alternative Paths, and Edge-case Exception flows.
* **Verification vs. Validation:**
  * *Verification:* Strict static analysis and schema consistency checks across DFD balanced levels and REST API response payloads.
  * *Validation:* Interactive prototype reviews with representative urban farming hobbyists to validate user journey friction.

---

## 🛠️ Technology Stack & Deployment

| Component | Technology | Rationale |
| :--- | :--- | :--- |
| **Backend** | Java Spring Boot 3, Spring Data JPA | High transactional reliability and robust enterprise business rule enforcement |
| **Frontend** | React 19, Vite, Tailwind CSS, Zustand | High-performance state management and responsive client dashboard |
| **Database** | PostgreSQL 16 (3NF normalized) | ACID compliance for financial contracts and lease agreements |
| **Containerization** | Docker, Docker Compose | Consistent local and staging environment parity |
| **Analysis Tools** | PlantUML, Draw.io, Postman, Vitest | Architectural documentation and automated API validation |

---

## 🚀 Running the Project Locally

```bash
# Clone the repository
git clone https://github.com/thaiquyen93/farmely.git

# Navigate to project directory
cd farmely

# Start all services (Database, Backend, Frontend) via Docker Compose
docker compose up -d

# Or run frontend independently
cd frontend
npm install
npm run dev
```

---

## 💡 Architectural Retrospective (Trade-offs & Learnings)

* **Architecture Choice:** Chose a **Modular Layered Monolith** over Microservices for the 4-person development cycle, significantly reducing network latency, distributed transaction complexity, and debugging overhead.
* **What would be done differently with higher budget:** Implement automated IoT telemetry ingestion via MQTT brokers (e.g., EMQX) and real-time WebSocket pushing for instant soil moisture threshold alerts.

---

<div align="center">
Developed by <strong>Ta Nguyen Khoi Nguyen &amp; Team</strong> • FPT University (ISP392)
</div>
