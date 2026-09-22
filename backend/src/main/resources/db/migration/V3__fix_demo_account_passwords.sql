-- Demo account credentials are stored as BCrypt hashes only.
UPDATE users
SET password_hash = '$2y$10$vWH5xXCc.0WF.SPVZ.ieT.5t8Mhx5eC5o5fVLRzFg3NfiYf4pyK5m'
WHERE email IN ('admin@webbox.example', 'employee@webbox.example');
