# SchoolConnect - Smart School Management System
### Academic Web Engineering Project (PBL) &bull; MUET SZAB Campus, Khairpur Mir's

[![Node.js Version](https://img.shields.io/badge/Node.js-v18%2B-brightgreen)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-5.x-blue)](https://expressjs.com/)
[![MongoDB & Mongoose](https://img.shields.io/badge/Database-MongoDB%20%7C%20Mongoose-green)](https://www.mongodb.com/)
[![JWT Authentication](https://img.shields.io/badge/Auth-JWT%20%2B%20bcrypt-orange)](https://jwt.io/)
[![License](https://img.shields.io/badge/License-MIT-lightgrey)](LICENSE)

---

## 1. Project Overview

**SchoolConnect** is a full-stack, responsive, and secure digital school management platform designed specifically for small-to-medium-sized private schools in Pakistan (demonstrated through **Bright Future Public School, Khairpur Mir's, Sindh**).

Developed for **Mehran University of Engineering and Technology (MUET), SZAB Campus, Khairpur Mir's**, Department of Software Engineering, for the **SW417 Web Engineering Project-Based Learning (PBL)** assignment.

The platform eliminates cumbersome manual registers and paper-based tracking by providing:
- **Centralized Student Information System** with auto-generated unique student identifiers (`STU-YYYY-XXX`).
- **Faculty Directory & Workload Assignment** for subject specialists and class teachers.
- **Daily Attendance Marking & Duplicate Prevention** preventing double attendance for the same student on the same date.
- **Monthly Fee Collection & Challan Management** with partial payments, outstanding dues calculation, duplicate billing prevention, and printable school fee receipts.
- **Role-Based Portals** tailored for **Administrators**, **Teachers**, and **Parents**.
- **Real-Time Analytics & Institutional Reports Hub** with print optimization and 1-click CSV export.

---

## 2. Technology Stack

| Layer | Technologies Used |
| :--- | :--- |
| **Frontend** | HTML5, CSS3, Vanilla JavaScript (ES6+), Modern Responsive Design, FontAwesome 6, Google Inter Typography |
| **Backend** | Node.js, Express.js, RESTful Architecture, Morgan Logger, CORS |
| **Database** | MongoDB, Mongoose ODM (with seamless disk-backed JSON fallback for zero-friction standalone demonstrations) |
| **Security & Auth** | JSON Web Tokens (JWT), bcrypt password hashing, Role-Based Access Control (RBAC) middleware |
| **Formatting** | Pakistani Rupee (`PKR / Rs.`), localized telephone formats (`0300-XXXXXXX`), CNIC/B-Form formatting |

---

## 3. User Roles & Demo Credentials

The application provides 1-click quick-fill buttons on the login page for university evaluation and grading:

| Role | Username / Email | Password | Permissions & Capabilities |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@schoolconnect.edu.pk` | `admin123` | Full administrative control: Students, Teachers, Classes, Attendance, Fees, Reports, User Accounts |
| **Teacher** | `teacher@schoolconnect.edu.pk` | `teacher123` | Access assigned classes, view students, mark daily & bulk attendance, view class attendance history. Financial modules are blocked. |
| **Student** | `student@schoolconnect.edu.pk` | `student123` | Access dedicated student portal: view own bio-data, 30-day attendance rate & log, fee vouchers, and enrolled subjects. Isolated from other students. |
| **Parent** | `parent@schoolconnect.edu.pk` | `parent123` | View registered child's profile, attendance status, fee dues, payment history, and fee vouchers. Restricted exclusively to own child. |

---

## 4. Key Functional Modules

### A. Student Management (Mandatory CRUD Module 1)
- **Add Student**: Form with complete validation, photo URL, CNIC/B-Form, parent phone, address, and auto-generated unique ID (`STU-2025-001`).
- **View All Students**: Responsive directory table with search, class filter, section filter, and status filter.
- **Individual Student Profile**: Modal display showing complete bio-data, parent contact, tuition fee, attendance rate, and balance summary.
- **Update Student**: Edit existing contact details, class, fee, or status.
- **Delete Student**: Delete student with warning confirmation dialog.
- **Export & Print**: 1-click CSV download and print formatting.

### B. Teacher Management (Mandatory CRUD Module 2)
- **Add Faculty**: Capture teacher ID, name, email, phone, qualification (e.g. *M.Sc Mathematics MUET*), primary subject, assigned classes, and monthly salary.
- **Faculty Directory**: Search by name or subject; filter by assigned grade or status.
- **Faculty Detailed Profile**: View individual teacher credentials, workload, and contact info.
- **Update & Delete**: Modify salary, subjects, or remove faculty members.

### C. Attendance Management (Mandatory CRUD Module 3A)
- **Daily Attendance Marking**: Select class & section, choose date, load students, and click **"Mark All Present"** or toggle individual student statuses (**Present, Absent, Late, Leave**).
- **Duplicate Prevention**: Compound uniqueness guarantees that a student cannot have duplicate attendance entries for the same calendar date. Subsequent marking updates the existing record cleanly.
- **Attendance Records & History**: Search by student or filter by date, class, and attendance status.

### D. Fee Management & Challans (Mandatory CRUD Module 3B)
- **Monthly Fee Vouchers**: Generate individual or bulk class monthly fee vouchers.
- **Duplicate Billing Prevention**: Guarantees that a student cannot be billed twice for the same billing month.
- **Partial & Full Payments**: Record partial cash or mobile wallet (*JazzCash, EasyPaisa, Bank Transfer*) installments. The remaining balance and status (*Paid, Partial, Pending, Overdue*) update automatically.
- **Payment History Log**: Every installment is logged with receipt number, payment date, method, and cashier notes.
- **Printable Fee Voucher**: Official school challan layout with School header, breakdown, paid stamp, and signature areas.

### E. Class & Section Management
- Create classes (Grades 1 to 10), assign sections (`A`, `B`), room numbers, student capacities, monthly tuition fees, curriculum subjects, and designated Class Teachers.

### F. Reports & Analytics Hub
- **Student Admissions Report**: Filter by class, gender, and admission date.
- **Daily Attendance Report**: Turnout and absence summary for any selected day.
- **Monthly Attendance % Report**: Student-wise attendance percentage audit.
- **Fee Collection Report**: Total billed vs collected vs outstanding with collection rate.
- **Fee Defaulters Report**: Priority recovery list of students with outstanding dues.
- **Faculty Staff & Payroll Report**: Monthly salary disbursement summary.

---

## 5. RESTful API Documentation

### Authentication (`/api/auth`)
- `POST /api/auth/login` - Login with email/username and password; returns JWT token and user info.
- `GET /api/auth/me` - Get profile of authenticated user.
- `PUT /api/auth/change-password` - Change account password.
- `POST /api/auth/logout` - Logout user.

### Students (`/api/students`)
- `GET /api/students` - Query students with `search`, `className`, `section`, `status`.
- `GET /api/students/:id` - Get student details by MongoDB ID or Student ID.
- `GET /api/students/generate/next-id` - Get next sequential unique Student ID.
- `POST /api/students` - Create student (Admin only).
- `PUT /api/students/:id` - Update student (Admin only).
- `DELETE /api/students/:id` - Delete student (Admin only).

### Teachers (`/api/teachers`)
- `GET /api/teachers` - Query teachers with `search`, `subject`, `status`.
- `GET /api/teachers/:id` - Get teacher profile.
- `GET /api/teachers/generate/next-id` - Get next unique Teacher ID.
- `POST /api/teachers` - Register teacher (Admin only).
- `PUT /api/teachers/:id` - Update teacher (Admin only).
- `DELETE /api/teachers/:id` - Delete teacher (Admin only).

### Classes (`/api/classes`)
- `GET /api/classes` - List classes with enrolled student counts.
- `GET /api/classes/:id` - Get class info and enrolled student list.
- `POST /api/classes` - Create class (Admin only).
- `PUT /api/classes/:id` - Update class (Admin only).
- `DELETE /api/classes/:id` - Delete class (Admin only).

### Attendance (`/api/attendance`)
- `GET /api/attendance` - Query attendance with `date`, `className`, `section`, `studentId`.
- `GET /api/attendance/stats` - Summary statistics (Present, Absent, Late, Leave, Rate %).
- `POST /api/attendance` - Mark single attendance.
- `POST /api/attendance/bulk` - Mark bulk class attendance.
- `PUT /api/attendance/:id` - Update attendance entry.
- `DELETE /api/attendance/:id` - Delete attendance entry.

### Fees (`/api/fees`)
- `GET /api/fees` - Query vouchers with `month`, `className`, `paymentStatus`, `studentId`.
- `GET /api/fees/:id` - Get fee voucher details and student biodata.
- `GET /api/fees/stats/summary` - Aggregate financial metrics.
- `POST /api/fees` - Generate single voucher (Prevents duplicates).
- `POST /api/fees/bulk-generate` - Generate vouchers for an entire class.
- `POST /api/fees/:id/pay` - Record partial or full payment.
- `PUT /api/fees/:id` - Update voucher details.
- `DELETE /api/fees/:id` - Delete voucher.

### Dashboard & Reports (`/api/dashboard`, `/api/reports`)
- `GET /api/dashboard/stats` - Role-tailored live analytics for Admin, Teacher, or Parent.
- `GET /api/reports/students` - Student directory report.
- `GET /api/reports/attendance-daily` - Daily attendance audit report.
- `GET /api/reports/attendance-monthly` - Monthly turnout percentage report.
- `GET /api/reports/fees-collection` - Fee billing vs collection statement.
- `GET /api/reports/fees-defaulters` - Outstanding dues list.
- `GET /api/reports/teachers` - Faculty payroll statement.

---

## 6. Project Directory Structure

```text
SchoolConnect/
│
├── frontend/
│   ├── index.html               # Gateway & redirect hub
│   ├── login.html               # Portal login with 1-click quick-fill demo buttons
│   ├── dashboard.html           # Role-based dashboard (Admin, Teacher, Parent)
│   ├── students.html            # Complete Student CRUD & Directory
│   ├── teachers.html            # Faculty CRUD & Class Allocations
│   ├── classes.html             # Class, Section & Curriculum Management
│   ├── attendance.html          # Daily Class Attendance & History Logs
│   ├── fees.html                # Fee Challans, Partial Payments & Printable Vouchers
│   ├── reports.html             # Multi-tab Reporting & CSV Export Hub
│   ├── users.html               # System User Accounts & Parent-Child Linking
│   ├── css/
│   │   ├── style.css            # Core design system, sidebar, navbar, typography
│   │   └── components.css       # Cards, tables, badges, modals, toast alerts, print styles
│   └── js/
│       ├── api.js               # Centralized API service with JWT authorization
│       ├── auth.js              # Authentication state & role-based UI filtering
│       ├── utils.js             # Toast notifications, currency/date formatters, CSV exporter
│       ├── dashboard.js         # Real-time dashboard aggregation & charts
│       ├── students.js          # Student CRUD controller
│       ├── teachers.js          # Faculty CRUD controller
│       ├── classes.js           # Class & section controller
│       ├── attendance.js        # Attendance marking & history controller
│       ├── fees.js              # Fee billing, payments & voucher controller
│       ├── reports.js           # Reports generation controller
│       └── users.js             # User accounts & RBAC controller
│
├── backend/
│   ├── config/
│   │   └── db.js                # MongoDB connection manager with resilient fallback
│   ├── controllers/             # Express controllers implementing business logic
│   ├── middleware/              # JWT protection & Role-Based authorization
│   ├── models/                  # Mongoose Schemas (User, Student, Teacher, Class, Attendance, Fee)
│   ├── routes/                  # Express RESTful route declarations
│   ├── utils/
│   │   ├── seedData.js          # Realistic Pakistani school demonstration seed script
│   │   ├── storage.js           # Smart persistent data service
│   │   └── runTests.js          # Automated verification test suite (25/25 tests)
│   ├── app.js                   # Express application setup & middleware
│   └── server.js                # Server entry point & auto-initialization
│
├── data/                        # Persistent storage store
├── .env.example                 # Template for environment configuration
├── .env                         # Active environment configuration
├── .gitignore                   # Git ignore specifications
├── package.json                 # Project dependencies & scripts
└── README.md                    # Project documentation & university guide
```

---

## 7. Installation & Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (Version 18.x, 20.x, or 24.x)
- [npm](https://www.npmjs.com/) (Version 9.x or higher)
- Optional: [MongoDB](https://www.mongodb.com/) installed locally or a free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster URI.

### Steps to Run

1. **Clone or Navigate to the Project Directory**:
   ```bash
   cd "School Managemnet system"
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables** (Pre-configured in `.env`):
   ```env
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb://127.0.0.1:27017/schoolconnect
   JWT_SECRET=muet_szab_khairpur_schoolconnect_jwt_secret_key_2025
   JWT_EXPIRE=30d
   ```

4. **Seed Sample Demonstration Data**:
   ```bash
   npm run seed
   ```
   *Seeds 5 classes, 10 faculty members, 50 Pakistani students, 1,300 attendance records spanning 30 days, 50 fee vouchers (Paid, Partial, Pending, Overdue), and audit activity logs.*

5. **Start the Application**:
   ```bash
   npm start
   ```
   The server will start on **`http://localhost:5000`**.

6. **Open in Browser**:
   Open **`http://localhost:5000`** in Google Chrome, Microsoft Edge, or Mozilla Firefox.

---

## 8. Automated Verification Tests

A comprehensive test suite is included to verify all required CRUD operations, duplicate prevention constraints, and financial calculations:

```bash
npm test
```

### Test Results Summary:
```text
======================================================
       SchoolConnect: Running Automated Test Suite    
======================================================

[Test Suite 1: Authentication & RBAC Users]
  ✔ PASS: Admin user account exists
  ✔ PASS: Admin password hashes and verifies with bcrypt
  ✔ PASS: Teacher account exists with teacher role
  ✔ PASS: Student account exists with student role
  ✔ PASS: Student password hashes and verifies with bcrypt
  ✔ PASS: Student account links directly to STU-2025-001
  ✔ PASS: Parent account exists with parent role and linked child

[Test Suite 2: Student Management CRUD]
  ✔ PASS: Add Student successfully (Create)
  ✔ PASS: View Individual Student Details (Read)
  ✔ PASS: Update Student details (Update)
  ✔ PASS: Search Students by name
  ✔ PASS: Filter Students by Class & Section

[Test Suite 3: Teacher Management CRUD]
  ✔ PASS: Add Teacher successfully (Create)
  ✔ PASS: Update Teacher Salary (Update)
  ✔ PASS: Search Teachers

[Test Suite 4: Attendance Management & Duplicate Prevention]
  ✔ PASS: Mark Student Attendance successfully (Create)
  ✔ PASS: Update existing attendance record gracefully
  ✔ PASS: PREVENT DUPLICATE ATTENDANCE: Exactly 1 record exists for student on same date

[Test Suite 5: Fee Management, Duplicates & Partial Payments]
  ✔ PASS: Generate Monthly Fee voucher (Create)
  ✔ PASS: PREVENT DUPLICATE MONTHLY FEE: Throws error when attempting duplicate voucher for same student & month
  ✔ PASS: Record Partial Payment: Balance recalculated to Rs. 2,500 and status changed to "Partial"
  ✔ PASS: Record Full Payment: Balance recalculated to Rs. 0 and status changed to "Paid"
  ✔ PASS: Maintains detailed payment transaction history log

[Test Suite 6: Real-time Dashboard & Activity Logs]
  ✔ PASS: Seeded database contains at least 50 students (50 found)
  ✔ PASS: Seeded database contains 10 teachers (10 found)
  ✔ PASS: Dashboard aggregates fee collection (69300 PKR)
  ✔ PASS: Activity audit logger contains recorded entries (6 found)
  ✔ PASS: Student STU-2025-001 has accessible fee vouchers
  ✔ PASS: Student STU-2025-001 fees are completely isolated to their ID
  ✔ PASS: Student STU-2025-001 has 30-day attendance history
  ✔ PASS: Student STU-2025-001 attendance records are strictly isolated

[Test Suite 7: Clean Up & Delete Operations]
  ✔ PASS: Delete Student successfully (Delete)
  ✔ PASS: Delete Teacher successfully (Delete)
  ✔ PASS: Delete Fee Voucher successfully (Delete)

======================================================
Results: 34 PASSED | 0 FAILED
======================================================
```

---

## 9. Connecting to MongoDB Atlas (Cloud Database)

To connect SchoolConnect to a live MongoDB Atlas cloud database:

1. Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a Database User (e.g. `inaamalibaloch_db_user`) and set a secure password (make sure to note this password down).
3. Under **Network Access**, add `0.0.0.0/0` (Allow Access from Anywhere) to permit connections from your machine, Vercel, and Render.
4. Click **Connect** &rarr; **Drivers** (Node.js).
5. Copy your connection string, for example:
   ```text
   mongodb+srv://inaamalibaloch_db_user:<password>@school-system.xecfmwx.mongodb.net/schoolconnect?retryWrites=true&w=majority
   ```
6. Replace `<password>` with your actual database user password in `.env`:
   ```env
   MONGODB_URI=mongodb+srv://inaamalibaloch_db_user:YourActualPassword@school-system.xecfmwx.mongodb.net/schoolconnect?retryWrites=true&w=majority
   ```
7. Run `npm run seed` to populate MongoDB Atlas with all 50 students, 10 teachers, 5 classes, 30 days of attendance, and fee vouchers!

---

## 10. Deployment Guides

### A. Deploy to Vercel (Recommended for Serverless)
The project comes pre-configured with `vercel.json` and `api/index.js` for zero-configuration Vercel deployment:

1. Push your repository to GitHub:
   ```bash
   git add .
   git commit -m "feat: complete SchoolConnect production system"
   git push origin main
   ```
2. Log in to [vercel.com](https://vercel.com) and click **"Add New Project"**.
3. Import your GitHub repository (`SchoolConnect` or your chosen repo name).
4. In **Environment Variables**, add:
   * `MONGODB_URI`: Your MongoDB Atlas URI with your actual password
   * `JWT_SECRET`: A secure random secret string
   * `NODE_ENV`: `production`
5. Click **Deploy**. Vercel will build and serve your static frontend through its global edge CDN, and route all `/api/*` endpoints to the serverless function in `api/index.js`!

### B. Deploy to Render (Recommended for Standalone Node.js)
1. Push your repository to GitHub.
2. Log in to [render.com](https://render.com) and click **"New Web Service"**.
3. Connect your GitHub repository.
4. Set the following configuration:
   * **Runtime**: Node
   * **Build Command**: `npm install`
   * **Start Command**: `npm start`
5. Under **Environment Variables**, add:
   * `MONGODB_URI`: Your MongoDB Atlas connection string
   * `JWT_SECRET`: A secure random secret string
   * `NODE_ENV`: `production`
6. Click **Create Web Service**. Render will deploy the Express server and serve the complete frontend and REST APIs.

---

## 11. Academic Credit & Affiliation

- **Institution**: Mehran University of Engineering and Technology (MUET), Shaheed Zulfiqar Ali Bhutto (SZAB) Campus, Khairpur Mir's, Sindh, Pakistan.
- **Department**: Department of Software Engineering.
- **Course**: SW417 Web Engineering (Project-Based Learning).
- **Institution Affiliation**: Higher Education Commission (HEC) of Pakistan.

