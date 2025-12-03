-- Migration: Add updated_at column to projects table
-- Run this manually in your MySQL client or via command line

ALTER TABLE projects 
ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at;
