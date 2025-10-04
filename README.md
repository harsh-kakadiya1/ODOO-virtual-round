# Expense Management System

A comprehensive expense management platform built with MERN stack, designed to streamline expense approval workflows for companies of all sizes. Features complete email notification system, automated user credential management, and secure password reset functionality.

## 🚀 Features

### Core Functionalities

- **Authentication & User Management**
  - Company registration with auto-created admin user
  - Role-based access control (Employee, Manager, Admin)
  - Multi-level user management
  - **🆕 Automated credential generation** for new users
  - **🆕 Professional welcome email system** with login credentials
  - **🆕 Secure password reset workflow** with token-based verification
  - **🆕 Forgot password functionality** with email recovery

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

- **🆕 Email Notification System**
  - Professional HTML email templates
  - Gmail SMTP integration with secure authentication
  - Welcome emails with temporary password delivery
  - Password reset emails with secure token verification
  - Real-time email delivery confirmation
  - Comprehensive error handling and logging

- **Role Permissions**
  - **Admin**: Full system control, user management, approval configuration, automated user creation
  - **Manager**: Team expense oversight, approval/rejection capabilities
  - **Employee**: Expense submission, personal history tracking, password management

## 🛠 Tech Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **bcryptjs** for password hashing
- **express-validator** for input validation
- **🆕 Nodemailer** for email delivery with Gmail SMTP
- **🆕 Crypto** for secure token generation
- **🆕 Socket.io** for real-time communication

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

# 🆕 Email Configuration (Required for user management and notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-gmail-app-password
# Note: Use Gmail App Password, not regular password
# Generate at: https://myaccount.google.com/apppasswords

# Frontend URL
CLIENT_URL=http://localhost:3000
```

### 📧 Email Setup Instructions

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
3. **Use the generated 16-character password** in `EMAIL_PASS`
4. **Test email delivery** through the application

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
│   │   │   ├── Auth/      # Authentication pages
│   │   │   │   ├── Login.js
│   │   │   │   ├── Register.js
│   │   │   │   ├── 🆕 ForgotPassword.js
│   │   │   │   └── 🆕 ResetPassword.js
│   │   │   ├── Users/     # User management
│   │   │   └── ...
│   │   ├── utils/          # Utility functions
│   │   └── App.js
│   └── package.json
├── server/                 # Node.js backend
│   ├── config/            # Database configuration
│   ├── middleware/        # Custom middleware
│   ├── models/            # MongoDB models (enhanced User model)
│   ├── routes/            # API routes (enhanced auth & users)
│   ├── utils/             # 🆕 Utility functions
│   │   └── 🆕 emailService.js  # Email service with templates
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
- `PUT /api/auth/change-password` - Change user password
- **🆕** `POST /api/auth/forgot-password` - Request password reset email
- **🆕** `POST /api/auth/reset-password` - Reset password with token

### Users
- `GET /api/users` - Get all users (Admin/Manager)
- **🆕** `POST /api/users` - Create new user with automated email credentials (Admin)
- `PUT /api/users/:id` - Update user (Admin)
- `DELETE /api/users/:id` - Deactivate user (Admin)
- **🆕** `GET /api/users/departments` - Get all departments

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
- **🆕** Create and manage users with automated credential delivery
- Configure approval rules
- View all expenses across the company
- Override approvals
- **🆕** Access to email notification settings and logs

### Manager
- Approve/reject expenses for their team
- View team expenses
- Escalate approvals as needed
- **🆕** Password reset and change capabilities
- Cannot modify user roles

### Employee
- Submit expense claims
- View own expense history
- Track approval status
- **🆕** Self-service password reset functionality
- **🆕** Profile management with password change
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

## 📧 Email System Features

### Welcome Email Automation
- **Automatic credential generation** when creating new users
- **Professional HTML templates** with company branding
- **Secure temporary passwords** delivered via email
- **Real-time delivery confirmation** with error handling

### Password Reset Workflow
- **Self-service password reset** from login page
- **Secure token generation** with SHA-256 hashing
- **Token expiration** (1 hour for security)
- **Email verification** before password reset
- **Success confirmation** and automatic redirect

### Email Service Configuration
- **Gmail SMTP integration** with app password authentication
- **Environment-based configuration** for different deployments
- **Comprehensive error logging** for troubleshooting
- **Connection health monitoring** with automatic retry

## 🔧 Troubleshooting

### Email Issues
```bash
# Check email service connection
# Look for "Email service connected successfully" in server logs
npm run dev

# Test email configuration
# Verify Gmail App Password and 2FA settings
# Check server/utils/emailService.js logs
```

### Common Email Problems
1. **"Invalid login" error**: Use Gmail App Password, not regular password
2. **"Connection timeout"**: Check firewall settings for port 587
3. **"Authentication failed"**: Verify 2FA is enabled and app password is correct
4. **Emails not received**: Check spam folder, verify email address format

### User Creation Issues
```bash
# Department ObjectId errors
# Ensure departments are properly populated
# Check for empty department selection

# Password validation errors
# Verify password field is properly hidden for new users
# Check frontend form validation logic
```

## 🧪 Testing

```bash
# Run backend tests
cd server && npm test

# Run frontend tests
cd client && npm test

# Test email functionality
# 1. Create a new user (admin panel)
# 2. Verify welcome email delivery
# 3. Test forgot password workflow
# 4. Check email logs in server console
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
- **🆕** `EMAIL_HOST=smtp.gmail.com`
- **🆕** `EMAIL_PORT=587`
- **🆕** `EMAIL_USER=your-production-email@gmail.com`
- **🆕** `EMAIL_PASS=your-production-app-password`
- **🆕** `CLIENT_URL=your-production-frontend-url`

### 🚀 Production Deployment Checklist
- ✅ Configure Gmail App Password for email service
- ✅ Test email delivery in staging environment
- ✅ Verify SMTP connection and authentication
- ✅ Set up proper error logging and monitoring
- ✅ Configure CORS settings for production domain
- ✅ Enable HTTPS for secure password reset tokens

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

## 🆕 Recent Updates (Latest Release)

### ✅ Email Notification System
- Complete nodemailer integration with Gmail SMTP
- Professional HTML email templates
- Welcome emails with automatic credential generation
- Password reset workflow with secure token verification
- Real-time email delivery confirmation

### ✅ Enhanced User Management
- Automated temporary password generation
- Streamlined admin user creation interface
- Improved form validation and error handling
- Department display bug fixes

### ✅ Security Improvements
- Secure token-based password reset
- Enhanced password change functionality
- Improved authentication error handling

## 🔮 Roadmap

### Phase 1 ✅ (Completed)
- ✅ Basic authentication and user management
- ✅ Core expense submission functionality
- ✅ Basic approval workflow
- ✅ Responsive UI foundation
- ✅ **Complete email notification system**
- ✅ **Automated user credential management**
- ✅ **Password reset functionality**

### Phase 2 (Next)
- 🔄 Complete expense form implementation
- 🔄 Receipt OCR integration
- 🔄 Advanced approval rules
- 🔄 Dashboard analytics
- 🔄 Email notification customization
- 🔄 Batch user operations

### Phase 3 (Future)
- 📊 Advanced reporting and analytics
- 🔔 Real-time notifications with Socket.io
- 📱 Mobile app
- 🔗 Third-party integrations (Slack, Teams)
- 🌐 Multi-tenant support
- 📧 Advanced email templates and branding

---

**Happy Coding! 🚀**
