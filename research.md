# Problem Exploration & Research Context: CampusPrint

> **DISCLAIMER:**  
> This document describes a development scenario based on a **hypothetical** photocopy and printing shop situated near the National Institute of Technology (NIT) Srinagar campus (Hazratbal area). All personas, quotes, shop details, and observations described below are **explicitly fictional and synthetic**. They serve solely as a systems engineering scenario for prototyping queue management and wait-time algorithms. No real shopkeeper was interviewed for this development prototype, and no field research was fabricated.

---

## 1. Scenario Background (Fictional Development Context)

### 1.1 Setting
- **Hypothetical Location:** Near Gate 2 / Main Road, Hazratbal, adjacent to NIT Srinagar, Jammu & Kashmir.
- **Hypothetical Shop Concept:** "Chinar QuickPrint & Documentation Services" (Fictional).
- **Core Operations:**
  - High-volume black-and-white lecture note printing and past-year paper reproduction.
  - Multi-copy photocopy batches for course handouts.
  - Colour report printing for lab submissions and project abstracts.
  - High-resolution document scanning for government scholarship and university portal uploads.
  - Spiral and soft thermal binding for major project reports and dissertations.

### 1.2 Identified Problem Dimensions
1. **Unpredictable Bottlenecks During Academic Deadlines:**
   - Peaks occur around 09:30–11:30 AM (pre-lecture note rushes) and 02:00–04:30 PM (pre-lab submission deadlines).
   - High variance between service times: a student printing a 2-page admit card takes ~2 minutes, whereas a scholar binding a 180-page thesis takes 14–18 minutes.
2. **First-In, First-Out (FIFO) Ambiguity Across Heterogeneous Equipment:**
   - Single-queue arrival creates frustration when different equipment (e.g., dedicated scanner vs. heavy-duty photocopier vs. manual coil punch binder) could process smaller independent jobs concurrently if routing were transparent.
3. **Information Asymmetry:**
   - Arriving students have no visibility into the backlog ahead of them, causing either unnecessary crowd congregation inside the shop or abandoned queues.
   - The shop operator cannot easily compute or convey realistic delivery windows when juggling simultaneous walk-ins and phone requests.

---

## 2. Research Dimensions & Open Questions

| Research Dimension | Engineering Hypothesis | Required Real-World Field Validation |
| :--- | :--- | :--- |
| **Service Duration Distribution** | Service durations follow job-type clusters rather than a single Poisson distribution. | Stopwatch time-study across distinct job categories over 3 operational days. |
| **Queue Position vs. Perceived Wait** | Buffer percentage (15–25%) accounts for minor paper jams, file conversion delays, and payment handoffs. | Measured delta between calculated physical service time and actual customer egress time. |
| **Device Parallelism** | Separate devices allow parallel serving paths if machine allocation is tracked. | Equipment inventory audit and operator workflow observation. |

---

## 3. Placeholders for Verified Field Research (Pending Collection)

- **[PENDING] Verified Shop Identity:**  
  *Name, exact shopkeeper name, commercial registration / location coordinates near NIT Srinagar.*
- **[PENDING] Verified Shopkeeper Interview:**  
  *Audio transcript / signed interview notes detailing daily operational hurdles, peak hours, pricing models, and equipment constraints.*
- **[PENDING] Empirical Customer Observation Logs:**  
  *Timestamped arrival and departure logs observed by the student investigator in person.*
- **[PENDING] Academic Literature / Contextual Citations:**  
  *Formal queueing theory references (M/G/1 or M/M/c queues applied to retail service counters).*
