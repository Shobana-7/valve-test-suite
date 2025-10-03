# Valve Test Suite - Web Application

A comprehensive web application for managing Pressure Safety Valve (PSV) testing, built with React.js, Node.js, Express, and MySQL.

## 🚀 Features

### User Roles
- **Operator**: Create and manage test reports
- **Supervisor**: Review and approve/reject test reports
- **Admin**: Full system access including user management

### Core Functionality
- ✅ User authentication with JWT
- ✅ Role-based access control
- ✅ Create, view, edit, and delete test reports
- ✅ Approve/reject reports (Admin/Supervisor)
- ✅ Dashboard with statistics
- ✅ User management (Admin only)
- ✅ Responsive design
- ✅ Professional UI/UX

## 📋 Prerequisites

- Node.js (v14 or higher)
- MySQL (v5.7 or higher)
- npm or yarn

## 🛠️ Installation

### 1. Clone the repository
```bash
cd c:\Users\User\Desktop\Project-Web\30-9
```

### 2. Install dependencies

#### Backend
```bash
npm install
```

#### Frontend
```bash
cd client
npm install
cd ..
```

### 3. Database Setup

#### Option A: Using MySQL Workbench or Command Line
1. Open MySQL and create a database:
```sql
CREATE DATABASE valve_test_suite;
```

2. Run the initialization script:
```bash
npm run init-db
```

#### Option B: Manual Setup
1. Import the SQL file located at `server/config/database.sql`
2. Update the `.env` file with your database credentials

### 4. Configure Environment Variables

Create a `.env` file in the `server` directory (or use the existing one):

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=valve_test_suite
DB_PORT=3306

# JWT Configuration
JWT_SECRET=valve_test_suite_secret_key_2025_change_in_production
JWT_EXPIRES_IN=7d

# CORS Configuration
CLIENT_URL=http://localhost:5173
```

**Important**: Update `DB_PASSWORD` with your MySQL root password!

## 🚀 Running the Application

### Development Mode

#### Start Backend Server
```bash
npm run dev
```
The backend will run on `http://localhost:5000`

#### Start Frontend (in a new terminal)
```bash
npm run client
```
The frontend will run on `http://localhost:5173`

### Production Mode

#### Build Frontend
```bash
npm run build
```

#### Start Backend
```bash
npm start
```

## 👤 Default User Credentials

After running the database initialization, you can login with:

| Role | Username | Password |
|------|----------|----------|
| Admin | admin | admin123 |
| Operator | operator1 | operator123 |
| Supervisor | supervisor1 | supervisor123 |

## 📁 Project Structure

```
valve-test-suite/
├── server/                 # Backend (Node.js + Express)
│   ├── config/            # Database configuration
│   ├── middleware/        # Authentication middleware
│   ├── routes/            # API routes
│   ├── scripts/           # Database initialization scripts
│   └── server.js          # Main server file
├── client/                # Frontend (React.js)
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── context/       # React context (Auth)
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   ├── App.jsx        # Main App component
│   │   └── main.jsx       # Entry point
│   ├── index.html
│   └── vite.config.js     # Vite configuration
├── package.json
└── README.md
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - User logout

### Users (Admin only)
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Reports
- `GET /api/reports` - Get all reports (filtered by role)
- `GET /api/reports/:id` - Get report by ID
- `POST /api/reports` - Create new report
- `PUT /api/reports/:id` - Update report
- `DELETE /api/reports/:id` - Delete report
- `PATCH /api/reports/:id/status` - Approve/reject report
- `GET /api/reports/stats/dashboard` - Get dashboard statistics

## 🎨 Technologies Used

### Frontend
- React.js 18
- React Router DOM
- Axios
- Vite
- CSS3

### Backend
- Node.js
- Express.js
- MySQL2
- JWT (jsonwebtoken)
- bcryptjs
- CORS

## 🔒 Security Features

- Password hashing with bcrypt
- JWT-based authentication
- Role-based access control
- Protected API routes
- SQL injection prevention with parameterized queries

## 📱 Responsive Design

The application is fully responsive and works on:
- Desktop computers
- Tablets
- Mobile devices

## 🐛 Troubleshooting

### Database Connection Issues
1. Ensure MySQL is running
2. Check database credentials in `.env`
3. Verify database exists: `SHOW DATABASES;`

### Port Already in Use
- Backend: Change `PORT` in `.env`
- Frontend: Change port in `client/vite.config.js`

### Module Not Found Errors
```bash
# Reinstall dependencies
npm install
cd client && npm install
```

## 📝 License

ISC

## 👨‍💻 Development

### Adding New Features
1. Backend: Add routes in `server/routes/`
2. Frontend: Add pages in `client/src/pages/`
3. Update API service in `client/src/services/api.js`

### Database Migrations
Modify `server/config/database.sql` and re-run:
```bash
npm run init-db
```

## 🤝 Support

For issues or questions, please check the troubleshooting section or review the code comments.

## 🎯 Future Enhancements

- PDF report generation
- Excel export functionality
- Email notifications
- Advanced search and filtering
- Report templates
- Audit logging
- File attachments for reports
- Multi-language support

---

**Built with ❤️ for Valve Testing Professionals**

