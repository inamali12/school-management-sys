# SchoolConnect – Official Demo & Evaluation Credentials

> **IMPORTANT NOTICE: TEST-ONLY CREDENTIALS**
>
> All credentials listed in this document are strictly for **academic demonstration, grading, evaluation, and QA testing** for Mehran University of Engineering and Technology (MUET), SZAB Campus, Khairpur Mir's.
>
> In production deployments, change all passwords immediately via the Admin Settings or user profile.

---

## 1. System Roles Overview

| Role | Primary Purpose | Portal Access |
|---|---|---|
| **ADMIN** | Full school administrative, academic, and financial control | `/dashboard.html` (Admin View) |
| **TEACHER** | Assigned classes, students list, daily & bulk attendance marking | `/dashboard.html` (Teacher View) |
| **STUDENT** | Student profile, personal attendance rate, fee vouchers & dues, subjects | `/dashboard.html` (Student View) |
| **PARENT** | Linked children profiles, child attendance, fee vouchers | `/dashboard.html` (Parent View) |

---

## 2. Demo User Accounts

### A. Administrator (Full Control)

* **Account 1 (Primary Demo Admin):**
  * **Email:** `admin@schoolconnect.edu.pk`
  * **Username:** `admin`
  * **Password:** `admin123`
  * **Role:** `admin`
  * **Permissions:** Complete CRUD over Students, Teachers, Classes, Fees, Attendance, User Management, and Analytics Reports.

* **Account 2 (Principal):**
  * **Email:** `principal@schoolconnect.edu.pk`
  * **Username:** `principal`
  * **Password:** `admin123`
  * **Role:** `admin`
  * **Name:** Principal Dr. Inamullah Baloch

---

### B. Teacher (Academic & Attendance Management)

* **Account 1 (Primary Demo Teacher):**
  * **Email:** `teacher@schoolconnect.edu.pk`
  * **Username:** `teacher`
  * **Password:** `teacher123`
  * **Role:** `teacher`
  * **Assigned Class:** Class 7, Class 8
  * **Subjects:** English, Urdu
  * **Permissions:** View assigned classes and students, mark daily/bulk attendance, view attendance history. *(Financial fee access strictly blocked).*

* **Account 2 (Mathematics Faculty):**
  * **Email:** `tariq.mehmood@schoolconnect.edu.pk`
  * **Username:** `tariq`
  * **Password:** `teacher123`
  * **Role:** `teacher`
  * **Assigned Class:** Class 6, Class 9
  * **Subjects:** Mathematics, General Science

* **Account 3 (Science Faculty):**
  * **Email:** `abdul.qadir@schoolconnect.edu.pk`
  * **Username:** `abdulqadir`
  * **Password:** `teacher123`
  * **Role:** `teacher`
  * **Assigned Class:** Class 9, Class 10
  * **Subjects:** Physics, Mathematics

---

### C. Student (Personal Academic & Fee Portal)

* **Account 1 (Primary Demo Student - Class 9-A):**
  * **Email:** `student@schoolconnect.edu.pk`
  * **Username:** `student`
  * **Password:** `student123`
  * **Role:** `student`
  * **Student ID:** `STU-2025-001`
  * **Student Name:** Muhammad Ali Soomro
  * **Class:** Class 9 (Section A)
  * **Permissions:** View own student profile, 30-day attendance record & percentage, monthly fee vouchers, payment history, and assigned subjects. *(Isolated from other students' data).*

* **Account 2 (Secondary Demo Student - Class 8-A):**
  * **Email:** `fatima@schoolconnect.edu.pk`
  * **Username:** `fatima`
  * **Password:** `student123`
  * **Role:** `student`
  * **Student ID:** `STU-2025-002`
  * **Student Name:** Fatima Zahra Memon
  * **Class:** Class 8 (Section A)

---

### D. Parent (Linked Children Portal)

* **Account 1 (Demo Parent):**
  * **Email:** `parent@schoolconnect.edu.pk`
  * **Username:** `parent`
  * **Password:** `parent123`
  * **Role:** `parent`
  * **Linked Child:** Muhammad Ali Soomro (`STU-2025-001`)
  * **Permissions:** View linked child's attendance and fee status.

---

## 3. Quick 1-Click Login

On the login page (`/login.html`), click the quick-fill buttons:
* **Admin Demo** (`admin@schoolconnect.edu.pk` / `admin123`)
* **Teacher Demo** (`teacher@schoolconnect.edu.pk` / `teacher123`)
* **Student Demo** (`student@schoolconnect.edu.pk` / `student123`)

---

## 4. Resetting Seed Data

To reset the database back to clean demo state at any time:
```bash
npm run seed
```
This idempotently seeds:
- 5 Classes
- 10 Teachers
- 50 Students (`STU-2025-001` to `STU-2025-050`)
- 1,300 Attendance records across 30 days
- 50 Fee vouchers with Paid, Partial, Pending, and Overdue statuses
- 6 Real-time activity logs

