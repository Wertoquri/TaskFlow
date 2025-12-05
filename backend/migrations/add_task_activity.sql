-- Migration: create task_activity table

CREATE TABLE IF NOT EXISTS task_activity (
  id INT AUTO_INCREMENT PRIMARY KEY,
  task_id INT NOT NULL,
  user_id INT NOT NULL,
  `type` VARCHAR(64) NOT NULL,
  metadata JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX (task_id),
  INDEX (user_id),
  CONSTRAINT fk_task_activity_task FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

-- Optionally add any initial data or indexes
