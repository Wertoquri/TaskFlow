-- Додавання полів для підтвердження email
ALTER TABLE users 
ADD COLUMN is_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN verification_code VARCHAR(6),
ADD COLUMN code_expiry DATETIME;

-- Оновлення існуючих користувачів як підтверджених
UPDATE users SET is_verified = TRUE WHERE is_verified IS NULL;
