# SK Salon Booking System

A professional salon booking application with separate customer and admin frontends.

## Project Structure

```
SK_saloon/
├── frontend/              # Customer-facing frontend (React)
│   ├── src/
│   │   ├── pages/        # Customer pages (HomePage, BookingPage, MyBookingsPage)
│   │   ├── components/   # Navbar, Popup, etc.
│   │   ├── context/      # AuthContext
│   │   ├── services/     # API service
│   │   ├── App.js        # Main app (customer routes only)
│   │   └── theme.js      # Dark theme
│   └── package.json
│
├── admin-frontend/        # Admin dashboard (React)
│   ├── src/
│   │   ├── pages/        # Owner admin pages (Dashboard, Bookings, Schedule, Services)
│   │   ├── components/   # OwnerLayout with sidebar
│   │   ├── context/      # AuthContext
│   │   ├── services/     # API service
│   │   ├── App.js        # Main app (admin routes only)
│   │   └── theme.js      # Professional admin theme
│   ├── package.json
│   └── README.md
│
├── backend/               # Node.js/Express API
│   ├── server.js         # Main server
│   ├── config/           # Database config
│   ├── middleware/       # Authentication middleware
│   ├── routes/           # API routes (auth, bookings, owner, payments, services, schedule)
│   ├── models/           # Database models
│   ├── utils/            # Utilities
│   └── package.json
│
└── [Configuration files]
    ├── SETUP_GUIDE.md    # Installation instructions
    ├── CHANGELOG.md      # Version history
    └── README_UPDATE.md  # Feature updates
```

## Quick Start

Open three terminal windows and run each application separately. Start the backend first, then the two frontends.

### 1. Backend API
```bash
cd backend
npm install
npm run dev
```
Backend should run on `http://localhost:5001`.

> The frontend API clients are configured to call `http://localhost:5001/api`, so make sure your backend `.env` has `PORT=5001`.

### 2. Customer Frontend
```bash
cd frontend
npm install
npm start
```
Customer portal runs on `http://localhost:3000`

### 3. Admin Frontend
```bash
cd admin-frontend
npm install
npm start
```
Admin dashboard runs on `http://localhost:3001` (or next available port)

### Default Owner Login
The backend seeds a local owner account when no owner exists:

```text
Email: owner@salon.com
Password: owner123
```

Use this only for local learning/demo work. Change it before any real deployment.

## Accessing the Application

### Customer Portal
- **URL**: `http://localhost:3000`
- **Features**:
  - Browse services
  - Book appointments through a mock payment flow
  - Confirm mock payment without storing card data
  - View booking status
  - View payment status
  - Manage bookings
  - User registration and login

### Admin Dashboard
- **URL**: `http://localhost:3001`
- **Features**:
  - View all bookings
  - See customer payment status
  - Approve customer bookings only after payment is confirmed
  - Reject customer bookings
  - Manage schedule and breaks
  - Manage services and pricing
  - Dashboard with statistics

## Technology Stack

### Frontend
- React 18.3
- Material-UI (MUI) for components
- Axios for API calls
- React Router for navigation

### Backend
- Node.js with Express
- MySQL for database
- JWT for authentication
- Axios for requests

## Key Features

### Booking System
- Customers can browse and book services
- Customers create a mock payment session before final booking approval
- Bookings stay "Pending" until owner approval
- Payment status is tracked separately as `unpaid`, `pending`, `paid`, or `failed`
- Owners can approve only bookings with confirmed mock payment
- Complete workflow from booking to service completion

### Mock Payment Flow
This project includes a learning-only mock payment flow. It does not use a real payment gateway and does not collect or store card details.

Flow:
1. Customer selects service, date, and time.
2. Customer clicks **Create Mock Payment Session**.
3. Backend creates:
   - a pending booking
   - a pending payment session
   - a private mock webhook token
4. Customer clicks **Confirm** on the mock payment message.
5. Frontend sends the simulated webhook request to the backend.
6. Backend validates the mock webhook token.
7. Backend updates payment status to `paid`.
8. Admin sees **Payment Confirmed** and can approve the booking.

Important backend endpoints:
```text
POST /api/payments/create-session
POST /api/payments/mock-webhook
GET  /api/payments/session/:sessionId
```

The mock webhook token is returned to the frontend only for learning/demo purposes. In a real payment gateway, the webhook is called server-to-server and secrets must never be exposed to the browser.

### Full System Workflow
```text
Customer registers/logs in
Customer selects service, date, and slot
Customer creates mock payment session
Customer confirms mock payment
Backend marks payment_status = paid
Admin sees Payment Confirmed
Admin approves booking
Booking becomes approved
Admin can later mark booking completed
```

### Owner Management
- Dashboard with quick stats
- Bookings management interface
- Schedule management (hours, breaks, closed dates)
- Service management (add, edit, activate/deactivate)

### Authentication
- Separate authentication for customers and owners
- JWT token-based
- Secure route protection

## Database

The backend uses MySQL with the following main tables:
- `users` - Customers and owners
- `services` - Available services
- `bookings` - Customer bookings with booking status and payment status
- `payments` - Mock payment sessions and webhook confirmation state
- `schedules` - Operating hours
- `breaks` - Schedule breaks
- `closed_dates` - Holiday/closure management

### Booking vs Payment Status
Booking approval and payment confirmation are separate.

Booking status:
```text
pending -> approved -> completed
pending -> cancelled
```

Payment status:
```text
unpaid
pending -> paid
pending -> failed
```

Admin approval is allowed only when:
```text
booking.status = pending
payment_status = paid
```

## API Documentation

Main backend routes:
- `/api/auth` - login, register, current user
- `/api/services` - customer service listing
- `/api/bookings` - booking availability, validation, customer bookings
- `/api/payments` - mock payment session and webhook simulation
- `/api/owner` - owner schedule, booking approval, services management
- `/api/schedule` - public schedule data

Key payment endpoints:
```text
POST /api/payments/create-session
POST /api/payments/mock-webhook
GET  /api/payments/session/:sessionId
```

Key admin booking endpoints:
```text
GET /api/owner/bookings
PUT /api/owner/bookings/:id/approve
PUT /api/owner/bookings/:id/reject
PUT /api/owner/bookings/:id/complete
```

## Frontend Documentation

- **Admin Frontend**: [admin-frontend/README.md](admin-frontend/README.md)

## Development Notes

### Environment Variables
Each application may use environment variables:
- Backend: Configure database connection, server port, JWT secret
- Frontend: Configure API base URL

Example backend `.env`:
```env
PORT=5001
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=salon_booking
JWT_SECRET=your_dev_secret
```

### Separate Frontend Applications
The system now uses two separate React applications:
1. **frontend** - For customers (customer theme, customer routes)
2. **admin-frontend** - For owners (professional theme, admin routes)

Both connect to the same backend API and share authentication through localStorage.

## Troubleshooting

### Port Already in Use
If a port is already in use, change it in:
- Backend: Set `PORT` in [backend/server.js](backend/server.js)
- Frontend: React will prompt to use next available port

### Authentication Issues
- Clear browser localStorage and try logging in again
- Check that JWT tokens are valid in browser console

### API Connection Issues
- Verify backend is running on port 5001
- Check API base URL in `src/services/api.js` of each frontend

### Mock Payment Issues
- Restart the backend after pulling the latest payment changes.
- Make sure the backend database initialized successfully so the `payments` table exists.
- Create bookings from the customer booking page using **Create Mock Payment Session**.
- Click **Confirm** on the mock payment message to simulate payment confirmation.
- In admin bookings, approve only after the payment chip shows **Payment Confirmed**.
- If mock payment fails, confirm the backend is running on port `5001` and the frontend API base URL is `http://localhost:5001/api`.

## Future Enhancements

- Email notifications for booking status
- SMS reminders for customers
- Analytics dashboard for owners
- Mobile app versions
- Real payment gateway integration

---

For detailed setup instructions, see [SETUP_GUIDE.md](SETUP_GUIDE.md)
