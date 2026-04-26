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
│   ├── package.json
│   └── README.md
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
│   ├── routes/           # API routes
│   ├── models/           # Database models
│   ├── utils/            # Utilities
│   ├── package.json
│   └── README.md
│
└── [Configuration files]
    ├── SETUP_GUIDE.md    # Installation instructions
    ├── CHANGELOG.md      # Version history
    └── README_UPDATE.md  # Feature updates
```

## Quick Start

### 1. Install Backend Dependencies
```bash
cd backend
npm install
node server.js
```
Backend runs on `http://localhost:5001`

### 2. Install Customer Frontend Dependencies
```bash
cd ../frontend
npm install
npm start
```
Customer portal runs on `http://localhost:3000`

### 3. Install Admin Frontend Dependencies
```bash
cd ../admin-frontend
npm install
npm start
```
Admin dashboard runs on `http://localhost:3001` (or next available port)

## Accessing the Application

### Customer Portal
- **URL**: `http://localhost:3000`
- **Features**:
  - Browse services
  - Book appointments (creates pending booking)
  - View booking status
  - Manage bookings
  - User registration and login

### Admin Dashboard
- **URL**: `http://localhost:3001`
- **Features**:
  - View all bookings
  - Approve/Reject customer bookings
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
- Bookings start as "Pending" requiring owner approval
- Owners can approve or reject bookings
- Complete workflow from booking to service completion

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
- `bookings` - Customer bookings with status tracking
- `schedules` - Operating hours
- `breaks` - Schedule breaks
- `closed_dates` - Holiday/closure management

## API Documentation

See [backend/README.md](backend/README.md) for detailed API endpoint documentation.

## Frontend Documentation

- **Customer Frontend**: [frontend/README.md](frontend/README.md)
- **Admin Frontend**: [admin-frontend/README.md](admin-frontend/README.md)

## Development Notes

### Environment Variables
Each application may use environment variables:
- Backend: Configure database connection, server port, JWT secret
- Frontend: Configure API base URL

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

## Future Enhancements

- Email notifications for booking status
- SMS reminders for customers
- Analytics dashboard for owners
- Mobile app versions
- Payment integration

---

For detailed setup instructions, see [SETUP_GUIDE.md](SETUP_GUIDE.md)
