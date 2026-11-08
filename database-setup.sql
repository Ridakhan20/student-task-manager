-- Run these commands as a PostgreSQL administrator.
-- Replace the password with a strong, unique password.
CREATE USER taskapp_user WITH PASSWORD 'REPLACE_WITH_A_STRONG_PASSWORD';
CREATE DATABASE student_tasks OWNER taskapp_user;
