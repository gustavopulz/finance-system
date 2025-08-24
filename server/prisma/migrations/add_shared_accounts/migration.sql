-- Migration: Add shared_accounts table
CREATE TABLE shared_accounts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  sharedWithUserId INT NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id),
  FOREIGN KEY (sharedWithUserId) REFERENCES users(id)
);
