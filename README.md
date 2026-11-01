# 🌱 AgroGebeya Ethiopia
### National Agricultural Market, Virtual Cooperative Pooling & Rural Freight Logistics Platform

> **Academic Capstone Project**  
> **Evaluation Criteria Focus:** Significance, Originality, and Technical Depth  
> **Author:** Abenezer Mathewos  

---

## 📖 Executive Summary

Agriculture constitutes the backbone of Ethiopia's economy, yet smallholder farmers across the country's diverse agricultural corridors face severe structural market friction:
1. **Market Access & Aggregation Bottlenecks:** Smallholders with small acreage cannot fulfill high-volume procurement quotas demanded by commercial buyers, universities, and food processors nationwide.
2. **Payment Insecurity & Fraud Risk:** Cash-on-delivery and unverified peer-to-peer transfers lead to non-payment and default.
3. **Deadheading in Rural Logistics:** Empty return-trip freight trucks waste capacity and drive up transit costs between regional corridors and terminal markets.
4. **Agronomic Information Barriers:** Traditional advisories are inaccessible in local regional languages (**Amharic**, **Afaan Oromoo**, **Wolayttatto Doonaa**, and **Tigrinya**).

**AgroGebeya Ethiopia** is an enterprise-grade full-stack MERN platform that solves these systemic challenges through four core pillars:
* **Platform Monetization & Chapa Escrow Vault:** Secure transactions with automated 5% platform commission retention and 95% net disbursement to farmers upon physical inspection.
* **Cooperative Virtual Yield Pooling Engine:** Enables distributed smallholders nationwide to pool micro-yields to fulfill bulk institutional contracts (e.g., commercial buyers and institutions ordering 50+ Quintals of Teff, Maize, or Wheat).
* **Localized Multilingual AI Agronomist:** Crop disease diagnostic engine fluent in **Amharic**, **Afaan Oromoo**, **Wolayttatto Doonaa**, and **English**, with national organic and agricultural remedies.
* **Role-Based Command Centers:** 5 tailored workspaces for Farmers, Cooperative Unions, Institutional Buyers, Freight Transporters, and Platform Administrators.

---

## 🏛️ Core Architecture & 4 Evaluation Pillars

```
                     ┌─────────────────────────────────────────────────────────┐
                     │                 AgroGebeya Unified Web Client          │
                     │           (React 18, Vite, Leaflet GIS, Socket.IO)      │
                     └────────────────────────────┬────────────────────────────┘
                                                  │
                 ┌────────────────────────────────┴────────────────────────────────┐
                 ▼                                                                 ▼
   ┌───────────────────────────┐                                     ┌───────────────────────────┐
   │ Universal Shared Surfaces │                                     │ Role-Based Dashboards     │
   │ • 🌾 National Marketplace │                                     │ • 👨‍🌾 Farmer Dashboard     │
   │ • 📊 GIS Price Radar      │                                     │ • 🏢 Union Coop Dashboard │
   │ • 🚚 Freight Board        │                                     │ • 🛒 Buyer Command Center │
   │ • 🌿 Multilingual Crop AI │                                     │ • 🚚 Transporter Fleet Hub│
   │ • 💬 Live Socket Messages │                                     │ • 🛡️ System Admin Panel   │
   │ • 📲 Offline USSD Sim     │                                     └─────────────┬─────────────┘
   └─────────────┬─────────────┘                                                   │
                 │                                                                 │
                 └────────────────────────────────┬────────────────────────────────┘
                                                  ▼
                     ┌─────────────────────────────────────────────────────────┐
                     │               Express & Node.js API Gateway             │
                     │          (JWT Auth, Role-Based Access Control)          │
                     └──────┬─────────────────────┬─────────────────────┬──────┘
                            │                     │                     │
          ┌─────────────────▼────────┐ ┌──────────▼──────────┐ ┌────────▼─────────────────┐
          │ Chapa & Telebirr Escrow  │ │ Virtual Pooling     │ │ Google Gemini 1.5/2.0     │
          │ • 5% Platform Take-Rate  │ │ • Aggregation Engine│ │ • Wolayttatto Doonaa      │
          │ • Payout Disbursement    │ │ • Slice Payout (95%)│ │ • Amharic / English       │
          └──────────────────────────┘ └─────────────────────┘ └───────────────────────────┘
```

---

### Pillar 1: Platform Monetization & Chapa Escrow System
* **Automated Financial Split:** `itemsPrice` calculates a 5% platform commission (`commissionAmount`) and retains 95% net for the farmer (`sellerPayoutAmount`).
* **Two-Step Escrow Vault:** Buyer payments are held in escrow (`held_in_escrow`). After physical delivery and quality verification, the buyer or administrator triggers `PUT /api/orders/:id/release-escrow`, safely disbursing the net payout to the producer.
* **Payment Gateways Supported:** Chapa API initialization & webhook verification, Telebirr, and CBE Birr.

### Pillar 2: Cooperative Virtual Yield Pooling Engine
* **Micro-Yield Aggregation:** Institutional buyers publish Request-for-Quotations (RFQs) with large targets (e.g. 50 Quintals of Maize).
* **Multi-Smallholder Slices:** Individual smallholders and primary cooperatives pledge partial yields (e.g., 10 Quintals, Grade A).
* **Lifecycle State Transitions:** The pooling engine monitors aggregate volume in real time (`open` ➔ `pool_filled` ➔ `in_transit` ➔ `delivered`), recalculates remaining capacity, and calculates individual smallholder net payouts.

### Pillar 3: Regional Language AI Agronomist
* **Nationwide Agronomic Context:** Covers all major Ethiopian staple and cash crops: Teff, Washed Coffee, Wheat, Maize, Enset (*Wesa* / *Bulla*), Oilseeds, Spices, and Pulses across all production zones.
* **Multilingual Capability:** Fluent in **Amharic (አማርኛ)**, **Afaan Oromoo**, **Wolayttatto Doonaa**, **Tigrinya (ትግርኛ)**, and **English**.
* **Resilient Multi-Model Architecture:** Gemini 1.5 Flash with fallback mechanisms ensuring high availability even under rate limits.

### Pillar 4: Security & Environment Integrity
* Strict `.gitignore` preventing accidental commits of `.env`, `node_modules/`, or uploaded files.
* Sanitized `backend/.env.example` with clear documentation.
* Sanitized inputs, JWT authentication with role authorization, and protected Mongoose schemas.

---

## 👥 Role-Based Workspaces

The platform provides 5 specialized dashboards tailored to each actor's specific needs, alongside shared public interfaces:

| Actor | Dashboard Route | Specialized Capabilities |
| :--- | :--- | :--- |
| **👨‍🌾 Smallholder Farmer** | `/farmer/dashboard` | Harvest listing management, single-crop lots, and the **Virtual Pool Pledges** tab to commit produce to bulk buyer contracts. |
| **🏢 Cooperative Union** | `/cooperative/dashboard` | Central aggregation depot management, smallholder member slice audit (grades, quintals, 95% net payout), and pool status controls. |
| **🛒 Institutional Buyer** | `/buyer/dashboard` | Direct farmgate procurement, Escrow Vault management with 1-click **"Inspect & Release Escrow"** disbursement, and RFQ bulk pool creation. |
| **🚚 Freight Transporter** | `/transporter/dashboard` | Empty return-trip dispatch, route load progress (`booked / total Quintals`), and 1-click status updates (`scheduled` ➔ `in_transit` ➔ `completed`). |
| **🛡️ System Administrator** | `/admin/dashboard` | Platform metrics across all 5 actor classes, cooperative pooling audit, platform commission revenue, and ECX daily price broadcasting. |

---

## 🛠️ Tech Stack

* **Frontend:** React 18, Vite, React Router 6, Leaflet GIS (interactive map layers with OpenStreetMap & ESRI), Socket.IO Client, KaTeX.
* **Backend:** Node.js, Express.js, MongoDB, Mongoose ODM, Socket.IO.
* **AI & External APIs:** Google Gemini Generative AI, Chapa Financial Technologies Gateway, OpenWeather API.
* **Authentication:** JSON Web Tokens (JWT) & bcrypt password hashing.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
* **Node.js** v18+ 
* **MongoDB** (Local instance or MongoDB Atlas cluster)

### 2. Environment Configuration
Create `backend/.env` based on `backend/.env.example`:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/agrogebeya_ethiopia
JWT_SECRET=your_super_secret_jwt_key_min_32_characters
JWT_EXPIRES_IN=7d
NODE_ENV=development

# Google Gemini API (For AI Agronomist & Price Forecast)
GEMINI_API_KEY=your_gemini_api_key

# Chapa Payment Gateway
CHAPA_SECRET_KEY=CHASECK_TEST-your_chapa_secret_key

BACKEND_URL=http://localhost:5000
FRONTEND_URL=http://localhost:5173
```

### 3. Install Dependencies
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 4. Seed the Database
Populate the database with sample users for all 5 roles, verified products across Ethiopian agricultural corridors, return-trip freight routes, and B2B cooperative pooling contracts:
```bash
cd backend
npm run seed
```

### 5. Launch the Application

**Terminal 1 (Backend):**
```bash
cd backend
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```

Access the application in your browser at `http://localhost:5173`.

---

## 🔑 Pre-Configured Demo Accounts

Use these accounts to demonstrate each role during project defense:

| Role | Email | Password | Primary Workflow to Demonstrate |
| :--- | :--- | :--- | :--- |
| **🛒 Wholesale Buyer** | `marta@agrogebeya.et` | `Buyer123456` | Review escrow vault, pay via Chapa, verify & release escrow, post bulk RFQ. |
| **🏢 Cooperative Union** | `tadesse@agrogebeya.et` | `Farmer123456` | Review virtual yield pooling engine, audit member farmer yield slices. |
| **👨‍🌾 Smallholder Farmer** | `alemu@agrogebeya.et` | `Farmer123456` | Manage harvest listings, pledge partial yield into an open bulk pool. |
| **🚚 Transporter** | `girma@agrogebeya.et` | `Farmer123456` | Post discounted return-trip freight, transition routes to `En Route` and `Delivered`. |
| **🛡️ System Administrator** | `admin@agrogebeya.et` | `Admin123456` | View platform-wide metrics, audit 5% take-rate commissions, broadcast ECX prices. |

---

## 📄 License
This project is submitted as an academic capstone under the **MIT License**.
