import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import Login from '../auth/Login';
import Register from '../auth/Register';

// Student
import StudentDashboard from '../student/Dashboard';
import ExamInterface from '../student/ExamInterface';
import StudentResult from '../student/Result';
import AcademicProfile from '../student/AcademicProfile';
import CompetencyTranscript from '../student/CompetencyTranscript';
import ProgressTimeline from '../student/ProgressTimeline';
import NotificationsCenter from '../student/NotificationsCenter';
import ReassessmentGate from '../student/ReassessmentGate';

// Teacher
import TeacherDashboard from '../teacher/Dashboard';
import TeacherQuestionManager from '../teacher/QuestionManager';
import TeacherReports from '../teacher/Reports';

// Admin
import AdminDashboard from '../admin/Dashboard';
import AdminUserManager from '../admin/UserManager';
import AdminSystemStats from '../admin/SystemStats';

const AppRoutes = () => {
  return (
    <Routes>
      {/* ── Public ─────────────────────────────────────────── */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* ── Student ────────────────────────────────────────── */}
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
            {/* Wrap with gate, allowRemedial=true so the exam still loads but shows banner */}
            <ReassessmentGate allowRemedial={true}>
              <ExamInterface />
            </ReassessmentGate>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/result/:examId?"
        element={
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <StudentResult />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/profile"
        element={
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <AcademicProfile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/competency"
        element={
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <CompetencyTranscript />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/timeline"
        element={
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <ProgressTimeline />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/notifications"
        element={
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <NotificationsCenter />
          </ProtectedRoute>
        }
      />

      {/* ── Teacher ────────────────────────────────────────── */}
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

      {/* ── Admin ──────────────────────────────────────────── */}
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

      {/* ── Default / Catch-all ─────────────────────────────── */}
      <Route path="/" element={<Login />} />
      <Route path="*" element={<Login />} />
    </Routes>
  );
};

export default AppRoutes;