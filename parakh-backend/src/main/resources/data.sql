-- Initial Admin Account for PARAKH System
-- This account is auto-created on application startup
-- Password: admin123 (BCrypt encoded)

INSERT INTO users (email, name, password, role, institution, status) 
VALUES ('admin@parakh.gov.in', 'System Administrator', '$2a$12$W0U0GpMwkI6Fapy4j6l4qOvnPPyrN3cUac9wahJ9OIR1rDzsnZ9S6', 'ADMIN', 'PARAKH National Assessment Centre', 'APPROVED');

-- You can add more sample data below if needed
-- Example: Sample questions, topics, etc.
