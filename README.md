# 🔧 Valve Test Suite

A comprehensive web application for managing Pressure Safety Valve (PSV) testing and reporting.

![Valve Test Suite](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![React](https://img.shields.io/badge/React-18+-blue)
![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![MySQL](https://img.shields.io/badge/Database-MySQL-orange)

## 🌟 **Live Demo**

**🚀 Application URL:** [https://yourusername.github.io/valve-test-suite](https://yourusername.github.io/valve-test-suite)

**🧪 Test Credentials:**
- **Operator:** `operator1` / `operator123`
- **Admin:** `admin1` / `admin123`
- **Supervisor:** `supervisor1` / `supervisor123`

## ✨ **Features**

### 🔐 **Authentication & Authorization**
- Multi-role user system (Admin, Operator, Supervisor)
- JWT-based secure authentication
- Role-based access control

### 📋 **POP Test Report Management**
- Create comprehensive POP (Proof of Performance) test reports
- Auto-increment reference numbers (KSE-DDMMYY-XX format)
- Step-by-step guided form with validation
- Auto-fill functionality for valve data

### 🗂️ **Master Data Management**
- Brands, models, materials, IO sizes
- Set pressures and valve serial management
- Dynamic dropdowns with add-new functionality

### 📊 **Dashboard & Navigation**
- Role-specific dashboards
- Multiple navigation options (4 different ways to return to dashboard)
- Responsive design for all devices
- Floating dashboard button for easy access

### 📱 **Modern UI/UX**
- Mobile-responsive design
- Professional interface
- Breadcrumb navigation
- Real-time form validation

## 🏗️ **Technology Stack**

### **Frontend**
- **React 18+** with modern hooks
- **Vite** for fast development and building
- **React Router** for navigation
- **Axios** for API communication
- **Custom CSS** with CSS variables

### **Backend**
- **Node.js** with Express framework
- **MySQL** database with AWS RDS
- **JWT** authentication
- **bcryptjs** for password hashing
- **CORS** enabled for cross-origin requests

### **Deployment**
- **Frontend:** GitHub Pages with GitHub Actions
- **Backend:** Railway (production-grade hosting)
- **Database:** AWS RDS MySQL (production database)
- **SSL/HTTPS:** Enabled on all endpoints

## 🚀 **Getting Started**

### **Prerequisites**
- Node.js (v18 or higher)
- npm or yarn package manager
- Git

### **Local Development**

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/valve-test-suite.git
   cd valve-test-suite
   ```

2. **Install dependencies:**
   ```bash
   # Root dependencies
   npm install

   # Frontend dependencies
   cd client && npm install && cd ..
   ```

3. **Environment setup:**
   ```bash
   # Copy environment template
   cp .env.example .env

   # Edit .env with your database credentials
   ```

4. **Start development servers:**
   ```bash
   # Backend (Terminal 1)
   npm run dev

   # Frontend (Terminal 2)
   npm run client
   ```

5. **Access the application:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000

## 🧪 **Testing**

### **Test Users**
| Role | Username | Password | Permissions |
|------|----------|----------|-------------|
| Admin | admin1 | admin123 | Full access, user management |
| Operator | operator1 | operator123 | Create/view reports |
| Supervisor | supervisor1 | supervisor123 | View all reports, limited admin |

### **Test Scenarios**
1. **Login & Dashboard Navigation**
2. **Create POP Test Report** with auto-fill features
3. **Report Management** (view, delete)
4. **Master Data Management**
5. **Mobile Responsive Testing**

## 🚀 **Deployment**

### **Automatic Deployment**
- **Frontend:** Automatically deployed to GitHub Pages on push to main branch
- **Backend:** Automatically deployed to Railway on push to main branch
- **Database:** AWS RDS MySQL (always online)

### **Manual Deployment**
See `GITHUB_DEPLOYMENT_GUIDE.md` for detailed deployment instructions.

## 🔒 **Security Features**

- ✅ **JWT Authentication** with secure token handling
- ✅ **Password Hashing** with bcryptjs
- ✅ **HTTPS/SSL** on all production endpoints
- ✅ **CORS Configuration** for secure cross-origin requests
- ✅ **Environment Variables** for sensitive data
- ✅ **Input Validation** on all forms
- ✅ **SQL Injection Protection** with parameterized queries

## 📊 **Performance**

- ✅ **Fast Loading** with Vite build optimization
- ✅ **Code Splitting** for efficient bundle sizes
- ✅ **CDN Delivery** via GitHub Pages
- ✅ **Database Optimization** with indexed queries
- ✅ **Responsive Design** for all device sizes

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 **License**

This project is licensed under the ISC License.

## 📞 **Support**

For support, create an issue in this repository.

---

**Built with ❤️ for professional valve testing management**
