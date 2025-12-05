-- migration: add nickname column to users
-- Adds a nullable `nickname` column to the users table

ALTER TABLE `users`
  ADD COLUMN `nickname` VARCHAR(100) NULL DEFAULT NULL;
