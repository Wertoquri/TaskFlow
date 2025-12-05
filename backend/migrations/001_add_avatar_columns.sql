-- migration: add avatar columns to users
-- Adds two nullable columns `avatar` and `avatar_url` (both varchar(255)).
-- Run this using your migration runner or run directly in MySQL.

ALTER TABLE `users`
  ADD COLUMN `avatar` VARCHAR(255) NULL DEFAULT NULL,
  ADD COLUMN `avatar_url` VARCHAR(255) NULL DEFAULT NULL;

-- Optional: create index if you query by avatar (not usually needed)
-- CREATE INDEX idx_users_avatar ON `users` (`avatar`(128));
