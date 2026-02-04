# PARAKH Portal - Authentication System Explained

## 📋 Overview

The PARAKH Portal uses a **JWT-based authentication system** with role-based access control (RBAC). This document explains how everything works together.

---

## 🔐 Authentication Flow

### **Step-by-Step Process:**

```
1. USER Registration (Frontend)
   │
   ├─> User fills registration form
   ├─> Frontend validates input (email format, password strength, etc.)
   ├─> POST /api/auth/register with user data
   │
   └─> BACKEND Registration
       ├─> Validates email uniqueness
       ├─> BCrypt encodes password (10 rounds)
       ├─> Creates User entity with status="APPROVED"
       ├─> Saves to H2 database
       └─> Returns success/error response

2. USER Login (Frontend)
   │
   ├─> User enters email & password
   ├─> Frontend validates input
   ├─> POST /api/auth/login with credentials
   │
   └─> BACKEND Authentication
       ├─> Spring Security loads user by email
       ├─> BCrypt compares hashed passwords
       │   (submitted password vs stored hash)
       ├─> If valid:
       │   ├─> Generates JWT token with:
       │   │   - User ID (subject)
       │   │   - Email (claim)
       │   │   - Role (claim)
       │   │   - Expiration (24 hours)
       │   └─> Signs with secret key
       └─> Returns: { token, userId, name, email, role }

3. FRONTEND Token Storage
   │
   ├─> Saves to localStorage:
   │   ├─> token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   │   └─> user: { id, name, email, role }
   │
   └─> Redirects based on role:
       ├─> ADMIN → /admin/dashboard
       ├─> TEACHER → /teacher/dashboard
       └─> STUDENT → /student/dashboard

4. Protected API Calls
   │
   ├─> Frontend includes JWT in every request:
   │   Authorization: Bearer <token>
   │
   └─> BACKEND JWT Filter
       ├─> Extracts token from header
       ├─> Validates signature & expiration
       ├─> Extracts user details
       ├─> Sets Spring Security Context
       └─> Allows/denies request
```

---

## 🗂️ Why "PR Admin" Was Showing

### **The Problem:**
The Navbar component was rendering user information (`user.name`, `user.role`) on **ALL pages**, including login/register pages where no user should be logged in.

### **The Root Cause:**
```jsx
// In Navbar.jsx (OLD)
{user ? (
  <div>
    <div>{user.name}</div>  // ← This was showing "PR Admin"
    <div>{user.role}</div>   // ← This was showing "ADMIN"
  </div>
) : (
  <Link to="/login">Login</Link>
)}
```

The `user` object was persisting in `localStorage` from a previous session, so even on the login page, it was displaying the old user's info.

### **The Solution:**
We removed the Navbar from login/register pages entirely by:
1. Updating `App.jsx` to exclude MainLayout for auth routes
2. Adding a self-contained government header directly in Login.jsx and Register.jsx

```jsx
// In App.jsx (FIXED)
const isAuthRoute = location.pathname === '/login' || location.pathname === '/register';

if (isAuthRoute) {
  return <AppRoutes />;  // No Navbar!
}
```

---

## ✨ Enhanced Features in Login & Register Pages

### **Login Page (`/login`):**

#### **Features:**
1. **Password Visibility Toggle**
   - Click eye icon to show/hide password
   - Improves usability without compromising security

2. **Real-time Validation**
   - Email format validation (regex)
   - Password length check (min 6 characters)
   - Inline error messages

3. **Field-level Error Display**
   - Errors only show after user touches (blurs) the field
   - Red border highlighting for invalid fields
   - Specific error messages per field

4. **Loading States**
   - Spinner animation during authentication
   - "Authenticating..." text
   - Disabled button to prevent double-submission

5. **Remember Me**
   - Checkbox for persistent login (future enhancement)

6. **Forgot Password Link**
   - Placeholder for password recovery flow

7. **Government Portal Styling**
   - Official header: "Government of India | Ministry of Education"
   - Ashoka Pillar emblem
   - PARAKH branding
   - Footer with NCERT credits

---

### **Register Page (`/register`):**

#### **Features:**
1. **Password Strength Indicator**
   - Visual 5-level strength bar
   - Checks for:
     - Length (≥8 chars)
     - Lowercase letters
     - Uppercase letters
     - Numbers
     - Special characters
   - Labels: "Very Weak" to "Very Strong"

2. **Dual Password Toggles**
   - Separate visibility controls for password & confirm password
   - Independent show/hide state

3. **Password Match Validation**
   - Real-time check if passwords match
   - Error message: "Passwords do not match"

4. **Comprehensive Field Validation**
   - Name: Min 3 characters
   - Email: Valid format
   - Institution: Required
   - Password: Min 6 characters
   - Confirm Password: Must match

5. **Success Screen**
   - Green checkmark animation
   - "Registration Successful!" message
   - Auto-redirect to login (2 seconds)

6. **Role Selection**
   - Dropdown with STUDENT/TEACHER options
   - **ADMIN removed** (security measure)

7. **Responsive Grid Layout**
   - 2-column layout on desktop
   - Single column on mobile
   - Optimized spacing

---

## 🛡️ Security Features

### **1. BCrypt Password Hashing**
```java
// Backend - SecurityConfig.java
@Bean
public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
}

// When storing password:
String hashed = "$2a$10$8cjz47bjbR4Mn8GMg9IZx.vyjhLXR/SKKMSZ9.mP9vpMu0ssKi8GW"
// Instead of plain text: "admin123"
```

**Why BCrypt?**
- Industry standard for password hashing
- Built-in salt (prevents rainbow table attacks)
- Configurable cost factor (10 rounds = 2^10 iterations)
- Slow by design (prevents brute force)

---

### **2. JWT Token Security**
```java
// Backend - JwtService.java
- Secret Key: 256-bit secure random key
- Algorithm: HMAC SHA-256
- Expiration: 24 hours
- Claims: userId, email, role
```

**Why JWT?**
- Stateless (no session storage needed)
- Self-contained (all info in token)
- Cryptographically signed (tamper-proof)
- Industry standard (OAuth 2.0 / OpenID Connect)

---

### **3. CORS Configuration**
```java
// Backend - SecurityConfig.java
.setAllowedOrigins(Arrays.asList("http://localhost:5173"))
.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE"))
.setAllowCredentials(true)
```

**Why CORS?**
- Prevents unauthorized cross-origin requests
- Whitelist trusted frontend origins
- Protects against CSRF attacks

---

### **4. Role-Based Access Control (RBAC)**
```java
// Backend - Controllers
@PreAuthorize("hasRole('ADMIN')")  // Admin only
@PreAuthorize("hasRole('TEACHER')") // Teacher only
@PreAuthorize("hasAnyRole('STUDENT', 'TEACHER')") // Multiple roles
```

**Why RBAC?**
- Principle of least privilege
- Clear separation of concerns
- Easy to audit and manage

---

## 📊 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Login.jsx ───────────────┐                                     │
│  Register.jsx ────────────┤                                     │
│                           │                                     │
│              AuthContext.jsx (Central State Management)         │
│                           │                                     │
│                    localStorage                                 │
│                    ├─> token                                    │
│                    └─> user { id, name, email, role }           │
│                           │                                     │
│   Dashboard Components ──┘                                      │
│   ├─> StudentDashboard.jsx                                      │
│   ├─> TeacherDashboard.jsx                                      │
│   └─> AdminDashboard.jsx                                        │
│                                                                  │
└──────────────────────────┬───────────────────────────────────────┘
                          │
                    HTTP Requests
                    (JWT in Header)
                          │
┌──────────────────────────▼───────────────────────────────────────┐
│                     BACKEND (Spring Boot)                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Controllers (REST API)                                          │
│  ├─> AuthController (/api/auth/*)                               │
│  ├─> StudentController (/api/student/*)                         │
│  ├─> TeacherController (/api/teacher/*)                         │
│  └─> AdminController (/api/admin/*)                             │
│                           │                                     │
│       JwtAuthenticationFilter (Validates JWT)                    │
│                           │                                     │
│       Spring Security (Authorization)                            │
│                           │                                     │
│       Services (Business Logic)                                  │
│  ├─> AuthService                                                │
│  ├─> StudentService                                             │
│  ├─> TeacherService                                             │
│  └─> AdminService                                               │
│                           │                                     │
│       Repositories (Data Access)                                 │
│  ├─> UserRepository                                             │
│  ├─> QuestionRepository                                         │
│  ├─> AssessmentRepository                                       │
│  └─> ExamRepository                                             │
│                           │                                     │
└──────────────────────────┬───────────────────────────────────────┘
                          │
                 ┌─────────▼──────────┐
                 │   H2 Database      │
                 │   (In-Memory)      │
                 │                    │
                 │  Tables:           │
                 │  ├─> users         │
                 │  ├─> questions     │
                 │  ├─> assessments   │
                 │  ├─> exams         │
                 │  └─> ...           │
                 └────────────────────┘
```

---

## 🎨 UI/UX Improvements

### **Visual Enhancements:**
1. ✅ Government-style header (black strip with white text)
2. ✅ Ashoka Pillar emblem with "Satyamev Jayate"
3. ✅ Formal typography (Inter/Roboto, uppercase labels)
4. ✅ Blue color scheme (#0B3C5D - Government Blue)
5. ✅ High contrast for accessibility
6. ✅ Clear visual hierarchy
7. ✅ Footer with official credits

### **Interaction Improvements:**
1. ✅ Password visibility toggles (better UX)
2. ✅ Real-time validation feedback
3. ✅ Loading spinners during async operations
4. ✅ Success/error messages with icons
5. ✅ Disabled states during submission
6. ✅ Keyboard navigation support
7. ✅ Mobile-responsive design

---

## 🚀 Testing Credentials

### **Admin Account:**
```
Email: admin@parakh.gov.in
Password: admin123
```

### **Test Accounts (Create via Register):**
```
Student:
- Name: Priya Sharma
- Email: priya@student.parakh.gov.in
- Password: student123
- Role: STUDENT

Teacher:
- Name: Dr. Rajesh Kumar
- Email: rajesh@teacher.parakh.gov.in
- Password: teacher123
- Role: TEACHER
```

---

## 📝 Summary

The PARAKH portal authentication system is:

1. **Secure**: BCrypt hashing, JWT tokens, CORS protection
2. **User-friendly**: Password toggles, strength indicators, real-time validation
3. **Professional**: Government portal styling, formal UI/UX
4. **Role-based**: ADMIN, TEACHER, STUDENT with different access levels
5. **Stateless**: JWT-based (no server sessions)
6. **Modern**: React + Spring Boot + H2 Database

All authentication pages are now **standalone** (no Navbar) with their own government-style headers, ensuring a clean, professional appearance without any residual user data showing up.

---

**Last Updated:** February 4, 2024
**Version:** 1.0.0
**Author:** PARAKH Development Team
