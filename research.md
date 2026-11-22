# CampusPrint: Research & Problem Verification

## 1. Five-Line Problem Statement
- **Context:** Near the National Institute of Technology (NIT) Srinagar campus at `[NEEDS_VERIFICATION: Exact shop name and location, e.g., Hazratbal Road opposite gate]`, `[NEEDS_VERIFICATION: Shopkeeper name/role]` operates a high-turnover photocopy and digital printing shop serving students and faculty.
- **Bottleneck:** During peak academic submission hours `[NEEDS_VERIFICATION: Observed peak times, e.g., 9:00 AM - 10:30 AM / 4:00 PM - 5:30 PM]`, an unmanaged queue of `[NEEDS_VERIFICATION: Typical observed queue size, e.g., 6 to 15 students]` accumulates with highly heterogeneous print jobs (single-page forms vs. multi-page lab records vs. project reports).
- **Impact:** The absence of clear wait-time visibility leads to counter crowding, anxiety, frequent interruptions asking *"Bhaiya mera kitna time lagega?"*, and students abandoning queues after waiting partially.
- **Why Existing Solutions Fail:** Traditional enterprise kiosk token systems (e.g., Qmatic) and SaaS mobile waitlist platforms (e.g., Qles / Waitwhile) require expensive dedicated hardware, mandatory smartphone check-ins, or customer app downloads, none of which are compatible with rapid, cash/UPI-driven ₹2–₹50 counter transactions.
- **Intervention Hypothesis:** A lightweight, empirical wait-time estimation tool running locally on the shopkeeper's counter laptop/desktop—calibrated with actual observed job durations and active queue depth—can provide actionable wait ranges with zero customer overhead.

---

## 2. Target Subject & Field Site Profile
- **Shop Name:** `[NEEDS_VERIFICATION: Real shop name]`
- **Location:** `[NEEDS_VERIFICATION: Distance / landmark relative to NIT Srinagar]`
- **Key Operator / Role:** `[NEEDS_VERIFICATION: Name of shopkeeper / attendant, recorded only with permission]`
- **Equipment In Use:** `[NEEDS_VERIFICATION: Number and model of printers/photocopiers, e.g., Canon imageRUNNER / HP LaserJet]`
- **Primary Job Intake Channels:** `[NEEDS_VERIFICATION: WhatsApp Web, USB Flash Drive, Direct Email, Hardcopy Photostat]`
- **Consent Status:** `[NEEDS_VERIFICATION: Explicit verbal permission obtained for study and photography without student face capture]`

---

## 3. Analysis of Existing Solutions

### Solution A: Enterprise Kiosk & Physical Ticket Calling (e.g., Qmatic / Wavetec)
- **Mechanism:** Customers pull physical numbered thermal tickets from a standing kiosk; displays/speakers call tickets in order.
- **Strengths:** Clear first-come, first-served fairness; no smartphone required.
- **Failure Mode for Campus Print Shop:**
  - High capital cost ($1,500+) and recurring maintenance of thermal printers/paper.
  - Requires dedicated physical footprint unavailable in compact 80–120 sq ft campus booths.
  - Does not account for job heterogeneity (a 1-page admit card looks identical to a 120-page spiral-bound thesis to the token dispenser).

### Solution B: SaaS Virtual Queue Apps (e.g., Qles / Waitwhile)
- **Mechanism:** Customers scan a QR code to enter their mobile number, receive an SMS with estimated wait time, and are summoned via SMS.
- **Strengths:** Allows customers to wait remotely; digital real-time tracking.
- **Failure Mode for Campus Print Shop:**
  - High friction: students will not fill a 4-field web form for a ₹5 photocopy.
  - Requires continuous cellular data and SMS charges.
  - Places high administrative burden on the shopkeeper to manually click "Complete" and "Next" on an external web interface while processing fast-paced payments.

---

## 4. Academic & Theoretical Grounding

1. **Maister, David H. (1985). *"The Psychology of Waiting Lines."***
   - *Core Principle:* Unexplained, uncertain waits feel significantly longer and produce more frustration than finite, explained waits.
   - *Application to CampusPrint:* Even without altering physical printing speeds, presenting a calibrated wait window (e.g., "12–16 minutes based on 4 jobs ahead") reduces counter anxiety and prevents constant verbal interruptions.

2. **Gross, D., Shortle, J. F., Thompson, J. M., & Harris, C. M. (2008). *"Fundamentals of Queueing Theory"*, 4th Edition.**
   - *Core Principle:* Multi-class service facilities with high service-time variance ($\sigma^2$) deviate heavily from naive deterministic estimations ($W \neq N \times \bar{x}$).
   - *Application to CampusPrint:* The estimator must categorize jobs by type (e.g., quick photostat vs. multi-page color report with binding) rather than treating every queued student as a uniform unit time.

---

## 5. Shopkeeper Interview Protocol
- Question 1: What are your busiest hours during weekdays, and what types of jobs arrive then?
- Question 2: When students ask how long it will take, how do you currently estimate it?
- Question 3: What part of a job causes the biggest delay (file transfer, machine speed, binding, or payment)?
- Question 4: Do students ever leave queued jobs or complain about unexpected delays?
- Question 5: Would a simple dashboard indicating estimated clearing time be helpful, or would it get in the way of operations?

---

## 6. Verification Status Checklist
- [ ] Field observation conducted at verified shop location
- [ ] 2 timestamped photographs captured (with permission)
- [ ] Verified shopkeeper conversation recorded with 3 verbatim statements
- [ ] At least 1 counter-intuitive / surprising finding documented
- [ ] Minimum 20 consecutive real job records logged in `data.csv`
- [ ] Empirical job duration parameters verified before model calibration
