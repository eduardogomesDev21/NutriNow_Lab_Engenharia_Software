
CREATE TABLE IF NOT EXISTS chat_history (
	id INT AUTO_INCREMENT PRIMARY KEY,
	session_id VARCHAR(255) NOT NULL,
	user_id INT NULL,
	email VARCHAR(255) NULL,
	message_type ENUM('human', 'ai') NOT NULL,
	content TEXT NOT NULL,
	timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
	INDEX idx_session_id (session_id),
	INDEX idx_user_id (user_id),
	INDEX idx_email (email),
	INDEX idx_timestamp (timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;