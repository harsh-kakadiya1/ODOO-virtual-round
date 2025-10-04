# Expense Management System

A comprehensive expense management platform built with MERN stack, designed to streamline expense approval workflows for companies of all sizes.

## 🚀 Features

### Core Functionalities

- **Authentication & User Management**
  - Company registration with auto-created admin user
  - Role-based access control (Employee, Manager, Admin)
  - Multi-level user management

- **Expense Submission**
  - Submit expense claims with categories, amounts, descriptions
  - Multi-currency support with automatic conversion
  - Receipt upload and OCR functionality
  - Personal expense history tracking

- **Approval Workflow**
  - Configurable multi-level approval processes
  - Manager and admin approval capabilities
  - Approval comments and tracking
  - Status-based expense management
  
- **Conditional Approval Flow**
  - Percentage-based approval rules
  - Specific approver requirements
  - Hybrid approval combinations
  - Flexible approval rule configuration

- **Role Permissions**
  - **Admin**: Full system control, user management, approval configuration
  - **Manager**: Team expense oversight, approval/rejection capabilities
  - **Employee**: Expense submission, personal history tracking

## 🛠 Tech Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **bcryptjs** for password hashing
- **express-validator** for input validation

### Frontend
- **React 18** with functional components and hooks
- **React Router** for navigation
- **Tailwind CSS** for styling
- **React Hook Form** for form management
- **Axios** for API communication
- **Lucide React** for icons

### Development Tools
- **Concurrently** for running multiple processes
- **Nodemon** for backend development
- **React Hot Toast** for notifications

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB (v5 or higher)
- MongoDB Compass (recommended for database management)
- npm or yarn package manager

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd expense-management-system
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install all dependencies (server + client)
npm run install-all
```

### 3. Environment Setup

Create a `.env` file in the `server` directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/expense_management

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRE=7d

# Email Configuration (for notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Frontend URL
CLIENT_URL=http://localhost:3000
```

### 4. Start MongoDB

Make sure MongoDB is running on your system:
- Start MongoDB service
- Open MongoDB Compass and connect to `mongodb://localhost:27017`

### 5. Run the Application

```bash
# Development mode (runs both server and client)
npm run dev

# Or run separately:
# Server only
npm run server

# Client only
npm run client
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 📁 Project Structure

```
expense-management-system/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── contexts/       # React contexts (Auth, etc.)
│   │   ├── pages/          # Page components
│   │   ├── utils/          # Utility functions
│   │   └── App.js
│   └── package.json
├── server/                 # Node.js backend
│   ├── config/            # Database configuration
│   ├── middleware/        # Custom middleware
│   ├── models/            # MongoDB models
│   ├── routes/            # API routes
│   ├── index.js           # Server entry point
│   └── package.json
├── package.json           # Root package.json
└── README.md
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new company and admin user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user info

### Users
- `GET /api/users` - Get all users (Admin/Manager)
- `POST /api/users` - Create new user (Admin)
- `PUT /api/users/:id` - Update user (Admin)
- `DELETE /api/users/:id` - Deactivate user (Admin)

### Expenses
- `GET /api/expenses` - Get expenses (role-based filtering)
- `POST /api/expenses` - Create new expense
- `PUT /api/expenses/:id` - Update expense
- `DELETE /api/expenses/:id` - Cancel expense

### Approvals
- `GET /api/approvals/pending` - Get pending approvals
- `POST /api/approvals/:id/approve` - Approve expense
- `POST /api/approvals/:id/reject` - Reject expense

### Companies
- `GET /api/companies` - Get company info
- `PUT /api/companies` - Update company (Admin)
- `PUT /api/companies/settings` - Update settings (Admin)

## 🎯 User Roles & Permissions

### Admin
- Full system access
- Create and manage users
- Configure approval rules
- View all expenses across the company
- Override approvals

### Manager
- Approve/reject expenses for their team
- View team expenses
- Escalate approvals as needed
- Cannot modify user roles

### Employee
- Submit expense claims
- View own expense history
- Track approval status
- Cannot access other users' data

## 🔄 Development Workflow

### For Team Members

1. **Create a new branch** from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Work on your feature** following the existing code patterns

3. **Test your changes**:
   ```bash
   npm run dev
   ```

4. **Commit and push**:
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   git push origin feature/your-feature-name
   ```

5. **Create a pull request** for code review

### Code Style Guidelines

- Use functional components with hooks
- Follow existing naming conventions
- Add proper error handling
- Include loading states for async operations
- Use Tailwind CSS for styling
- Write meaningful commit messages

## 🧪 Testing

```bash
# Run backend tests
cd server && npm test

# Run frontend tests
cd client && npm test
```

## 📦 Deployment

### Production Build

```bash
# Build the React app
npm run build

# Start production server
npm start
```

### Environment Variables for Production

Set the following environment variables:
- `NODE_ENV=production`
- `MONGODB_URI=your-production-mongodb-uri`
- `JWT_SECRET=your-production-jwt-secret`

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Check the existing issues
- Create a new issue with detailed description
- Contact the development team

## 🔮 Roadmap

### Phase 1 (Current)
- ✅ Basic authentication and user management
- ✅ Core expense submission functionality
- ✅ Basic approval workflow
- ✅ Responsive UI foundation

### Phase 2 (Next)
- 🔄 Complete expense form implementation
- 🔄 Receipt OCR integration
- 🔄 Advanced approval rules
- 🔄 Email notifications
- 🔄 Dashboard analytics

### Phase 3 (Future)
- 📊 Advanced reporting and analytics
- 🔔 Real-time notifications
- 📱 Mobile app
- 🔗 Third-party integrations
- 🌐 Multi-tenant support

---

**Happy Coding! 🚀**
