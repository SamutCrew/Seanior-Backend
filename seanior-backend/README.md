# Seanior Backend

<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

## 📝 Description

This backend API powers the 'Online Platform for Connecting Learners with Swimming Instructors.' It provides the core services for user management, course and booking administration, payment processing, and data storage. Built with NestJS and PostgreSQL, this API is designed to address the unreliability of existing online channels by offering a secure and centralized system. It serves as the backbone for [seanior-frontend](https://github.com/SamutCrew/Seanior-Frontend/tree/main/samut), ensuring a reliable and convenient connection between swimming learners and instructors.

## 🚀 Features

- **User Management**: Handle student and instructor accounts
- **Course Management**: Create and manage swimming courses
- **Attendance Tracking**: Monitor student attendance
- **Instructor Requests**: Handle instructor applications and management
- **Payment Processing**: Integrated with Stripe for secure payments
- **Notifications**: System for important updates and alerts
- **Resource Management**: Handle course materials and resources

## 🛠 Prerequisites

- Node.js (v16 or later)
- npm or yarn
- PostgreSQL database
- Prisma ORM
- Firebase Admin SDK credentials (for authentication)
- Stripe API keys (for payment processing)
- Azure Blob Storage (for file storage)

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/seanior-backend.git
   cd seanior-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory based on the `.env.example` file and fill in the required values.

4. **Set up the database**
   ```bash
   # Apply database migrations
   npx prisma migrate dev
   
   # Generate Prisma Client
   npx prisma generate
   ```

## 🏃‍♂️ Running the App

```bash
# Development mode with watch
$ npm run start:dev

# Production build
$ npm run build
$ npm run start:prod

# Development server
$ npm run start
```

## 🔧 Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# App
FRONTEND_URL=your_frontend_url
SERVER_PORT=your_server_port

# Database
DATABASE_URL=your_database_url

# Firebase
FIREBASE_SERVICE_ACCOUNT_KEY=your_firebase_service_account_key

# Azure Storage
AZURE_STORAGE_CONNECTION_STRING=your_azure_connection_string

# Stripe
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret
SUCCESS_URL=your_success_url
CANCEL_URL=your_cancel_url
```

## 📚 API Documentation

After starting the application, the API documentation will be available at:
- Swagger UI: `http://your_api_url/api`

## 🙏 Acknowledgments

- [NestJS](https://nestjs.com/)
- [Prisma](https://www.prisma.io/)
- [Stripe](https://stripe.com/)
- [Firebase](https://firebase.google.com/)
- [Azure Blob Storage](https://azure.microsoft.com/en-us/services/storage/blobs/)
```
