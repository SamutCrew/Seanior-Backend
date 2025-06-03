# Seanior Backend

<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

## 📝 Description

Seanior is a comprehensive backend system for managing a swimming school, built with [NestJS](https://nestjs.com/). It provides APIs for user management, course scheduling, attendance tracking, instructor management, and payment processing.

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
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/seanior_db"

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=1d

# Firebase
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY=your_private_key
FIREBASE_CLIENT_EMAIL=your_client_email

# Stripe
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret

# Azure Storage
AZURE_STORAGE_CONNECTION_STRING=your_azure_connection_string
AZURE_STORAGE_CONTAINER=your_container_name
```

## 🧪 Testing

```bash
# Unit tests
$ npm run test

# E2E tests
$ npm run test:e2e

# Test coverage
$ npm run test:cov
```

## 📚 API Documentation

After starting the application, the API documentation will be available at:
- Swagger UI: `http://localhost:3000/api`
- JSON: `http://localhost:3000/api-json`

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [NestJS](https://nestjs.com/)
- [Prisma](https://www.prisma.io/)
- [Stripe](https://stripe.com/)
- [Firebase](https://firebase.google.com/)
- [Azure Blob Storage](https://azure.microsoft.com/en-us/services/storage/blobs/)

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
