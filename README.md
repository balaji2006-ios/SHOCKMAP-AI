# MedForecast — Phase 1 Prototype

> **SHOCKMAP AI | Phase 1: Healthcare Resource & Coordination Prototype**

MedForecast is the **Phase 1 working prototype** of the SHOCKMAP AI vision. It establishes the operational foundation required for a future medicine-shortage intelligence platform by connecting hospitals, monitoring healthcare resources, coordinating requests, visualizing hospital networks, and supporting ambulance–hospital communication in real time.

**Important:** Phase 1 is intentionally focused on the **coordination and data foundation**. AI-based medicine demand forecasting, stockout prediction, shortage propagation, optimization, and explainable-risk intelligence are planned for later phases and are **not represented as completed features in this prototype**.

---

## 1. Project Vision

Healthcare supply disruptions are rarely isolated. A shortage at one facility can create pressure on nearby hospitals, suppliers, distributors, and emergency services.

The long-term SHOCKMAP AI vision is to move from:

**Reactive Response → Predictive Coordination → Intelligent Regional Shortage Prevention**

MedForecast Phase 1 begins with the operational foundation:

```text
Hospitals
    ↓
Resource Monitoring
    ↓
Resource Requests
    ↓
Hospital Network
    ↓
Real-Time Coordination
    ↓
Ambulance & Facility Support
```

Future phases will extend this foundation into:

```text
DATA
  ↓
FORECAST
  ↓
PREDICT
  ↓
CONNECT
  ↓
SIMULATE
  ↓
OPTIMIZE
  ↓
EXPLAIN
```

---

# 2. Phase 1 Objective

The objective of this prototype is to demonstrate that healthcare facilities can share operational information and coordinate resources through a centralized, real-time platform.

### Phase 1 focuses on:

* Hospital resource visibility
* Hospital-to-hospital resource coordination
* Resource request management
* Real-time notifications
* Geographic hospital discovery
* Ambulance coordination
* Facility availability requests
* Basic network analytics

---

# 3. Current Prototype Features

## 🏥 3.1 Hospital Resource Dashboard

Each hospital can manage and monitor operational resources.

Current resource categories include:

* ICU / Bed Availability
* Ventilators
* Blood Units
* Doctors / Medical Staff

The dashboard provides resource cards and real-time synchronization with Firebase Firestore.

---

## 🔄 3.2 Resource Coordination

Hospitals can create and respond to resource requests.

### Request Workflow

```text
Create Request
      ↓
Network Notification
      ↓
Hospital Reviews Request
      ↓
Offer / Respond
      ↓
Request Fulfilled
```

Requests include information such as:

* Resource required
* Quantity
* Urgency
* Requesting hospital
* Status
* Timestamp

---

## 🗺️ 3.3 Hospital Network Map

The platform provides a geographic view of hospitals using Google Maps.

The map supports:

* Hospital locations
* Hospital discovery
* Geographic proximity
* Government / Private filtering
* Distance calculation
* Regional coordination

Distance calculations use the **Haversine formula** based on geographic coordinates.

---

## 🚑 3.4 Ambulance Coordination

Phase 1 also includes a dedicated ambulance workflow.

Hospitals can:

* Register ambulance profiles
* View ambulance availability
* Create ambulance requests
* Receive request notifications
* Accept ambulance requests
* Track request status

Ambulances can also request nearby hospital facilities based on patient requirements.

---

## 🏥 3.5 Facility Availability Coordination

An ambulance can broadcast a facility requirement to nearby hospitals.

Example:

```text
Ambulance
    ↓
Patient Requires ICU
    ↓
Find Hospitals Within Radius
    ↓
Notify Nearby Hospitals
    ↓
Hospital Responds
    ↓
Ambulance Receives Availability
```

The current prototype uses a **20 km radius** for this workflow.

---

## 🔔 3.6 Real-Time Notifications

Firebase Firestore listeners provide real-time updates for:

* Resource changes
* Open requests
* Facility requests
* Ambulance requests
* Request responses
* Coordination notifications

This enables multiple users to see operational changes without manually refreshing the application.

---

## 📊 3.7 Analytics Dashboard

The prototype includes basic operational analytics such as:

* Total hospitals / network size
* Total requests
* Open requests
* Fulfillment rate
* Resource utilization
* Request trends
* Response-time information

These analytics establish the data layer that can later support predictive models.

---

# 4. System Architecture

```text
                    ┌─────────────────────┐
                    │     React + Vite    │
                    │    Frontend / UI    │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │  Application Logic  │
                    │  React Components   │
                    │  Services           │
                    └──────────┬──────────┘
                               │
                 ┌─────────────┼─────────────┐
                 ▼             ▼             ▼
        ┌──────────────┐ ┌────────────┐ ┌──────────────┐
        │ Firebase     │ │ Google     │ │ Recharts     │
        │ Auth +       │ │ Maps       │ │ Analytics    │
        │ Firestore    │ │ API        │ │              │
        └──────────────┘ └────────────┘ └──────────────┘
```

---

# 5. Technology Stack

## Frontend

* React 19
* Vite
* React Router
* Tailwind CSS
* Lucide React

## Backend / Cloud Services

* Firebase Authentication
* Firebase Firestore

## Maps

* Google Maps
* `@react-google-maps/api`

## Data Visualization

* Recharts

## Development

* Node.js
* npm
* ESLint
* PostCSS
* Autoprefixer

---

# 6. Project Structure

```text
MedForecast-main/
│
├── public/
│
├── src/
│   ├── assets/
│   │
│   ├── components/
│   │   ├── common/
│   │   │   ├── Footer.jsx
│   │   │   ├── HospitalMap.jsx
│   │   │   └── NotificationDropdown.jsx
│   │   │
│   │   └── dashboard/
│   │       ├── CreateRequestModal.jsx
│   │       ├── RequestCard.jsx
│   │       └── ResourceUpdateModal.jsx
│   │
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Dashboard.jsx
│   │   ├── HospitalProfile.jsx
│   │   ├── MapView.jsx
│   │   ├── Requests.jsx
│   │   ├── Analytics.jsx
│   │   ├── Ambulances.jsx
│   │   ├── AmbulanceDashboard.jsx
│   │   └── AmbulanceProfileSetup.jsx
│   │
│   ├── services/
│   │   ├── firebase.js
│   │   ├── hospitalService.js
│   │   ├── resourceService.js
│   │   ├── requestService.js
│   │   ├── ambulanceService.js
│   │   └── notificationService.js
│   │
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
│
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
└── README.md
```

---

# 7. Main Application Routes

| Route                      | Purpose                          |
| -------------------------- | -------------------------------- |
| `/login`                   | Hospital / user authentication   |
| `/dashboard`               | Main hospital resource dashboard |
| `/profile`                 | Hospital profile setup           |
| `/map`                     | Hospital network map             |
| `/requests`                | Resource coordination requests   |
| `/analytics`               | Operational analytics            |
| `/ambulances`              | Ambulance network                |
| `/ambulance-dashboard`     | Ambulance request dashboard      |
| `/ambulance-profile-setup` | Ambulance profile setup          |

---

# 8. Firebase Data Layer

The prototype uses Firestore collections to support real-time coordination.

Key data areas include:

```text
hospitals
resources
requests
notifications
ambulances
ambulanceRequests
facilityRequests
```

The service layer separates Firestore operations from the UI.

Examples include:

* Create / update resources
* Subscribe to resources
* Create requests
* Subscribe to open requests
* Create notifications
* Register ambulances
* Update ambulance availability
* Create facility requests
* Respond to facility requests

---

# 9. Installation

## Prerequisites

Install:

* Node.js
* npm
* Git
* Firebase project
* Google Maps API key

Verify Node and npm:

```bash
node -v
npm -v
```

---

# 10. Run the Project

## Step 1 — Clone the Repository

```bash
git clone <your-repository-url>
cd MedForecast-main
```

## Step 2 — Install Dependencies

```bash
npm install
```

## Step 3 — Configure Firebase

Configure the Firebase project used by:

```text
src/services/firebase.js
```

Enable:

* Firebase Authentication
* Firebase Firestore

## Step 4 — Configure Google Maps

Provide a valid Google Maps API key for the map components.

Enable the required Google Maps APIs in Google Cloud.

## Step 5 — Start Development Server

```bash
npm run dev
```

The Vite development server will display the local URL in the terminal.

---

# 11. Production Build

Create a production build:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

Run linting:

```bash
npm run lint
```

---

# 12. Phase 1 → Phase 2 Evolution

Phase 1 creates the operational data foundation.

The next phase transforms that foundation into **SHOCKMAP AI**.

## Phase 2 — Medicine Intelligence

```text
Hospital Medicine Inventory
          +
Historical Demand
          +
Supplier Data
          +
Regional Data
          ↓
Feature Engineering
          ↓
AI Demand Forecast
          ↓
Stockout Risk Prediction
```

### Planned capabilities:

* Medicine-level inventory tracking
* Demand forecasting
* Days-to-stockout prediction
* Shortage-risk scoring
* Anomaly detection

---

# 13. Phase 3 — Supply Network Intelligence

The system will evolve from a hospital network into a medicine supply network.

```text
Hospital
   ↕
Distributor
   ↕
Supplier
   ↕
Medicine
```

### Planned capabilities:

* Supply dependency mapping
* Supplier reliability analysis
* Medicine availability graph
* Regional vulnerability detection
* Critical-node identification

### Potential technologies:

* NetworkX
* Graph algorithms
* PostgreSQL / graph-compatible storage

---

# 14. Phase 4 — Shortage Simulation

SHOCKMAP AI will introduce a **What-If Simulation Engine**.

Example:

```text
Supplier Delay
      ↓
Medicine Availability ↓
      ↓
Hospital Stock ↓
      ↓
Stockout Risk ↑
      ↓
Nearby Hospitals Affected
```

Users will be able to test scenarios such as:

* Supplier failure
* Demand spike
* Delivery delay
* Hospital stockout
* Regional shortage

The system can then estimate how a disruption may propagate through the connected network.

---

# 15. Phase 5 — Optimization & Response

After identifying a potential shortage, the system will move from prediction to recommended action.

## Redistribution

Identify potential surplus resources and candidate receiving facilities.

## Supplier Recommendation

Identify alternative supply sources based on defined constraints.

## Allocation Optimization

Recommend allocations while considering:

* Current stock
* Forecast demand
* Safety stock
* Transportation constraints
* Regional requirements

### Potential technology:

* Google OR-Tools
* Python optimization models

---

# 16. Phase 6 — Explainable AI

Predictions should not appear as unexplained numbers.

The future SHOCKMAP interface will show:

```text
SHORTAGE RISK: HIGH

Demand ↑
Current Stock ↓
Supplier Delay ↑

Predicted Stockout:
4.2 Days

Confidence:
84%

Key Contributing Factors:
• Increased demand
• Reduced inventory
• Supplier delay
```

The goal is to make every important AI output understandable to the person making the operational decision.

---

# 17. Future SHOCKMAP AI Architecture

```text
┌─────────────────────────┐
│      DATA SOURCES       │
│ Hospitals               │
│ Pharmacies              │
│ Suppliers               │
│ Demand Data             │
└────────────┬────────────┘
             ↓
┌─────────────────────────┐
│    DATA PROCESSING      │
│ Cleaning                │
│ Integration             │
│ Feature Engineering     │
└────────────┬────────────┘
             ↓
┌─────────────────────────┐
│     AI PREDICTION       │
│ Demand Forecast         │
│ Stockout Risk           │
│ Anomaly Detection       │
└────────────┬────────────┘
             ↓
┌─────────────────────────┐
│   GRAPH INTELLIGENCE    │
│ Hospitals               │
│ Suppliers               │
│ Medicines               │
│ Dependencies            │
└────────────┬────────────┘
             ↓
┌─────────────────────────┐
│   SIMULATION ENGINE     │
│ What-If Scenarios       │
│ Propagation             │
│ Regional Impact         │
└────────────┬────────────┘
             ↓
┌─────────────────────────┐
│      OPTIMIZATION       │
│ Redistribution          │
│ Supplier Selection      │
│ Allocation              │
└────────────┬────────────┘
             ↓
┌─────────────────────────┐
│     EXPLAINABLE AI      │
│ Risk Factors            │
│ Confidence              │
│ Reasoning               │
└────────────┬────────────┘
             ↓
┌─────────────────────────┐
│    SHOCKMAP DASHBOARD   │
│ Alerts                  │
│ Risk Map                │
│ Recommendations         │
└─────────────────────────┘
```

---

# 18. Development Roadmap

| Phase       | Focus                                      | Status     |
| ----------- | ------------------------------------------ | ---------- |
| **Phase 1** | Hospital Resource & Coordination Prototype | ✅ Current  |
| **Phase 2** | Medicine Inventory & Demand Forecasting    | 🔜 Planned |
| **Phase 3** | Supply-Network Graph Intelligence          | 🔜 Planned |
| **Phase 4** | Shortage Propagation Simulation            | 🔜 Planned |
| **Phase 5** | Optimization & Response Recommendations    | 🔜 Planned |
| **Phase 6** | Explainable AI & Advanced Dashboard        | 🔜 Planned |

---

# 19. Current Limitations

This is a **Phase 1 prototype**, so the following are intentionally outside the current implementation:

* No production-grade medicine demand forecasting
* No trained stockout prediction model
* No medicine supply-chain graph
* No shortage propagation engine
* No optimization engine
* No production procurement automation
* No autonomous medical decision-making
* No guarantee that prototype analytics represent real-world healthcare outcomes

Future performance metrics should be validated using appropriate real, authorized, or public datasets before being presented as measured results.

---

# 20. Security & Production Considerations

Before production deployment, the following should be strengthened:

* Firestore Security Rules
* Role-based access control
* Environment-based configuration
* API-key restrictions
* Data encryption and secure transport
* Audit logging
* Input validation
* Error monitoring
* Backup and recovery
* Privacy controls for healthcare information
* Compliance review appropriate to the deployment environment

The prototype should use **synthetic, anonymized, or appropriately authorized data** during development and demonstrations.

---

# 21. Business Potential

The long-term SHOCKMAP AI platform can serve multiple healthcare stakeholders:

```text
                  SHOCKMAP AI
                      │
       ┌──────────────┼──────────────┐
       ↓              ↓              ↓
   Hospitals      Suppliers     Government
       │              │              │
       └──────────────┼──────────────┘
                      ↓
              Regional Visibility
                      ↓
             Supply Resilience
```

Potential business models include:

* SaaS subscriptions
* Enterprise deployments
* API / system integration
* Analytics services
* Government / institutional partnerships

The commercial model should be validated through pilots and customer discovery.

---

# 22. Key Differentiator

SHOCKMAP AI is designed to evolve beyond a conventional inventory dashboard.

The intended intelligence loop is:

> **Predict → Connect → Simulate → Optimize → Explain**

Instead of only answering:

> **“What is out of stock?”**

The future system aims to answer:

> **“What is likely to become scarce, where could the shortage spread, what may be causing it, and what feasible actions could reduce the impact?”**

---

# 23. Prototype Demonstration Flow

For a hackathon demonstration, Phase 1 can be presented as:

```text
LOGIN
  ↓
Hospital Dashboard
  ↓
View Current Resources
  ↓
Create Resource Request
  ↓
Nearby Hospitals Receive Notification
  ↓
Hospital Responds
  ↓
Request Coordination
  ↓
View Network on Map
  ↓
Ambulance Coordination
  ↓
Analytics
```

Then demonstrate the future SHOCKMAP transition:

```text
PHASE 1
Operational Coordination
        ↓
PHASE 2
Medicine Intelligence
        ↓
PHASE 3
Supply Network Intelligence
        ↓
PHASE 4
Predictive Shortage Intelligence
```

---

# 24. Project Positioning

**MedForecast Phase 1 is the operational foundation of SHOCKMAP AI.**

It demonstrates the ability to:

* Connect healthcare facilities
* Share operational resources
* Coordinate requests
* Communicate in real time
* Visualize regional healthcare networks
* Build the data foundation required for predictive intelligence

The next evolution is to transform this connected operational network into a **predictive medicine-supply resilience platform**.

---

# 25. Future Technology Stack

As SHOCKMAP AI evolves, the technology stack can expand to:

```text
Frontend
React + TypeScript + Tailwind CSS
        ↓
Backend
FastAPI + Python
        ↓
Machine Learning
XGBoost + scikit-learn
        ↓
Graph Intelligence
NetworkX / Neo4j
        ↓
Optimization
OR-Tools
        ↓
Database
PostgreSQL / Firebase
        ↓
Deployment
Docker + Cloud Infrastructure
```

---

# 26. Project Status

### Current Status

**Phase 1 — Working Prototype**

The current version demonstrates the healthcare coordination foundation.

### Next Milestone

**Phase 2 — Medicine Intelligence**

The next development milestone is to introduce:

* Medicine inventory
* Historical demand
* Demand forecasting
* Stockout-risk prediction
* Days-to-stockout
* Medicine shortage alerts

---

# 27. Acknowledgement

Built as a **hackathon / academic prototype** exploring AI-assisted healthcare coordination and medicine-supply resilience.

---

# 28. Final Concept

```text
MEDFORECAST — PHASE 1
          ↓
CONNECT HEALTHCARE
          ↓
UNDERSTAND THE NETWORK
          ↓
CAPTURE OPERATIONAL DATA
          ↓
SHOCKMAP AI
          ↓
PREDICT
          ↓
SIMULATE
          ↓
OPTIMIZE
          ↓
EXPLAIN
```

> **From reacting to shortages to anticipating them.**

---

## SHOCKMAP AI

**Predict → Connect → Simulate → Optimize → Explain**

**Building a smarter, more resilient healthcare supply network.**
