# SK Salon Admin Frontend

This is the owner/admin dashboard for the SK Salon booking system. It is a separate React application used by salon owners to review customer bookings, confirm payment state, approve or reject bookings, manage schedules, and manage services.

The admin frontend does not process payments directly. It reads payment status from the backend and only allows approval when the customer mock payment has been confirmed.

## Run The Admin App

Start the backend first:

```bash
cd backend
npm run dev
```

Then start the admin frontend:

```bash
cd admin-frontend
npm install
npm start
```

The admin dashboard runs at:

```text
http://localhost:3001
```

If port `3001` is busy, React may ask to use another port.

## Backend Requirement

The admin app calls:

```text
http://localhost:5001/api
```

Make sure the backend `.env` includes:

```env
PORT=5001
```

The API base URL is configured in:

```text
src/services/api.js
```

## Default Owner Login

For local development, the backend seeds an owner account when no owner exists:

```text
Email: owner@salon.com
Password: owner123
```

Use this only for development. Change/remove default credentials before any real deployment.

## Project Structure

```text
admin-frontend/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   └── OwnerLayout.js
│   ├── context/
│   │   └── AuthContext.js
│   ├── pages/
│   │   ├── LoginPage.js
│   │   ├── OwnerDashboard.js
│   │   ├── OwnerBookingsPage.js
│   │   ├── OwnerSchedulePage.js
│   │   └── OwnerServicesPage.js
│   ├── services/
│   │   └── api.js
│   ├── App.js
│   ├── index.js
│   ├── index.css
│   └── theme.js
├── package.json
└── README.md
```

## Admin Features

- Owner login
- Dashboard overview
- View all customer bookings
- Filter bookings by date
- See customer contact details
- See booking status
- See mock payment status
- Approve bookings only after payment is confirmed
- Reject pending bookings
- Mark approved bookings as completed
- Cancel approved bookings
- Manage operating hours
- Manage breaks
- Manage closed dates
- Add/edit salon services
- Activate/deactivate services

## Booking And Payment Rules

Booking approval and payment confirmation are separate.

Booking status:

```text
pending
approved
cancelled
completed
```

Payment status:

```text
unpaid
pending
paid
failed
```

The admin can approve only when:

```text
booking.status = pending
payment_status = paid
```

If payment is not confirmed, the admin page disables the **Approve** button and shows:

```text
Wait for mock payment confirmation before approving.
```

When payment is confirmed, the admin page shows:

```text
Mock payment confirmed. Safe for admin approval.
```

## Mock Payment Workflow

The mock payment flow starts in the customer frontend, not in the admin frontend.

Flow:

1. Customer selects a service, date, and time.
2. Customer creates a mock payment session.
3. Backend creates a pending booking and pending payment row.
4. Customer confirms the mock payment.
5. Backend mock webhook validates the token.
6. Backend updates `payment_status` to `paid`.
7. Admin dashboard shows **Payment Confirmed**.
8. Admin can approve the booking.

No card number, CVV, expiry date, or real payment information is collected or stored.

## Backend Routes Used

Authentication:

```text
POST /api/auth/login
GET  /api/auth/me
```

Bookings:

```text
GET /api/owner/bookings
PUT /api/owner/bookings/:id/approve
PUT /api/owner/bookings/:id/reject
PUT /api/owner/bookings/:id/complete
PUT /api/bookings/:id/cancel
```

Schedule:

```text
GET    /api/schedule
PUT    /api/owner/schedule/:dayOfWeek
GET    /api/owner/breaks
POST   /api/owner/breaks
DELETE /api/owner/breaks/:id
GET    /api/schedule/closed-dates
POST   /api/owner/closed-dates
DELETE /api/owner/closed-dates/:id
```

Services:

```text
GET  /api/services
POST /api/owner/services
PUT  /api/owner/services/:id
```

## Development Commands

Start admin frontend:

```bash
npm start
```

Build admin frontend:

```bash
npm run build
```

## Troubleshooting

### Login Fails

- Confirm the backend is running.
- Confirm `JWT_SECRET` exists in backend `.env`.
- Clear browser localStorage and log in again.
- Make sure the user has role `owner`.

### Bookings Do Not Load

- Confirm backend is running on `http://localhost:5001`.
- Check `src/services/api.js`.
- Confirm the owner token exists in browser localStorage.

### Approve Button Is Disabled

This is expected when payment is not confirmed.

Ask the customer to complete the mock payment flow first. The admin page should show **Payment Confirmed** before approval is allowed.

### Payment Confirmed But Admin Still Cannot Approve

- Refresh the admin bookings page.
- Check that the booking still has `status = pending`.
- Check that the booking has `payment_status = paid`.
- Restart the backend if database schema changes were just added.

## Security Notes

- Admin routes require an authenticated owner JWT.
- The admin frontend does not store or handle card data.
- Payment confirmation is controlled by backend state.
- Backend approval logic also checks payment status, so frontend button state is not the only protection.
- Default owner credentials are for local development only.
