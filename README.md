# 🌾 AgroGebeya Ethiopia
### National Agricultural Market, Virtual Cooperative Pooling & Rural Freight Logistics Platform

> **Academic Capstone Project**  
> **Evaluation Criteria Focus:** Significance, Originality, and Technical Depth  
> **Author:** Abenezer Mathewos

---

## 🔗 Live Deployment

| | URL |
| :--- | :--- |
| 🌐 **Live Platform** | [https://agro-gebeya.vercel.app](https://agro-gebeya.vercel.app) |
| 🟠 **Backend API** | [https://agrogebeya-backend.onrender.com](https://agrogebeya-backend.onrender.com) |
| 📦 **GitHub Repository** | [https://github.com/AbenezerMathewos/AgroGebeya](https://github.com/AbenezerMathewos/AgroGebeya) |

> **Note:** The backend is hosted on Render's free tier. The first request after a period of inactivity may take 20–30 seconds to wake up.

---

## 📋 Executive Summary

Agriculture constitutes the backbone of Ethiopia's economy, yet smallholder farmers across the country's diverse agricultural corridors face severe structural market friction:
1. **Market Access & Aggregation Bottlenecks:** Smallholders with small acreage cannot fulfill high-volume procurement quotas demanded by commercial buyers, universities, and food processors nationwide.
2. **Payment Insecurity & Fraud Risk:** Cash-on-delivery and unverified peer-to-peer transfers lead to non-payment, predatory middleman pricing, and default.
3. **Deadheading in Rural Logistics:** Empty return-trip freight trucks waste capacity and drive up transit costs between regional corridors and terminal markets.
4. **Agronomic Information Barriers:** Traditional advisories are inaccessible in local regional languages (**Amharic**, **Afaan Oromoo**, **Wolayttatto Doonaa**, and **Tigrinya**).

**AgroGebeya Ethiopia** is an enterprise-grade full-stack MERN platform that solves these systemic challenges through four core pillars:
* **Platform Monetization & Chapa Escrow Vault:** Secure transactions with automated 5% platform commission retention and 95% net disbursement to farmers upon physical inspection.
* **Cooperative Virtual Yield Pooling Engine:** Enables distributed smallholders nationwide to pool micro-yields to fulfill bulk institutional contracts (e.g., commercial buyers and institutions ordering 50+ Quintals of Teff, Maize, or Wheat).
* **Localized Multilingual AI Agronomist:** Crop disease diagnostic engine fluent in **Amharic (አማርኛ)**, **Afaan Oromoo**, **Wolayttatto Doonaa**, and **English**, with national organic and agricultural remedies.
* **Role-Based Command Centers:** 5 tailored workspaces for Farmers, Cooperative Unions, Institutional Buyers, Freight Transporters, and Platform Administrators.

---

## 🏛️ Core Architecture & 4 Evaluation Pillars

```
+-----------------------------------------------------------------------------------+
|                           AgroGebeya Unified Web Client                           |
|                    (React 18, Vite, Leaflet GIS, Socket.IO)                       |
+-----------------------------------------------------------------------------------+
                                          |
            +-----------------------------+-----------------------------+
            |                                                           |
+---------------------------+                               +-----------------------+
|  Universal Surfaces       |                               | Role-Based Dashboards |
|  * National Marketplace   |                               | * Farmer Dashboard    |
|  * GIS Price Radar        |                               | * Coop Union Depot    |
|  * Rural Freight Board    |                               | * Buyer Command Hub   |
|  * Multilingual Crop AI   |                               | * Transporter Fleet   |
|  * Live Socket Messaging  |                               | * System Admin Panel  |
|  * Offline USSD Simulator |                               +-----------------------+
+---------------------------+                                           |
            |                                                           |
            +-----------------------------+-----------------------------+
                                          |
+-----------------------------------------------------------------------------------+
|                        Express & Node.js API Gateway                              |
|                   (JWT Auth, Role-Based Access Control)                           |
+-----------------------------------------------------------------------------------+
       |                    |                    |                    |
+--------------+     +--------------+     +--------------+     +--------------+
| MongoDB Atlas|     |  Google AI   |     | Chapa Escrow |     |  Socket.IO   |
| Database Hub |     |  (Gemini)    |     |   Gateway    |     |  Real-Time   |
+--------------+     +--------------+     +--------------+     +--------------+
```

### Pillar 1: Escrow Protection & Monetization
* **Chapa Payment Gateway Integration:** Buyers fund an escrow vault for orders.
* **5% Platform Take-Rate:** The platform automatically retains a 5% commission on transactions, crediting 95% net payout to the producer upon goods inspection and buyer release.
* **Automated Trust Timeline:** Real-time visual tracking from `Pending Payment` -> `Payment Locked in Escrow` -> `En Route` -> `Delivered & Inspected` -> `Funds Disbursed`.

### Pillar 2: Virtual Cooperative Yield Pooling
* **Bulk Demand Aggregation:** Institutional buyers post Request For Quotes (RFQs) for high-tonnage commodities (e.g., 100 Quintals of White Teff).
* **Distributed Pledging:** Individual farmers pledge their fractional harvests (e.g., 5 Quintals, 10 Quintals) toward the shared target.
* **Cooperative Union Oversight:** Unions verify quality, inspect moisture levels, and manage delivery status (`open` -> `pool_filled` -> `in_transit` -> `delivered`), recalculating remaining capacity and individual smallholder net payouts.

### Pillar 3: Regional Language AI Agronomist
* **Nationwide Agronomic Context:** Covers major Ethiopian staple and cash crops: Teff, Washed Coffee, Wheat, Maize, Enset (*Wesa* / *Bulla*), Oilseeds, Spices, and Pulses across all production zones.
* **Multilingual Capability:** Fluent in **Amharic (አማርኛ)**, **Afaan Oromoo**, **Wolayttatto Doonaa**, **Tigrinya (ትግርኛ)**, and **English**.
* **Resilient Multi-Model Architecture:** Gemini 1.5 Flash with fallback mechanisms ensuring high availability even under rate limits.

### Pillar 4: Security & Environment Integrity
* Strict `.gitignore` preventing accidental commits of `.env`, `node_modules/`, or uploaded files.
* Sanitized `backend/.env.example` with clear documentation.
* Sanitized inputs, JWT authentication with role authorization, and protected Mongoose schemas.

---

## 👥 Role-Based Workspaces

The platform provides 5 specialized dashboards tailored to each actor's specific needs:

| Actor | Dashboard Route | Specialized Capabilities |
| :--- | :--- | :--- |
| **🧑‍🌾 Smallholder Farmer** | `/farmer/dashboard` | Harvest listing management, single-crop lots, and the **Virtual Pool Pledges** tab to commit produce to bulk buyer contracts. |
| **🤝 Cooperative Union** | `/cooperative/dashboard` | Central aggregation depot management, smallholder member slice audit (grades, quintals, 95% net payout), and pool status controls. |
| **🏢 Institutional Buyer** | `/buyer/dashboard` | Direct farmgate procurement, Escrow Vault management with 1-click **"Inspect & Release Escrow"** disbursement, and RFQ bulk pool creation. |
| **🚚 Freight Transporter** | `/transporter/dashboard` | Empty return-trip dispatch, route load progress (`booked / total Quintals`), and status updates (`scheduled` -> `in_transit` -> `completed`). |
| **🛡️ System Administrator** | `/admin/dashboard` | Platform metrics across all 5 actor classes, cooperative pooling audit, platform commission revenue, and ECX daily price broadcasting. |

---

## 🛠️ Tech Stack

* **Frontend:** React 18, Vite, React Router 6, Leaflet GIS (interactive map layers with OpenStreetMap & ESRI), Socket.IO Client.
* **Backend:** Node.js, Express.js, MongoDB, Mongoose ODM, Socket.IO.
* **AI & External APIs:** Google Gemini Generative AI, Chapa Financial Technologies Gateway, OpenWeather API.
* **Authentication:** JSON Web Tokens (JWT) & bcrypt password hashing.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
* **Node.js** v18+
* **MongoDB** (Local MongoDB instance or MongoDB Atlas cluster URI)

### 2. Environment Configuration
Create `backend/.env` using `backend/.env.example` as a template:

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
# Root or Backend
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

**Terminal 1 (Backend API):**
```bash
cd backend
npm run dev
```

**Terminal 2 (Frontend Client):**
```bash
cd frontend
npm run dev
```

Access the application in your browser at `http://localhost:5173`.

---

## 🔑 Pre-Configured Demo Accounts

Use these accounts to demonstrate each role during project evaluation / defense:

| Role | Email | Password | Primary Workflow to Demonstrate |
| :--- | :--- | :--- | :--- |
| **🏢 Wholesale Buyer** | `buyer@agrogebeya.et` | `Buyer123456` | Review escrow vault, pay via Chapa, verify & release escrow, post bulk RFQ. |
| **🤝 Cooperative Union** | `cooperative@agrogebeya.et` | `Coop123456` | Review virtual yield pooling engine, audit member farmer yield slices. |
| **🧑‍🌾 Smallholder Farmer** | `farmer@agrogebeya.et` | `Farmer123456` | Manage harvest listings, pledge partial yield into an open bulk pool. |
| **🚚 Transporter** | `transporter@agrogebeya.et` | `Transporter123456` | Post discounted return-trip freight, transition routes to `En Route` and `Delivered`. |
| **🛡️ System Administrator** | `admin@agrogebeya.et` | `Admin123456` | View platform-wide metrics, audit 5% take-rate commissions, broadcast ECX prices. |

---

## 📄 License
This project is submitted as an academic capstone under the **MIT License**.

---

## 📁 Project Structure

```
AgroGebeya/
├── backend/
│   ├── config/
│   │   └── db.js                  # MongoDB Atlas connection
│   ├── controllers/               # Business logic for each module
│   │   ├── authController.js      # Register, login, JWT issuance
│   │   ├── productController.js   # Harvest listing CRUD
│   │   ├── orderController.js     # Escrow & order lifecycle
│   │   ├── poolOrderController.js # Virtual yield pooling engine
│   │   ├── freightController.js   # Return-trip freight dispatch
│   │   ├── advisoryController.js  # Gemini AI agronomist
│   │   ├── marketPriceController.js # ECX price broadcasting
│   │   ├── chatController.js      # Messaging
│   │   ├── notificationController.js
│   │   ├── reviewController.js
│   │   ├── weatherController.js
│   │   └── adminController.js     # Platform-wide admin metrics
│   ├── middleware/
│   │   ├── authMiddleware.js      # JWT verification & role guards
│   │   └── uploadMiddleware.js    # Multer file handling
│   ├── models/                    # Mongoose schemas
│   │   ├── User.js
│   │   ├── Product.js
│   │   ├── Order.js
│   │   ├── PoolOrder.js
│   │   ├── FreightTrip.js
│   │   ├── CropAdvisory.js
│   │   ├── MarketPrice.js
│   │   ├── Conversation.js
│   │   ├── Message.js
│   │   ├── Notification.js
│   │   └── Review.js
│   ├── routes/                    # Express route definitions
│   ├── utils/
│   │   └── seedData.js            # Demo data for all 5 roles
│   ├── server.js                  # Entry point & middleware setup
│   ├── socket.js                  # Socket.IO real-time event handlers
│   └── .env.example               # Environment variable template
└── frontend/
    └── src/
        ├── components/            # Reusable UI components
        ├── context/               # React context (auth state)
        ├── hooks/                 # Custom React hooks
        ├── pages/                 # Route-level page components
        │   ├── farmer/            # Farmer dashboard & workflows
        │   ├── buyer/             # Buyer command center
        │   ├── cooperative/       # Cooperative union dashboard
        │   ├── transporter/       # Freight fleet hub
        │   └── admin/             # System admin panel
        ├── services/
        │   ├── api.js             # Axios instance (reads VITE_API_URL)
        │   ├── socket.js          # Socket.IO client connection
        │   └── *.js               # Per-feature API service files
        └── utils/                 # Helper functions
```