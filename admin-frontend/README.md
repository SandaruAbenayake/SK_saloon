# BarberBook Admin Frontend

This is the admin dashboard for the BarberBook salon booking application. It provides a separate interface for salon owners to manage bookings, schedule, and services.

## Project Structure

```
admin-frontend/
├── src/
│   ├── components/
│   │   └── OwnerLayout.js       # Main admin layout with sidebar
│   ├── context/
│   │   └── AuthContext.js       # Authentication context (shared with backend)
│   ├── pages/
│   │   ├── OwnerDashboard.js    # Dashboard overview
│   │   ├── OwnerBookingsPage.js # Booking management
│   │   ├── OwnerSchedulePage.js # Schedule management
│   │   └── OwnerServicesPage.js # Services management
│   ├── services/
│   │   └── api.js               # API service (axios instance)
│   ├── App.js                   # Main app component with router
│   ├── index.js                 # Entry point
│   ├── index.css                # Global styles
│   └── theme.js                 # Dark admin theme
├── public/
│   └── index.html               # HTML template
├── package.json                 # Dependencies and scripts
└── .gitignore
```

## Installation

1. Navigate to the admin-frontend directory:
```bash
cd admin-frontend
```

2. Install dependencies:
```bash
npm install
```

## Development

To start the development server on port 3001 (or next available port):
```bash
npm start
```

The admin dashboard will be available at `http://localhost:3001`

## Build

To build for production:
```bash
npm run build
```

## Features

- **Dashboard**: Overview of today's appointments, pending bookings, and statistics
- **Bookings**: Manage customer bookings (approve, reject, complete, cancel)
- **Schedule**: Set operating hours, breaks, and closed dates
- **Services**: Add, edit, and manage salon services

## Authentication

The admin frontend shares the same authentication with the backend as the customer frontend. Owners must log in with credentials that have the `owner` role in the database.

## Backend Configuration

Make sure the backend API is running on `http://localhost:5001/api` (configurable in `src/services/api.js`)

## Backend Routes Used

- `POST /auth/login` - Owner login
- `GET /owner/bookings` - Fetch all bookings
- `PUT /owner/bookings/:id/approve` - Approve booking
- `PUT /owner/bookings/:id/reject` - Reject booking
- `PUT /owner/bookings/:id/complete` - Mark booking as complete
- `PUT /bookings/:id/cancel` - Cancel booking
- `GET /schedule` - Fetch schedule
- `PUT /owner/schedule/:day` - Update daily schedule
- `POST /owner/breaks` - Add break
- `DELETE /owner/breaks/:id` - Delete break
- `POST /owner/closed-dates` - Add closed date
- `DELETE /owner/closed-dates/:id` - Delete closed date
- `GET /services` - Fetch services
- `POST /owner/services` - Create service
- `PUT /owner/services/:id` - Update service
