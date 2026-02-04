import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import Login from '../auth/Login';
import Register from '../auth/Register';
import StudentDashboard from '../student/Dashboard';
import ExamInterface from '../student/ExamInterface';
import StudentResult from '../student/Result';
import TeacherDashboard from '../teacher/Dashboard';
import TeacherQuestionManager from '../teacher/QuestionManager';
import TeacherReports from '../teacher/Reports';
import AdminDashboard from '../admin/Dashboard';
import AdminUserManager from '../admin/UserManager';
import AdminSystemStats from '../admin/SystemStats';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected Routes for Students */}
      <Route
        path="/student/dashboard"
        element={
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <StudentDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/exam/:examId"
        element={
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <ExamInterface />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/result"
        element={
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <StudentResult />
          </ProtectedRoute>
        }
      />

      {/* Protected Routes for Teachers */}
      <Route
        path="/teacher/dashboard"
        element={
          <ProtectedRoute allowedRoles={['TEACHER']}>
            <TeacherDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/questions"
        element={
          <ProtectedRoute allowedRoles={['TEACHER']}>
            <TeacherQuestionManager />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/reports"
        element={
          <ProtectedRoute allowedRoles={['TEACHER']}>
            <TeacherReports />
          </ProtectedRoute>
        }
      />

      {/* Protected Routes for Admins */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminUserManager />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/stats"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminSystemStats />
          </ProtectedRoute>
        }
      />

      {/* Default Redirects */}
      <Route path="/" element={<Login />} />

      {/* Catch all other routes and redirect to login */}
      <Route path="*" element={<Login />} />
    </Routes>
  );
};

export default AppRoutes;