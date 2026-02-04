# PARAKH Backend API

Backend API for the PARAKH adaptive assessment system, built with Node.js, Express, and MongoDB.

## Features

- **Authentication & Authorization**: JWT-based authentication with role-based access control
- **User Management**: Complete user CRUD operations with academic tracking
- **Question Bank**: Comprehensive question management system
- **Assessments**: Dynamic assessment creation and management
- **Adaptive Testing**: AI-driven adaptive assessment engine
- **Analytics & Reports**: Detailed performance analytics and reporting
- **RESTful API**: Clean, well-documented REST API endpoints

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: bcryptjs, helmet, CORS, rate limiting
- **Validation**: express-validator
- **Logging**: morgan
- **Development**: nodemon

## Installation

### Prerequisites

- Node.js 18.0.0 or higher
- MongoDB 4.4 or higher
- npm or yarn

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd parakh-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/parakh
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_EXPIRES_IN=7d
   CORS_ORIGIN=http://localhost:5173
   ```

4. **Database Setup**
   - Ensure MongoDB is running
   - Run database migration: `npm run migrate`
   - Seed with sample data: `npm run seed`

5. **Start the server**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication

All protected routes require a valid JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Available Endpoints

#### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/auth/forgot-password` - Password reset request
- `POST /api/auth/reset-password` - Password reset
- `POST /api/auth/change-password` - Change password
- `GET /api/auth/me` - Get current user

#### Users
- `GET /api/users` - Get all users (Admin only)
- `GET /api/users/stats` - Get user statistics (Admin only)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user (Admin only)
- `PUT /api/users/:id/role` - Update user role (Admin only)
- `PUT /api/users/:id/status` - Update user status (Admin only)
- `GET /api/users/:id/academic` - Get user academic data
- `PUT /api/users/:id/academic` - Update user academic data
- `GET /api/users/:id/settings` - Get user settings
- `PUT /api/users/:id/settings` - Update user settings

#### Questions
- `GET /api/questions` - Get all questions
- `GET /api/questions/stats` - Get question statistics
- `GET /api/questions/:id` - Get question by ID
- `POST /api/questions` - Create new question
- `PUT /api/questions/:id` - Update question
- `DELETE /api/questions/:id` - Delete question
- `PUT /api/questions/:id/status` - Update question status
- `GET /api/questions/random/:count` - Get random questions

#### Assessments
- `GET /api/assessments` - Get all assessments
- `GET /api/assessments/stats` - Get assessment statistics
- `GET /api/assessments/:id` - Get assessment by ID
- `POST /api/assessments` - Create new assessment
- `PUT /api/assessments/:id` - Update assessment
- `DELETE /api/assessments/:id` - Delete assessment
- `PUT /api/assessments/:id/status` - Update assessment status
- `POST /api/assessments/:id/questions` - Add question to assessment
- `DELETE /api/assessments/:id/questions/:questionId` - Remove question from assessment
- `POST /api/assessments/:id/start` - Start assessment
- `GET /api/assessments/:id/attempt` - Get current attempt
- `PUT /api/assessments/:id/attempt` - Update attempt progress
- `POST /api/assessments/:id/complete` - Complete assessment

#### Reports
- `GET /api/reports/user/:userId` - Get user performance report
- `GET /api/reports/class/:teacherId` - Get class performance report
- `GET /api/reports/assessment/:assessmentId` - Get assessment analytics
- `GET /api/reports/subject/:subject` - Get subject performance report
- `GET /api/reports/system` - Get system-wide analytics (Admin only)
- `GET /api/reports/export/:userId` - Export user report

## User Roles

### Student
- Take assessments
- View personal results and analytics
- Access learning recommendations
- Update personal settings

### Teacher
- Create and manage questions
- Create and manage assessments
- View student performance reports
- Generate class analytics
- Manage their students

### Admin
- Full system access
- User management (CRUD operations)
- System monitoring and statistics
- Database management

## Database Models

### User
- Authentication and profile data
- Academic performance tracking
- Role-based permissions
- Security settings

### Question
- Question content and metadata
- Multiple question types support
- Difficulty levels and topics
- Usage statistics

### Assessment
- Assessment configuration
- Question associations
- Settings and constraints
- Usage tracking

### Attempt
- Assessment attempt tracking
- User responses and scores
- Time tracking
- Analytics data

## Security Features

- **Password Hashing**: bcrypt with configurable rounds
- **JWT Authentication**: Secure token-based authentication
- **Rate Limiting**: Protection against brute force attacks
- **Input Validation**: Comprehensive request validation
- **CORS**: Cross-origin resource sharing configuration
- **Helmet**: Security headers middleware
- **Account Locking**: Protection against repeated failed login attempts

## Development

### Scripts

```bash
npm run dev          # Start development server with nodemon
npm start           # Start production server
npm test            # Run tests
npm run seed        # Seed database with sample data
npm run migrate     # Run database migrations
```

### Code Style

The project uses ESLint for code linting. Configure your editor to use the project's ESLint configuration.

### Testing

Tests are written using Jest and Supertest. Add tests to the `__tests__` directory.

## Deployment

### Environment Variables

Required environment variables for production:

```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/parakh
JWT_SECRET=your-production-secret-key
CORS_ORIGIN=https://your-frontend-domain.com
```

### Production Considerations

- Use a production MongoDB cluster (Atlas recommended)
- Set strong JWT secrets
- Configure proper CORS origins
- Enable HTTPS
- Set up monitoring and logging
- Use a process manager (PM2 recommended)

## API Response Format

All API responses follow a consistent format:

```json
{
  "success": true|false,
  "message": "Response message",
  "data": { /* response data */ },
  "errors": [ /* validation errors */ ]
}
```

## Error Handling

The API provides detailed error responses:

```json
{
  "success": false,
  "error": "Error message",
  "details": { /* additional error details */ }
}
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For support and questions:
- Create an issue in the repository
- Contact the development team