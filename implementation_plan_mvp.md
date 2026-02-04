# Parakh Portal MVP Implementation Plan

## Goal
Complete a fully working MVP focusing on Student Exam Flow, Adaptive Assessment, Dashboards, and basic Security.

## Part 1: Backend (Spring Boot)

### 1. Domain Models Update
- [ ] **Question**: Add `topic`, `usageCount`.
- [ ] **Exam**: New entity to track session (Student, StartTime, Status).
- [ ] **StudentResponse**: New entity to track individual answers (Question, Answer, TimeTaken, IsCorrect).
- [ ] **Result**: New entity for final score and insights.

### 2. Services & Logic
- [ ] **QuestionService**: Add method to `findNextQuestion(currentDifficulty, previousPerformance)`.
- [ ] **ExamService**:
    - `startExam(studentId, subject)`
    - `submitAnswer(examId, questionId, answer)` -> Updates adaptive state, returns next question.
    - `finishExam(examId)` -> Generates Result.
- [ ] **AdaptiveEngine**: Implement the rule-based logic (inc/dec difficulty).

### 3. API Endpoints (ExamController)
- [ ] `POST /api/exam/start`: Init session.
- [ ] `POST /api/exam/submit-answer`: Handle response, return next Q.
- [ ] `GET /api/exam/{id}/result`: Get final stats.

### 4. Security
- [ ] Add Spring Security & JWT dependencies.
- [ ] Implement `JwtUtil` and `JwtAuthFilter`.
- [ ] Secure `/api/**` endpoints.

## Part 2: Frontend (React)

### 1. Student Exam Interface (`Exam.jsx`)
- [ ] Refactor from static list fetch to **Server-Driven Question Flow**.
- [ ] **Start**: Call start endpoint.
- [ ] **Progress**: Display one question at a time.
- [ ] **Submit**: Send answer to backend, await next question.
- [ ] **features**: Timer, Tab-switch detection (Proctoring).

### 2. Dashboard (`Dashboard.jsx`)
- [ ] Fetch real "Previous Score" and "Exam Status".
- [ ] "Start Exam" button links to the actual flow.

## Part 3: Data & Config
- [ ] Seed dummy data for Questions (Subject-wise, Difficulty-wise) to test adaptive logic.
