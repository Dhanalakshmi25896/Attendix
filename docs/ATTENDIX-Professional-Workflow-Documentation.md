# Attendix — Professional Workflow Documentation

**Attendance Login System**

**Document version:** 1.0  
**Last updated:** April 2026  

---

## 1. Project Overview

**Attendix** is a web-based **Attendance Login System** that enables organizations to manage employee authentication, daily attendance (check-in / check-out), leave requests, internal notifications, and administrative oversight. The solution separates a **React** single-page application (frontend) from a **Node.js / Express** REST API (backend) backed by **MySQL**, with role-based access for **Administrators** and **Employees**.

The platform supports secure login, activity logging for attendance-style tracking, leave workflows with optional voice notes, employee directory management, and audit-oriented activity reports for administrators.

---

## 2. Objectives

- **Centralize access** — Single portal for employees and admins with JWT-based authentication.
- **Record attendance behavior** — Capture login (check-in) and logout (check-out) events with timestamps and derived working hours where applicable.
- **Streamline leave management** — Allow employees to apply for leave with text, speech-to-text, and optional voice attachments; enable admins to approve or reject requests.
- **Improve visibility** — Provide dashboards, notifications, and activity logs for operational transparency.
- **Support scalability** — Modular API design, documented endpoints (Swagger), and a clear path to cloud deployment.
- **Maintain security** — Password hashing, protected routes, and separation of privileged operations (admin-only APIs).

---

## 3. System Features

### 3.1 Authentication & Accounts

- User **signup** and **login** (email / name + password).
- **JWT** tokens for session authorization.
- Optional integration patterns for **reCAPTCHA** on public forms (where configured).
- Password storage using **bcrypt** hashing.

### 3.2 Attendance & Activity

- **Check-in** and **check-out** flows mapped to activity log endpoints.
- **Personal attendance history** (per employee) with dates, login/logout times, and working hours where available.
- **Admin activity views** for monitoring login-related activity across the organization.

### 3.3 Leave Management

- **Apply for leave** with date range, leave type, and reason.
- **Reason input options:** typing, browser **speech-to-text** (where supported), and/or **optional voice note** (audio upload).
- **Leave balance** visibility (annual allocation logic on the server).
- **Admin leave approvals** — list all requests, approve/reject, optional playback of legacy or new voice attachments.
- **Notifications** tied to leave submissions and decisions.

### 3.4 Employee & Directory Management (Admin)

- View **all employees** in a tabular directory.
- **Add employee** (admin) — create user + employee profile in one flow.
- **Edit** and **delete** employee records (subject to business rules).
- **Search employees** (authenticated users).
- **Detailed employee cards** for consolidated HR-style viewing.

### 3.5 Notifications

- In-app **notification list** and **unread counts**.
- **Mark as read** workflow.

### 3.6 API Documentation

- **Swagger UI** for user, employee, leave, and activity-log API surfaces (local URLs as configured on the server).

---

## 4. Workflow Process (Requirement → Design → Development → Testing → Deployment)

| Phase | Purpose | Key Outputs |
|--------|---------|-------------|
| **Requirement** | Capture business rules, roles, compliance, and UX expectations | Requirements doc, user stories, acceptance criteria |
| **Design** | Define architecture, data model, APIs, and UI flows | ERD, API contract, wireframes, security model |
| **Development** | Implement frontend, backend, and integrations | Source code, migrations, Swagger specs |
| **Testing** | Validate function, security, and regression | Test plans, automated/manual results, defect log |
| **Deployment** | Release to staging/production | Build artifacts, env config, monitoring |

**End-to-end flow:** Stakeholder needs are refined into **requirements**, translated into **design** artifacts, built in **development**, verified in **testing**, and released through **deployment** with feedback loops at each gate.

---

## 5. Detailed Step-by-Step Workflow Explanation

### 5.1 Requirements Phase

1. **Stakeholder interviews** — Confirm attendance rules, leave policies, and admin powers.
2. **Role definition** — Document Admin vs Employee capabilities (see Section 7).
3. **Non-functional requirements** — Performance, availability, audit retention, and privacy for HR data.
4. **Sign-off** — Baseline scope for MVP vs future enhancements.

### 5.2 Design Phase

1. **Data modeling** — Users, roles, employees, leaves, activity logs, notifications, file storage paths.
2. **API design** — REST resources under `/api`, JWT middleware, admin guards.
3. **UI/UX** — Login/signup, dashboard navigation, attendance home, leave forms, admin tables.
4. **Security design** — CORS policy, secret management (e.g. `JWT_SECRET`), upload limits and file types.

### 5.3 Development Phase

1. **Backend** — Express app, route modules, controllers, MySQL access, Swagger bundles.
2. **Frontend** — React app (Create React App), routing, Axios clients, dashboard modules.
3. **Feature integration** — Connect UI to APIs; handle FormData for multipart leave submissions when voice is attached.
4. **Code review** — Consistency, error handling, and minimal exposure of secrets.

### 5.4 Testing Phase

1. **Unit / component tests** — Where implemented (e.g. React Testing Library).
2. **API testing** — Postman, Swagger “Try it out,” or automated REST tests.
3. **UAT** — Admin and employee personas walk through critical paths (Section 9).
4. **Hardening** — Auth bypass attempts, invalid payloads, file upload abuse scenarios.

### 5.5 Deployment Phase

1. **Build** — `npm run build` for frontend; ensure backend starts with production `NODE_ENV`.
2. **Configure environment** — Database URL, JWT expiry, CORS origins (tighten from `*` in production).
3. **Host frontend** — See Section 10 (Vercel).
4. **Host backend** — Node-friendly host (Railway, Render, Azure App Service, EC2, etc.); MySQL managed instance.
5. **Post-deploy checks** — Health route, login, check-in, leave apply, admin approval.

---

## 6. Tools & Technologies Used

| Layer | Technology |
|--------|------------|
| **Frontend** | React 19, React Router DOM 7, Create React App (`react-scripts` 5), Axios, Bootstrap 4, custom CSS |
| **Backend** | Node.js, Express 4, `mysql` driver, `dotenv`, `cors` |
| **Auth & security** | `jsonwebtoken`, `bcrypt` / `bcryptjs` |
| **File uploads** | `multer` (e.g. leave voice notes), static `/uploads` |
| **API docs** | `swagger-jsdoc`, `swagger-ui-express` |
| **Database** | MySQL |
| **Dev tooling** | `nodemon` (backend dev), `cross-env` (frontend port), ESLint (CRA defaults) |

**Typical local ports (as commonly configured):** frontend **3001**, backend **8081** (adjust per environment).

---

## 7. User Roles (Admin, Employee)

### 7.1 Employee

- Log in and sign up (where policy allows self-registration).
- **Home / Attendance:** check-in, check-out, view personal history.
- **Leave:** apply, view own applications and balance.
- **Profile:** view (and update permitted fields such as phone where implemented).
- **Notifications:** view and mark read.
- **Search:** find colleagues where enabled.

### 7.2 Administrator

- All employee capabilities **plus**:
- **Employee management:** list, **add**, edit, delete employees; open detailed records.
- **Leave approvals:** view all requests, approve/reject.
- **Activity / reports:** broader visibility into activity logs (per implemented routes).
- **Swagger:** access API documentation endpoints when exposed.

---

## 8. Process Flow (Login → Attendance → Reports)

### 8.1 Login

1. User opens the Attendix web app.
2. Submits credentials to the **login** API.
3. On success, receives **JWT** and role; frontend stores token (e.g. `localStorage`) and routes to the **Dashboard**.

### 8.2 Attendance (Check-in / Check-out)

1. From **Home**, employee triggers **check-in** → backend records **login activity** with timestamp.
2. Later, employee triggers **check-out** → **logout activity** recorded.
3. **History** loads from **my activity** endpoint; UI maps records to date, in/out times, and status/working hours fields as returned by the API.

### 8.3 Reports & Oversight

1. **Employee** — personal attendance history on Home; own leave list under Leave.
2. **Admin** — activity log views and employee/leave administration act as **operational reports**; export features may be added as enhancements.
3. **Notifications** — surface events such as leave submissions and decisions.

---

## 9. Testing Strategy

### 9.1 Levels

- **Manual exploratory** — Full journeys on Chrome/Edge (especially speech APIs and media recording).
- **Role-based** — Separate test accounts for Admin and Employee; verify forbidden routes return 403.
- **API** — Validate payloads, status codes, and DB side effects (insert/update/delete).
- **Regression** — Re-run critical path after each release candidate.

### 9.2 Sample Test Cases

| ID | Scenario | Expected |
|----|-----------|----------|
| T1 | Valid login | 200 + JWT; dashboard loads |
| T2 | Invalid password | 401, no token |
| T3 | Check-in twice same day | Per business rule (error or idempotent message) |
| T4 | Apply leave (text only) | 201; row visible to employee and admin |
| T5 | Apply leave with voice | Multipart accepted; file stored; admin can play |
| T6 | Admin approve leave | Status updated; employee notified if implemented |
| T7 | Admin add employee | 201; new user can login |
| T8 | JWT expired | Protected calls fail; user re-authenticates |

### 9.3 Non-functional

- **Security:** No secrets in frontend bundle; HTTPS in production.
- **Performance:** Pagination for large employee/leave lists (recommended for scale).
- **Accessibility:** Forms with labels; keyboard operability for core actions.

---

## 10. Deployment Process (Vercel)

> **Note:** Vercel is optimized for **frontend** static/serverless apps. The **Express + MySQL backend** is typically deployed to a **Node-capable host** with a persistent database. The steps below describe a **professional split deployment**: React on Vercel, API elsewhere.

### 10.1 Prerequisites

- Git repository (GitHub/GitLab/Bitbucket) connected to Vercel.
- Production **MySQL** instance (managed DB recommended).
- Backend deployed with public **HTTPS** URL and environment variables set.

### 10.2 Frontend on Vercel

1. **Import project** in Vercel; set **Root Directory** to `frontend` (or monorepo equivalent).
2. **Build command:** `npm run build`  
3. **Output directory:** `build` (Create React App default).
4. **Environment variables** (examples):
   - `REACT_APP_API_BASE_URL=https://api.yourdomain.com`  
   Replace hardcoded `localhost` references in the client with this variable (code change as part of deployment readiness).
5. **Deploy** — Vercel builds and assigns a production URL; configure **custom domain** if required.

### 10.3 Backend (Companion to Vercel Frontend)

1. Provision a Node host; set `NODE_ENV=production`.
2. Configure **CORS** to allow the Vercel frontend origin (instead of `*` in production).
3. Set **JWT_SECRET**, database credentials, and file storage (e.g. persistent disk or object storage for uploads).
4. Run migrations / schema updates against production MySQL.
5. Health-check the API root and Swagger (if exposed publicly, protect or disable in production).

### 10.4 Post-Deployment

- Smoke test: login, attendance, leave, admin flows against **production** URLs.
- Enable **monitoring** (uptime, error tracking) and **backups** for MySQL.
- Document **rollback** procedure (redeploy previous Vercel deployment; revert API container/image).

---

## Document Control

| Field | Value |
|--------|--------|
| **Product name** | Attendix |
| **Type** | Workflow & technical overview |
| **Audience** | Stakeholders, developers, QA, DevOps |

*End of document.*
