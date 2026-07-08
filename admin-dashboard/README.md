# School Organization Management Ecosystem

A full-stack admin dashboard and integration platform for managing members, events, attendance, sanctions, and connected sub-systems.

## Highlights

- Central admin dashboard with authentication and role-based access
- JWT-protected REST API
- MongoDB-backed persistence for users, systems, transactions, and integration logs
- Integration endpoints for member registration, events, attendance, and payment modules
- Automated sanction creation for absences
- React + Material UI frontend with analytics and reports

## Tech Stack

- Backend: Node.js, Express, MongoDB, Mongoose, JWT, bcrypt
- Frontend: React, React Router, Material UI, Recharts, react-hot-toast

## Project Structure

- backend/: Express API, models, routes, controllers, seed data
- frontend/: React dashboard and pages
- docs/: architecture, ERD, and user guide
- backend/docs/: OpenAPI specification

## Quick Start

### 1) Backend

```bash
cd admin-dashboard/backend
npm install
cp .env.example .env
npm run dev
```

### 2) Frontend

```bash
cd admin-dashboard/frontend
npm install
npm start
```

The frontend will run on http://localhost:3000 and the backend on http://localhost:5000.

## Documentation

- [docs/architecture.md](docs/architecture.md)
- [docs/erd.md](docs/erd.md)
- [docs/user-manual.md](docs/user-manual.md)
- [backend/docs/openapi.yaml](backend/docs/openapi.yaml)
- [backend/SchoolOrg_Admin_API.postman_collection.json](backend/SchoolOrg_Admin_API.postman_collection.json)

## Demo Flow

1. Login as admin
2. Register or view connected systems
3. Submit a member, event, or attendance payload via the integration endpoints
4. Verify the dashboard updates and the integration log is recorded
5. Confirm automated sanctions are created on absence submissions
