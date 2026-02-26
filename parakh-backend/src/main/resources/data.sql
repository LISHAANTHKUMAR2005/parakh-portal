-- Initial Admin Account for PARAKH System
-- Password: admin123 (BCrypt encoded)
INSERT INTO users (email, name, password, role, institution, status, created_at, updated_at) 
VALUES ('admin@parakh.gov.in', 'System Administrator', '$2a$12$W0U0GpMwkI6Fapy4j6l4qOvnPPyrN3cUac9wahJ9OIR1rDzsnZ9S6', 'ADMIN', 'PARAKH National Assessment Centre', 'APPROVED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- System Configurations
INSERT INTO system_config (config_key, config_value, description) VALUES ('REGISTRATION_ENABLED', 'true', 'Enable/Disable new user registrations');
INSERT INTO system_config (config_key, config_value, description) VALUES ('MAINTENANCE_MODE', 'false', 'Enable/Disable system maintenance mode');
INSERT INTO system_config (config_key, config_value, description) VALUES ('TEACHER_CREATE_QUESTIONS', 'true', 'Enable/Disable teacher question creation');
INSERT INTO system_config (config_key, config_value, description) VALUES ('AI_PROCTORING_ENABLED', 'true', 'Enable/Disable AI Proctoring');
INSERT INTO system_config (config_key, config_value, description) VALUES ('SECURE_BROWSER_MODE', 'true', 'Enable/Disable Secure Browser Mode');
INSERT INTO system_config (config_key, config_value, description) VALUES ('REMEDIAL_MODE_ENFORCED', 'true', 'Enable/Disable Remedial Mode Enforcement');
INSERT INTO system_config (config_key, config_value, description) VALUES ('SYSTEM_NOTICE_ENABLED', 'true', 'Enable system-wide announcements');
INSERT INTO system_config (config_key, config_value, description) VALUES ('SYSTEM_NOTICE_TITLE', 'Demo Session Active', 'Title for broadcast');
INSERT INTO system_config (config_key, config_value, description) VALUES ('SYSTEM_NOTICE_MESSAGE', 'Welcome to the PARAKH implementation demo. This portal is configured for real-time adaptive testing.', 'Message for broadcast');
INSERT INTO system_config (config_key, config_value, description) VALUES ('SYSTEM_NOTICE_PRIORITY', 'HIGH', 'Urgency level of notice');
INSERT INTO system_config (config_key, config_value, description) VALUES ('DEMO_MODE_ENABLED', 'true', 'Enable stable demo mode for presentations');

-- Demo Teacher (Password: password)
INSERT INTO users (id, email, name, password, role, institution, status, created_at, updated_at) 
VALUES (2, 'teacher@test.com', 'Dr. Demo Teacher', '$2a$10$wT5X/m2.2B6MIPId0O/T3.T.0N.Q9S.K.w.G.X/C.O.v.K.w.M.G.M.G', 'TEACHER', 'Demo Institute', 'APPROVED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Demo Students (Password: password)
INSERT INTO users (id, email, name, password, role, institution, status, created_at, updated_at) 
VALUES (3, 'student1@test.com', 'High Performer Student', '$2a$10$wT5X/m2.2B6MIPId0O/T3.T.0N.Q9S.K.w.G.X/C.O.v.K.w.M.G.M.G', 'STUDENT', 'Demo Institute', 'APPROVED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO users (id, email, name, password, role, institution, status, created_at, updated_at) 
VALUES (4, 'student2@test.com', 'Medium Performer Student', '$2a$10$wT5X/m2.2B6MIPId0O/T3.T.0N.Q9S.K.w.G.X/C.O.v.K.w.M.G.M.G', 'STUDENT', 'Demo Institute', 'APPROVED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO users (id, email, name, password, role, institution, status, created_at, updated_at) 
VALUES (5, 'student3@test.com', 'Low Performer Student', '$2a$10$wT5X/m2.2B6MIPId0O/T3.T.0N.Q9S.K.w.G.X/C.O.v.K.w.M.G.M.G', 'STUDENT', 'Demo Institute', 'APPROVED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO users (id, email, name, password, role, institution, status, created_at, updated_at) 
VALUES (6, 'student4@test.com', 'Risk Student (Integrity)', '$2a$10$wT5X/m2.2B6MIPId0O/T3.T.0N.Q9S.K.w.G.X/C.O.v.K.w.M.G.M.G', 'STUDENT', 'Demo Institute', 'APPROVED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO users (id, email, name, password, role, institution, status, created_at, updated_at) 
VALUES (7, 'student5@test.com', 'Moderate Student', '$2a$10$wT5X/m2.2B6MIPId0O/T3.T.0N.Q9S.K.w.G.X/C.O.v.K.w.M.G.M.G', 'STUDENT', 'Demo Institute', 'APPROVED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Demo Classroom
INSERT INTO classrooms (id, name, subject, description, teacher_id, institution_id, created_at)
VALUES (1, 'Demo Class A', 'Mathematics', 'Presentation Classroom for Interview Demo', 2, 1, CURRENT_TIMESTAMP);

-- Enroll Students
INSERT INTO class_students (classroom_id, student_id) VALUES (1, 3);
INSERT INTO class_students (classroom_id, student_id) VALUES (1, 4);
INSERT INTO class_students (classroom_id, student_id) VALUES (1, 5);
INSERT INTO class_students (classroom_id, student_id) VALUES (1, 6);
INSERT INTO class_students (classroom_id, student_id) VALUES (1, 7);

-- Demo Adaptive Assessment
INSERT INTO assessments (id, title, subject, type, duration_minutes, question_count, teacher_id, classroom_id, status, created_at)
VALUES (1, 'Mathematics Adaptive Demo Test', 'Mathematics', 'TOPIC', 20, 15, 2, 1, 'PUBLISHED', CURRENT_TIMESTAMP);
