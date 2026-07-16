# Teammate Integration Guide
## School Organization Management Ecosystem — Admin API

**Base URL:** `http://localhost:5000/api`
**Version:** 1.0.0
**Last Updated:** July 2026

---

## Overview

The Admin Dashboard acts as the **central hub** of the system. Your sub-system must:
1. Send a `ping` request when it starts up (so the dashboard knows you're online)
2. Call the appropriate endpoint whenever you create/update data (member, event, attendance, or payment)

You do **not** need to build your own authentication. The Admin API authenticates your system via an **API key** in the request header.

## Current Status

- The **Systems** page shows a subsystem as online only after it sends `POST /api/integration/ping`.
- Online status is based on recent ping activity, not a manual toggle.
- Attendance records now store `eventTitle`, `date`, and `timeIn` automatically on the backend.

---

## Your API Keys

> ⚠️ **Keep this secret.** Do not commit it to GitHub. Store it in your `.env` file.

| Teammate | Module | Port | API Key |
|----------|--------|------|---------|
| **John Paul** | Member Registration | `:5001` | `sk_39cbeaea5f83769b592adb03ba800af502726f7c2f88de35` |
| **Timothy** | Events Management | `:5002` | `sk_8ecd1a0773d0560d760a627f1264bd9bc01c550d14413086` |
| **Luis** | Attendance Management | `:5003` | `sk_33794c5b22a7f9bcac98d52a3222ea59f1c827bca0f16ec1` |
| **Ned** | Sanction Payment | `:5004` | `sk_97fb1302de285120dd9c85cd7e7118db6df71af558f52b90` |

---

## Authentication

Every request must include your API key as a **header**:

```http
x-api-key: sk_YOUR_KEY_HERE
```

If the key is wrong or missing, you'll get:
```json
{ "success": false, "message": "Invalid or inactive API key." }
```

---

## Step 0 — Ping on Startup (Required by ALL teammates)

Call this **once when your backend server starts** so the dashboard shows you as "Online".

> [!IMPORTANT]
> The dashboard uses your latest ping to decide whether the system is online. If you do not ping after startup, your system will appear offline.

```http
POST http://localhost:5000/api/integration/ping
Content-Type: application/json

{
  "apiKey": "sk_YOUR_KEY_HERE"
}
```

**Success Response:**
```json
{
  "success": true,
  "message": "Ping received from Member Registration. Status set to online.",
  "timestamp": "2026-07-08T12:00:00.000Z"
}
```

**How to call this in Express (example):**
```js
const axios = require('axios');

async function pingAdminDashboard() {
  try {
    await axios.post('http://localhost:5000/api/integration/ping', {
      apiKey: process.env.ADMIN_API_KEY,
    });
    console.log('✅ Admin Dashboard notified — system is online.');
  } catch (err) {
    console.warn('⚠️  Could not reach Admin Dashboard:', err.message);
  }
}

// Call this once when your server starts
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  pingAdminDashboard();
});
```

---

## John Paul — Member Registration

### Endpoint
```
POST http://localhost:5000/api/integration/push-member
```

### Headers
```
Content-Type: application/json
x-api-key: sk_39cbeaea5f83769b592adb03ba800af502726f7c2f88de35
```

### Request Body
```json
{
  "memberId":  "MBR-001",
  "firstName": "Maria",
  "lastName":  "Santos",
  "email":     "maria.santos@email.com",
  "course":    "BSIT",
  "year":      2,
  "organization": "Student Council",
  "status":    "Active"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `memberId` | string | No | Your system's member ID |
| `firstName` | string | **Yes** | Member's first name |
| `lastName` | string | **Yes** | Member's last name |
| `email` | string | No | Member's email |
| `course` | string | No | e.g. BSIT, BSCS, BSBA |
| `year` | number | No | Year level (1–4) |
| `organization` | string | No | Organization, club, or group the member joined or is involved in |
| `status` | string | No | `"Active"` or `"Inactive"` |

### Success Response
```json
{
  "success":  true,
  "message":  "Member \"Maria Santos\" received and logged.",
  "received": {
    "memberId":  "MBR-001",
    "firstName": "Maria",
    "lastName":  "Santos",
    "email":     "maria.santos@email.com",
    "course":    "BSIT",
    "year":      2,
    "organization": "Student Council",
    "status":    "Active"
  }
}
```

### When to call this
- After a new member registers in your system
- After a member's profile is updated
- When your server starts (to sync existing members with the dashboard)

### Example (Express)
```js
const axios = require('axios');

const ADMIN_API = 'http://localhost:5000/api/integration';
const API_KEY   = process.env.ADMIN_API_KEY; // store in .env

async function syncMember(member) {
  try {
    const res = await axios.post(`${ADMIN_API}/push-member`, {
      memberId:  member.id,
      firstName: member.firstName,
      lastName:  member.lastName,
      email:     member.email,
      course:    member.course,
      year:      member.year,
      organization: member.organization,
      status:    member.isActive ? 'Active' : 'Inactive',
    }, {
      headers: { 'x-api-key': API_KEY },
    });
    console.log('Synced to Admin Dashboard:', res.data.message);
  } catch (err) {
    console.error('Sync failed:', err.response?.data?.message);
  }
}
```

---

## Timothy — Events Management

### Endpoint
```
POST http://localhost:5000/api/integration/push-event
```

### Headers
```
Content-Type: application/json
x-api-key: sk_8ecd1a0773d0560d760a627f1264bd9bc01c550d14413086
```

### Request Body
```json
{
  "eventId":     "EVT-001",
  "title":       "Foundation Day",
  "description": "Annual school organization foundation day celebration.",
  "location":    "Main Auditorium",
  "date":        "2026-07-15",
  "organizer":   "Events Committee",
  "status":      "Upcoming"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `eventId` | string | No | Your system's event ID |
| `title` | string | **Yes** | Event name |
| `description` | string | No | Event details |
| `location` | string | No | Venue |
| `date` | string | No | ISO date: `"YYYY-MM-DD"` |
| `organizer` | string | No | Organizing person/group |
| `status` | string | No | `"Upcoming"`, `"Ongoing"`, `"Completed"`, `"Cancelled"` |

### Success Response
```json
{
  "success":  true,
  "message":  "Event \"Foundation Day\" received and logged.",
  "received": {
    "eventId":   "EVT-001",
    "title":     "Foundation Day",
    "location":  "Main Auditorium",
    "date":      "2026-07-15",
    "organizer": "Events Committee",
    "status":    "Upcoming"
  }
}
```

### When to call this
- After a new event is created
- After an event is updated (status change, date change, etc.)

### Example (Express)
```js
async function syncEvent(event) {
  try {
    await axios.post('http://localhost:5000/api/integration/push-event', {
      eventId:     event.id,
      title:       event.title,
      description: event.description,
      location:    event.location,
      date:        event.date,
      organizer:   event.organizer,
      status:      event.status,
    }, {
      headers: { 'x-api-key': process.env.ADMIN_API_KEY },
    });
  } catch (err) {
    console.error('Event sync failed:', err.response?.data?.message);
  }
}
```

---

## Luis — Attendance Management

### Endpoint
```
POST http://localhost:5000/api/integration/push-attendance
```

### Headers
```
Content-Type: application/json
x-api-key: sk_33794c5b22a7f9bcac98d52a3222ea59f1c827bca0f16ec1
```

### Request Body
```json
{
  "eventId":    "EVT-001",
  "eventTitle": "Foundation Day",
  "memberId":   "MBR-001",
  "memberName": "Juan dela Cruz",
  "status":     "Absent",
  "remarks":    "No valid excuse submitted"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `eventId` | string | No | Your system's event ID |
| `eventTitle` | string | **Yes** | Name of the event |
| `memberId` | string | No | Your system's member ID |
| `memberName` | string | **Yes** | Full name of the member |
| `status` | string | No | `"Present"`, `"Absent"`, or `"Late"` |
| `remarks` | string | No | Additional notes |

The backend also stores `date` and `timeIn` for each attendance record automatically, so the dashboard can display them directly.

### ⚡ Auto-Sanction Feature

> [!IMPORTANT]
> If `status` is `"Absent"`, the Admin Dashboard will **automatically create a ₱50 sanction** for that member in the Payments collection. You don't need to do anything extra — it happens on the backend automatically.

### Success Response (Present)
```json
{
  "success":     true,
  "message":     "Attendance for \"Maria Santos\" recorded.",
  "status":      "Present",
  "autoSanction": null
}
```

### Success Response (Absent — sanction auto-created)
```json
{
  "success": true,
  "message": "Attendance for \"Juan dela Cruz\" recorded.",
  "status":  "Absent",
  "autoSanction": {
    "paymentId": "PAY-002",
    "amount":    50,
    "status":    "Unpaid"
  }
}
```

### When to call this
- After attendance is submitted for an event (once per member per event)

### Example (Express)
```js
async function syncAttendance(record) {
  try {
    const res = await axios.post('http://localhost:5000/api/integration/push-attendance', {
      eventId:    record.eventId,
      eventTitle: record.eventTitle,
      memberId:   record.memberId,
      memberName: record.memberName,
      status:     record.status,   // "Present", "Absent", or "Late"
      remarks:    record.remarks,
    }, {
      headers: { 'x-api-key': process.env.ADMIN_API_KEY },
    });

    if (res.data.autoSanction) {
      console.log(`Auto-sanction created: ${res.data.autoSanction.paymentId}`);
    }
  } catch (err) {
    console.error('Attendance sync failed:', err.response?.data?.message);
  }
}
```

---

## Ned — Sanction Payment Management

### Endpoint
```
POST http://localhost:5000/api/integration/push-transaction
```

### Headers
```
Content-Type: application/json
x-api-key: sk_97fb1302de285120dd9c85cd7e7118db6df71af558f52b90
```

### Request Body
```json
{
  "memberName":   "Juan dela Cruz",
  "memberId":     "MBR-001",
  "reason":       "Absence – Foundation Day",
  "amount":       50,
  "sanctionDate": "2026-07-08",
  "notes":        "No excuse letter submitted"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `memberName` | string | **Yes** | Full name of the member |
| `memberId` | string | No | Your system's member ID |
| `reason` | string | **Yes** | Reason for the sanction |
| `amount` | number | **Yes** | Amount in Philippine Peso |
| `sanctionDate` | string | No | ISO date: `"YYYY-MM-DD"` |
| `notes` | string | No | Additional notes |

### Success Response
```json
{
  "success":     true,
  "paymentId":   "PAY-003",
  "transaction": {
    "id":        "6a4e32ff041d92eb8ae38532",
    "paymentId": "PAY-003",
    "status":    "Unpaid"
  }
}
```

### Updating Payment Status (Marking as Paid)

> [!NOTE]
> The current Admin API does not expose a dedicated payment-status update endpoint yet. Coordinate with Cesar (Admin Dashboard) to update payment statuses manually through the admin panel for now.

### When to call this
- When a new sanction is created manually in your system
- Do **not** duplicate sanctions for absences — Luis's system handles those automatically

---

## Setting Up Your `.env`

Each teammate should add this to their `.env` file:

```env
# Admin Dashboard Integration
ADMIN_API_URL=http://localhost:5000/api
ADMIN_API_KEY=sk_YOUR_KEY_HERE   # replace with YOUR key from the table above
```

Then in your code:
```js
require('dotenv').config();
const ADMIN_API_KEY = process.env.ADMIN_API_KEY;
```

---

## Installing Axios

If you don't have it yet:
```bash
npm install axios
```

---

## Error Codes Reference

| HTTP Status | Meaning | What to do |
|-------------|---------|------------|
| `200` / `201` | ✅ Success | Nothing |
| `400` | Missing required fields | Check your request body |
| `401` | Wrong or missing API key | Check your `x-api-key` header |
| `404` | Wrong endpoint URL | Check the URL |
| `500` | Server error | Tell Cesar immediately |

---

## Quick Test (Thunder Client or Postman)

Test that your key works by calling ping:

```http
POST http://localhost:5000/api/integration/ping
Content-Type: application/json

{
  "apiKey": "sk_YOUR_KEY_HERE"
}
```

Expected:
```json
{ "success": true, "message": "Ping received from [Your System]. Status set to online." }
```

If this works, all your other endpoints will work too.

---

## Contact

If the Admin Dashboard API doesn't work, contact **Cesar** (Admin Dashboard developer).

For issues with your own sub-system, handle it within your team.
