# User Manual

## Admin Login

1. Open the frontend application.
2. Go to the login page.
3. Enter the admin email and password.
4. After login, the dashboard will load the organization summary.

## Dashboard Overview

From the dashboard, the admin can:

- View total members and system status
- Monitor sanctions and collected amounts
- Review recent activity logs
- Open analytics and reports

## Managing Connected Systems

1. Open the Systems page.
2. Register a new subsystem with a name, module, and description.
3. Copy the generated API key and share it securely with the subsystem owner.
4. Verify the subsystem appears as online after pinging the integration endpoint.

## Integration Demo

Use the integration endpoints to simulate module activity:

- Member registration pushes new members
- Event management pushes new events
- Attendance management pushes attendance and auto-creates sanctions for absences
- Payments pushes sanction transactions

## Reports and Logs

- Use the Reports page to review summarized analytics.
- Use the Logs page to inspect the latest integration events.
- Confirm that each event created by a subsystem is stored with the originating system name and timestamp.
