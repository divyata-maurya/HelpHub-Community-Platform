# HelpHub – Community Help & Donation Management Platform

**Tagline:** Donate What You Can. Help Who You Can.

HelpHub is a full-stack web-based Community Help and Donation Management Platform designed to connect donors, recipients, and NGOs. It provides a centralized platform where donors can share useful resources, recipients can request essential items, and NGOs can participate in community donation activities.

## Features

- User registration and login
- Role-based access for Donors, Recipients, NGOs, and Admin
- Donation creation and management
- Browse available donations
- Donation request management
- NGO profile management
- Admin dashboard and donation approval
- User and NGO management
- Notifications
- Report submission and management
- User profile management
- Image uploads for donations

## Technology Stack

**Frontend**
- HTML5
- CSS3
- JavaScript

**Backend**
- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT Authentication
- Multer

## Project Structure

```text
HelpHub/
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── scripts/
│   ├── app.js
│   ├── server.js
│   └── package.json
│
├── frontend/
│   ├── css/
│   ├── js/
│   ├── images/
│   ├── pages/
│   └── index.html
│
├── .gitignore
└── README.md
```

## Installation and Setup

### 1. Clone the repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd HelpHub
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file inside the backend folder and configure:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d
```

Start the backend:

```bash
npm run dev
```

The backend runs at:

`http://localhost:5000`

### 3. Frontend Setup

Open another terminal:

```bash
cd frontend
python -m http.server 5500
```

Open the application:

`http://localhost:5500`

## API Endpoints

Base URL: `/api/v1`

- `/auth` – Authentication
- `/users` – User management
- `/donations` – Donation management
- `/requests` – Donation requests
- `/ngos` – NGO management
- `/notifications` – Notifications
- `/reports` – Reports
- `/dashboard` – Role-based dashboards
- `/admin` – Admin operations

## Environment Variables

Sensitive configuration values must be stored in the backend `.env` file and must not be committed to GitHub.

Refer to `backend/.env.example` for the required variables.

## Future Improvements

- Cloud-based image storage
- Enhanced analytics and reporting
- Improved deployment and scalability

## Author

Developed as a full-stack web development project.

## License

This project is available for educational and demonstration purposes.
