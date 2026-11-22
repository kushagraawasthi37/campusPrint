# CampusPrint — Printing Shop Queue & Wait-Time Estimator

[![Node.js](https://img.shields.io/badge/Node.js-v24.5.0-339933?logo=node.js)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-v3.4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose%208-47A248?logo=mongodb)](https://www.mongodb.com/)
[![Jest](https://img.shields.io/badge/Tests-Passing-brightgreen?logo=jest)](https://jestjs.io/)

> **ACADEMIC & ETHICAL DISCLAIMER: SYNTHETIC RESEARCH PROTOTYPE**  
> All shop identities (*"Chinar QuickPrint"*), locations (*Hazratbal Gate near NIT Srinagar*), student customer personas, arrival timestamps, device logs, price transactions, and operational records in this repository are **explicitly synthetic and fictional**. They were generated exclusively as an educational systems-engineering exercise to model non-deterministic retail service queues. **No field observations or interviews have been fabricated.** Genuine empirical fieldwork, photographic logs, and proprietor interviews remain marked as pending in `fieldwork.md`.

---

## 1. Project Overview

**CampusPrint** is an operational dashboard and waiting-time estimation engine designed for high-density campus photocopy and document-binding shops adjacent to university campuses such as NIT Srinagar.

During peak academic deadlines (pre-lecture note rushes at 09:30–11:00 and project/lab submission cutoffs at 14:00–16:00), student counter arrivals surge dramatically. Single FIFO lines cause severe anxiety and information asymmetry: a student requiring a 2-page printout cannot gauge if the person ahead has a 180-page thesis requiring spiral binding.

CampusPrint solves this by providing:
1. **Separation of Concerns:** Clear distinction between historical queue observations (`queue_ahead` in training CSVs) and the current **Live Counter Queue** actively maintained by the shopkeeper.
2. **Probabilistic Wait-Time Intervals:** Rather than presenting misleading, exact minute countdowns, it calculates realistic upper and lower delivery windows with a configurable safety buffer.
3. **Strict Ingestion Validation:** A row-by-row CSV parser that checks field types, numeric constraints, and temporal causality without silently discarding bad data.
4. **Counter Footfall Analytics:** Category duration averages and busiest-hour histograms (09:00 to 18:00) using Recharts.

---

## 2. Tech Stack

- **Frontend:** React 18, Vite 6, Tailwind CSS, Recharts, Axios, Lucide React
- **Backend:** Node.js, Express.js (Modular MVC architecture)
- **Database:** MongoDB with Mongoose (with embedded `mongodb-memory-server` fallback for zero-configuration, instant execution out-of-the-box)
- **CSV Ingestion:** `multer` (temporary multipart file handling) + `csv-parser`
- **Validation:** Custom strict validator (`dataValidator.js`) + `express-validator`
- **Testing:** Jest + Supertest (unit tests for validator & estimator; full integration tests for REST endpoints)

---

## 3. Directory Structure

```text
CampusPrint/
├── client/                      # React + Vite frontend application
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.jsx       # Shop banner & synthetic data disclaimer
│   │   │   ├── KpiCards.jsx     # High-level operational metrics
│   │   │   ├── WaitTimeEstimator.jsx # Interactive queue interval calculator
│   │   │   ├── LiveQueueManager.jsx  # Active counter tickets & advancement
│   │   │   ├── AnalyticsCharts.jsx   # Recharts for category duration & footfall
│   │   │   ├── CsvUploader.jsx       # CSV ingestion with row error table
│   │   │   └── JobHistoryTable.jsx   # Searchable/filterable historical logs
│   │   ├── App.jsx              # Main tabbed dashboard container
│   │   ├── main.jsx             # React entrypoint
│   │   └── index.css            # Tailwind directives & styles
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
├── server/                      # Express backend API
│   ├── config/
│   │   └── db.js                # Dual MongoDB connection (URI or In-Memory fallback)
│   ├── controllers/
│   │   ├── jobController.js     # CSV upload, query, and seed controller
│   │   ├── queueController.js   # Live queue CRUD & ticket progression
│   │   └── statsController.js   # Aggregations, busiest hours, and estimations
│   ├── models/
│   │   ├── LiveQueueItem.js     # Mongoose schema for active counter tickets
│   │   └── PrintingJob.js       # Mongoose schema for historical print jobs
│   ├── routes/
│   │   └── api.js               # REST API route declarations
│   ├── services/
│   │   ├── dataValidator.js     # Strict row-level CSV validation engine
│   │   └── estimator.js         # Historical arithmetic duration estimator
│   ├── tests/
│   │   ├── api.test.js          # Supertest integration test suite
│   │   ├── estimator.test.js    # Unit tests for waiting-time logic & buffers
│   │   └── validator.test.js    # Unit tests against data.csv & invalid_test_data.csv
│   ├── app.js                   # Express application setup
│   ├── server.js                # Server entrypoint with auto-seed capability
│   ├── seed.js                  # Standalone manual seeding CLI script
│   └── package.json
├── data.csv                     # 25 synthetic realistic records (09:00 - 18:00)
├── invalid_test_data.csv        # Deliberate test error dataset
├── research.md                  # Problem context & placeholders for verified fieldwork
├── fieldwork.md                 # Unfilled field observation template & interview rubrics
├── reflection.md                # 5 blank critical reflection prompts for the student
├── evidence/                    # Directory for physical field photos (pending)
├── ai-chats/                    # Directory for AI design dialogue transcripts
└── .gitignore
```

---

## 4. Estimator Methodology & Mathematical Formula

### 4.1 Why Machine Learning Was Avoided
In a small, independent university campus shop, transactional datasets are typically small (e.g., 25–100 records per day). Applying complex regression models, neural networks, or Random Forests would lead to severe overfitting, sensitivity to single outliers, and poor explainability. Instead, CampusPrint implements an **arithmetic category-mean queuing model**.

### 4.2 Distinguishing Historical vs. Live Queue
- **Historical `queue_ahead`** (in `data.csv`): Represents how many people were waiting when *that specific historical job arrived*. It is an observational metric for retroactive analysis.
- **Current Live Queue**: Represents customers *currently present in the shop today*. Estimations for arriving customers are calculated **exclusively from the live queue**, never from historical `queue_ahead`.

### 4.3 Mathematical Formulation

1. **Category Mean Duration:**
   $$\bar{D}_k = \frac{1}{N_k} \sum_{j \in \text{Category } k} (\text{service\_end}_j - \text{service\_start}_j)$$

2. **Total Workload Ahead ($W$):**
   If specific job types in the live queue are known:
   $$W = \sum_{i=1}^{Q} \bar{D}_{\text{type}(i)}$$
   If only queue length $Q$ is known:
   $$W = Q \times \bar{D}_{\text{overall}}$$

3. **Customer Wait to Service Start:**
   $$\text{Wait}_{\text{start}} = W$$

4. **Total Turnaround Time ($T_{\text{total}}$):**
   $$T_{\text{total}} = W + \bar{D}_{\text{target}}$$

5. **Configurable Safety Buffer ($B \in [0, 50\%]$):**
   Accounts for friction like pendrive virus scanning, paper alignment, payment QR scanning, and toner cycling:
   $$T_{\text{buffered}} = T_{\text{total}} \times \left(1 + \frac{B}{100}\right)$$

6. **Interval Range Formulation:**
   $$\text{Min Wait} = \max\left(1, \; \text{round}\left(T_{\text{total}} \times 0.85\right)\right)$$
   $$\text{Max Wait} = \max\left(1, \; \text{round}\left(T_{\text{buffered}} \times 1.15\right)\right)$$

### 4.4 Boundary & Unreliability Warnings
Estimations automatically trigger warning flags when:
- **Large Orders:** Page count $> 100$ pages (paper tray swaps and print-head cool-downs create heavy non-linear variances).
- **Extreme Backlog:** Queue count $> 8$ jobs ahead (human fatigue and counter crowding).
- **Assumptions:** Single operator FIFO processing, functional devices, and zero file corruption.

---

## 5. Sample Outputs Calculated from Synthetic `data.csv`

Based on the 25 records in `data.csv`, the baseline historical averages are:

| Job Category | Record Count | Sample Durations | Calculated Category Average ($\bar{D}_k$) |
| :--- | :---: | :---: | :---: |
| **Scanning** | 4 | 2.5m, 4.5m, 2.75m, 5.25m | **3.75 minutes** (~225s) |
| **Photocopy** | 5 | 3.83m, 4.5m, 3.25m, 5.25m, 5.17m | **4.40 minutes** (~264s) |
| **B&W printing** | 6 | 3.75m, 6.58m, 4.5m, 4.5m, 6.17m, 4.5m | **5.00 minutes** (~300s) |
| **Colour printing** | 5 | 7.67m, 8.75m, 4.25m, 10.5m, 8.25m | **7.88 minutes** (~473s) |
| **Spiral binding** | 5 | 13.5m, 13.42m, 12.5m, 14.5m, 13.25m | **13.43 minutes** (~806s) |
| **Overall Mean** | **25** | — | **6.79 minutes** (~407s) |

### Concrete Estimation Scenarios:

- **Scenario A: Fast Counter (0 jobs ahead, arriving for 15-page B&W print, 15% buffer)**
  - Workload ahead: $0\text{m}$
  - Target job duration: $5.0\text{m}$
  - Estimated wait to start: **0 mins**
  - **Estimated completion range: 4 – 7 minutes**

- **Scenario B: Mixed Queue (2 jobs ahead: 1 Photocopy + 1 Spiral binding, arriving for Scanning, 15% buffer)**
  - Workload ahead: $4.4\text{m} + 13.43\text{m} = 17.83\text{m}$
  - Target job duration: $3.75\text{m}$
  - Total time: $21.58\text{m}$
  - Buffered time (+15%): $24.82\text{m}$
  - Estimated wait to start range: **15 – 24 minutes**
  - **Estimated completion range: 18 – 29 minutes**

---

## 6. Setup and Execution Instructions

### Prerequisites
- Node.js v18+ (tested on Node v24.5.0)
- npm v9+ (tested on npm 11.5.1)
- Optional: Local MongoDB (`mongodb://127.0.0.1:27017`) or cloud MongoDB Atlas URI. *(If omitted, an embedded in-memory MongoDB starts automatically with zero manual setup!)*

### Step 1: Clone or Navigate to Directory
```powershell
cd c:\Users\kusha\.gemini\antigravity\scratch\signal-clone\CampusPrint
```

### Step 2: Run Backend Tests
Run the Jest test suite covering row-level validation, queue estimator bounds, and REST APIs:
```powershell
cd server
npm test
```

### Step 3: Start the Backend Server
```powershell
cd server
npm start
```
*The server will start on `http://localhost:5000` and automatically seed the 25 records from `data.csv` if the database is fresh.*

### Step 4: Start the Frontend Client
In a separate terminal window:
```powershell
cd client
npm run dev
```
*Open `http://localhost:3000` in your web browser.*

---

## 7. CSV Ingestion & Deliberate Validation Test

CampusPrint includes a dedicated CSV testing file: `invalid_test_data.csv`.

To verify row-level error reporting:
1. Open the **CSV Ingestion** tab in the web UI.
2. Select `CampusPrint/invalid_test_data.csv` and click **Upload & Validate**.
3. Observe that the validator rejects the invalid records and produces a row-by-row violation table:
   - **Row 1:** Missing required field `job_type`.
   - **Row 2:** Negative page count (`-15`).
   - **Row 3:** Malformed timestamp (`2026-11-20 25:70:00`).
   - **Row 4:** Inconsistent timestamps (`service_end` 10:25:00 earlier than `service_start` 10:35:00).
   - **Row 5:** Negative queue ahead count (`-3`).
   - **Row 6:** Valid record (`VAL-001`) safely imported without discarding.

---

## 8. Limitations & Future Roadmap

1. **Single-Server Assumption:** Assumes one primary operator managing the counter. Multi-counter or multi-workstation parallel scheduling is left for future iterations.
2. **Deterministic File Preparation:** Assumes customer files are pre-formatted PDFs ready on USB pendrives. Mobile WhatsApp/email transfers add erratic delay.
3. **Power Reliability Factor:** Power disruptions in winter months require manual generator or UPS compensation not currently modeled in the software.
