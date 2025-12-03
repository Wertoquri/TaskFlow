-- Rate limit and attempts columns for email verification flow
ALTER TABLE users 
  ADD COLUMN resend_count INT DEFAULT 0,
  ADD COLUMN resend_reset_at DATETIME NULL,
  ADD COLUMN verify_attempts INT DEFAULT 0,
  ADD COLUMN verify_reset_at DATETIME NULL;
