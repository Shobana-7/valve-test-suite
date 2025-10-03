# Quick Setup Guide

## Step 1: Configure MySQL Database

### Option A: If you have MySQL installed with a password
1. Open `server/.env` file
2. Update the `DB_PASSWORD` line with your MySQL root password:
   ```
   DB_PASSWORD=your_actual_mysql_password
   ```

### Option B: If MySQL has no password (default installation)
1. The `.env` file is already configured with empty password
2. Make sure MySQL service is running

### Option C: If you don't have MySQL installed
1. Download and install MySQL from: https://dev.mysql.com/downloads/mysql/
2. During installation, set a root password
3. Update `server/.env` with that password

## Step 2: Initialize the Database

Run this command to create the database and tables:
```bash
npm run init-db
```

This will:
- Create the `valve_test_suite` database
- Create all necessary tables (users, test_reports, etc.)
- Insert default users with credentials:
  - Admin: admin / admin123
  - Operator: operator1 / operator123
  - Supervisor: supervisor1 / supervisor123
- Insert sample test reports

## Step 3: Start the Backend Server

```bash
npm run dev
```

The server will start on http://localhost:5000

You should see:
```
✅ Database connected successfully
🚀 Server is running on port 5000
```

## Step 4: Start the Frontend (in a new terminal)

```bash
npm run client
```

The React app will start on http://localhost:5173

## Step 5: Access the Application

Open your browser and go to: http://localhost:5173

Login with any of the default credentials:
- **Admin**: username: `admin`, password: `admin123`
- **Operator**: username: `operator1`, password: `operator123`
- **Supervisor**: username: `supervisor1`, password: `supervisor123`

## Troubleshooting

### Error: Access denied for user 'root'@'localhost'
- Update `DB_PASSWORD` in `server/.env` with your MySQL password

### Error: Database connection failed
- Make sure MySQL service is running
- Check if port 3306 is available
- Verify credentials in `server/.env`

### Error: Port 5000 already in use
- Change `PORT` in `server/.env` to another port (e.g., 5001)

### Error: Port 5173 already in use
- The frontend will automatically try the next available port

## Testing the Application

### As Operator:
1. Login with operator1 / operator123
2. Create a new POP test report
3. View your reports
4. See pending/approved status

### As Supervisor:
1. Login with supervisor1 / supervisor123
2. View all reports
3. Approve or reject pending reports

### As Admin:
1. Login with admin / admin123
2. Manage users (add, edit, delete)
3. View all reports
4. Approve or reject reports

## Features to Test

✅ User Authentication
✅ Role-based Dashboards
✅ Create Test Reports (Operator)
✅ View Reports (All roles)
✅ Approve/Reject Reports (Admin/Supervisor)
✅ User Management (Admin)
✅ Responsive Design (try on mobile)

## Next Steps

After successful setup, you can:
1. Customize the company names
2. Add more users
3. Create test reports
4. Explore the dashboard statistics
5. Test the approval workflow

Enjoy using the Valve Test Suite! 🔧

