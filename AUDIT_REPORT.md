# SchoolConnect - Comprehensive Project Audit Report
**Date:** 2026-11-11  
**Project:** SchoolConnect Smart School Management System  
**Institution:** Mehran University of Engineering and Technology (MUET), SZAB Campus, Khairpur Mir's  
**Course:** SW417 Web Engineering PBL  

---

## Executive Summary
This audit inspects all backend and frontend components, configuration files, database models, authentication flows, and deployment configurations to prepare SchoolConnect for production-grade reliability and Vercel cloud deployment.

---

## 1. Audit Findings Matrix (12 Core Areas)

| Area | Current Status | Issues Identified | Resolution Plan |
| :--- | :--- | :--- | :--- |
| **1. Broken / Missing API Endpoints** | Action Required | Missing `/api/activities` endpoint for audit log. Missing student role handling in `/api/dashboard/stats`. | Implement Activity model and controller. Add student role dashboard endpoint. |
| **2. Missing Database Models** | Action Required | `Activity.js` model is missing. `User.js` role enum lacks `'student'`. | Create `Activity.js`. Update `User.js` with `'student'` role and `studentRef`/`studentId`. |
| **3. Missing Frontend Functionality** | Action Required | No Student Portal view for students to view their own attendance %, fee dues, payment history, and subjects. | Build responsive Student Portal and student dashboard view. |
| **4. Authentication Problems** | Action Required | `authController.js` does not populate student profile on `/api/auth/me`. Role redirection for student is missing. | Update `authController.js` and `auth.js` to support student role and redirection. |
| **5. Role-Based Permissions (Admin, Teacher, Student)** | Action Required | Students currently lack data isolation in `studentController`, `feeController`, and `attendanceController`. | Restrict student queries to their own `studentId`. Block administrative routes. |
| **6. Incorrect API URLs** | Critical | `frontend/js/api.js` falls back to `http://localhost:5000` when port is empty (breaks on Vercel production). | Create `frontend/js/config.js` with dynamic environment detection and production URL support. |
| **7. MongoDB Atlas Connection** | Critical | `backend/.env` has placeholder `<db_password>` in `MONGODB_URI`. Serverless connection caching missing. | Add connection caching in `db.js`. Provide instructions to replace `<db_password>`. |
| **8. Missing CRUD Operations** | Action Required | Student account creation in User Management. Student self-profile update. | Add student user creation form. Add student profile update endpoint. |
| **9. Buttons and Forms** | Minor | Login page lacks 1-click Student demo button. Student portal missing from navigation. | Add Student demo login button and role-aware navigation. |
| **10. Frontend / Backend Integration** | Action Required | CORS is unrestricted; needs explicit `FRONTEND_URL` and `*.vercel.app` origin handling. | Enhance CORS configuration in `backend/app.js`. |
| **11. Vercel Deployment Config** | Critical | `api/index.js` does not await `connectDB()` before handling serverless requests. | Refactor `api/index.js` to await cached Mongoose connection. |
| **12. Data Persistence Issues** | Action Required | Seed script only seeds 8 students and 5 teachers (user requested 50 students, 10 teachers, 2 admins, 30 days attendance). | Create comprehensive idempotent seed script in `backend/utils/seedData.js`. |

---

## 2. Key Action Items by Phase
- **Phase 2**: Create `Activity.js` model, update `User.js` with `student` role, implement serverless MongoDB connection pooling in `db.js`.
- **Phase 3**: Update JWT auth controller, middleware, and role redirection for Admin, Teacher, and Student.
- **Phase 4**: Write idempotent seed script (2 admins, 10 teachers, 50 students, 5 classes, 30 days attendance, fees, activities) and generate `DEMO_CREDENTIALS.md`.
- **Phase 5**: Verify and enhance Admin Portal CRUD and dashboard aggregations.
- **Phase 6**: Enhance Teacher Portal (assigned classes, students, mark attendance, attendance history).
- **Phase 7**: Implement Student Portal (profile, attendance %, fee dues, payment history, assigned subjects).
- **Phase 8**: Configure centralized API base URL in `frontend/js/config.js` and `frontend/js/api.js`.
- **Phase 9**: Run automated test suite (`npm test`) covering all roles, CRUD, duplicate prevention, and data isolation.
- **Phase 10**: Configure Vercel serverless entry points and generate deployment guide.

