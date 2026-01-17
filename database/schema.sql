-- Create database
CREATE DATABASE IF NOT EXISTS velion_dkn;
USE velion_dkn;

CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  department VARCHAR(100),
  region VARCHAR(100),
  expertise TEXT,
  role VARCHAR(100) DEFAULT 'Consultant',
  is_reviewer BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_department (department),
  INDEX idx_region (region)
);

CREATE TABLE IF NOT EXISTS documents (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size INT,
  tags VARCHAR(500),
  department VARCHAR(100),
  region VARCHAR(100),
  project_type VARCHAR(100),
  uploader_id INT NOT NULL,
  upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  download_count INT DEFAULT 0,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  reviewed_by INT,
  reviewed_at TIMESTAMP NULL,
  review_comment TEXT,
  FOREIGN KEY (uploader_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_uploader (uploader_id),
  INDEX idx_department (department),
  INDEX idx_region (region),
  INDEX idx_tags (tags),
  INDEX idx_status (status),
  FULLTEXT INDEX idx_search (title, description, tags)
);

CREATE TABLE IF NOT EXISTS downloads (
  id INT PRIMARY KEY AUTO_INCREMENT,
  document_id INT NOT NULL,
  user_id INT NOT NULL,
  download_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_document (document_id),
  INDEX idx_user (user_id)
);

INSERT INTO users (name, email, password, department, region, expertise, role, is_reviewer) VALUES
('Admin User', 'admin@velion.com', '$2a$10$rI3qJYGLPqKqQvqQZqQGOeJ3xJ5xJ5xJ5xJ5xJ5xJ5xJ5xJ5xJ5xJ', 'IT', 'Europe', 'Digital Transformation, Cloud Architecture', 'Manager', TRUE)
