-- GoalQuest Database Schema
-- AWS RDS MySQL Database

CREATE DATABASE IF NOT EXISTS goalquest_db;
USE goalquest_db;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    total_points INT DEFAULT 0,
    level INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Groups table
CREATE TABLE IF NOT EXISTS groups (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    group_code VARCHAR(10) UNIQUE NOT NULL,
    created_by INT NOT NULL,
    member_count INT DEFAULT 1,
    total_points INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Group members table
CREATE TABLE IF NOT EXISTS group_members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    group_id INT NOT NULL,
    user_id INT NOT NULL,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_membership (group_id, user_id)
);

-- Goals table
CREATE TABLE IF NOT EXISTS goals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    group_id INT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    goal_type ENUM('work', 'study', 'fitness', 'personal', 'location') NOT NULL,
    duration ENUM('daily', 'weekly', 'monthly', 'custom') NOT NULL,
    target_value INT DEFAULT 1,
    current_value INT DEFAULT 0,
    requires_photo BOOLEAN DEFAULT FALSE,
    location_lat DECIMAL(10, 8) NULL,
    location_lng DECIMAL(11, 8) NULL,
    location_name VARCHAR(255) NULL,
    points_per_completion INT DEFAULT 10,
    status ENUM('active', 'completed', 'paused', 'cancelled') DEFAULT 'active',
    start_date DATE NOT NULL,
    end_date DATE NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE SET NULL
);

-- Goal completions table
CREATE TABLE IF NOT EXISTS goal_completions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    goal_id INT NOT NULL,
    user_id INT NOT NULL,
    completion_date DATE NOT NULL,
    photo_url VARCHAR(500) NULL,
    location_lat DECIMAL(10, 8) NULL,
    location_lng DECIMAL(11, 8) NULL,
    notes TEXT,
    points_earned INT DEFAULT 10,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Achievements table
CREATE TABLE IF NOT EXISTS achievements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    achievement_type VARCHAR(50) NOT NULL,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    points_awarded INT DEFAULT 0,
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Insert sample data
INSERT INTO users (username, email, password, full_name, total_points, level) VALUES
('john_doe', 'john@example.com', '$2a$10$example_hash', 'John Doe', 1250, 5),
('jane_smith', 'jane@example.com', '$2a$10$example_hash', 'Jane Smith', 980, 4),
('mike_johnson', 'mike@example.com', '$2a$10$example_hash', 'Mike Johnson', 750, 3);

INSERT INTO groups (name, description, group_code, created_by, member_count, total_points) VALUES
('Study Squad', 'Focused on academic goals and learning', 'STUDY1', 1, 6, 4200),
('Fitness Warriors', 'Health and fitness enthusiasts', 'FIT1', 2, 5, 3800),
('Work Productivity', 'Professional development and career goals', 'WORK1', 3, 4, 3200);

INSERT INTO goals (user_id, title, description, goal_type, duration, target_value, points_per_completion, status) VALUES
(1, 'Complete Work Project', 'Finish the quarterly project by Friday', 'work', 'weekly', 1, 50, 'active'),
(2, 'Study 2 Hours Daily', 'Consistent daily study routine', 'study', 'daily', 7, 10, 'active'),
(3, 'Exercise 30 Minutes', 'Daily workout routine', 'fitness', 'daily', 5, 15, 'active');

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_goals_user_id ON goals(user_id);
CREATE INDEX idx_goals_status ON goals(status);
CREATE INDEX idx_goal_completions_user_id ON goal_completions(user_id);
CREATE INDEX idx_goal_completions_date ON goal_completions(completion_date);
CREATE INDEX idx_groups_code ON groups(group_code);
CREATE INDEX idx_group_members_user_id ON group_members(user_id);
CREATE INDEX idx_group_members_group_id ON group_members(group_id);
