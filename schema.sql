-- Class Booking System - Database Schema
-- Run this manually if you prefer explicit migrations over TypeORM synchronize

CREATE DATABASE IF NOT EXISTS class_booking CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE class_booking;

-- Users (teachers and parents)
CREATE TABLE IF NOT EXISTS users (
  id         VARCHAR(36)  NOT NULL PRIMARY KEY,
  name       VARCHAR(255) NOT NULL,
  email      VARCHAR(255) NOT NULL UNIQUE,
  password   VARCHAR(255) NOT NULL,
  role       ENUM('teacher', 'parent') NOT NULL,
  timezone   VARCHAR(100) NOT NULL DEFAULT 'UTC',
  createdAt  DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  INDEX idx_users_email (email),
  INDEX idx_users_role  (role)
) ENGINE=InnoDB;

-- Courses
CREATE TABLE IF NOT EXISTS courses (
  id          VARCHAR(36)  NOT NULL PRIMARY KEY,
  title       VARCHAR(255) NOT NULL,
  description TEXT,
  teacherId   VARCHAR(36)  NOT NULL,
  createdAt   DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updatedAt   DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  CONSTRAINT fk_courses_teacher FOREIGN KEY (teacherId) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_courses_teacher (teacherId)
) ENGINE=InnoDB;

-- Offerings (sections of a course)
CREATE TABLE IF NOT EXISTS offerings (
  id              VARCHAR(36)  NOT NULL PRIMARY KEY,
  name            VARCHAR(255) NOT NULL,
  description     TEXT,
  courseId        VARCHAR(36)  NOT NULL,
  teacherId       VARCHAR(36)  NOT NULL,
  teacherTimezone VARCHAR(100) NOT NULL DEFAULT 'UTC',
  createdAt       DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updatedAt       DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  CONSTRAINT fk_offerings_course  FOREIGN KEY (courseId)  REFERENCES courses(id) ON DELETE CASCADE,
  CONSTRAINT fk_offerings_teacher FOREIGN KEY (teacherId) REFERENCES users(id)   ON DELETE CASCADE,
  INDEX idx_offerings_course  (courseId),
  INDEX idx_offerings_teacher (teacherId)
) ENGINE=InnoDB;

-- Sessions (individual time slots belonging to an offering)
-- All times stored in UTC
CREATE TABLE IF NOT EXISTS sessions (
  id         VARCHAR(36) NOT NULL PRIMARY KEY,
  offeringId VARCHAR(36) NOT NULL,
  teacherId  VARCHAR(36) NOT NULL,
  startTime  DATETIME    NOT NULL COMMENT 'UTC',
  endTime    DATETIME    NOT NULL COMMENT 'UTC',
  createdAt  DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  CONSTRAINT fk_sessions_offering FOREIGN KEY (offeringId) REFERENCES offerings(id) ON DELETE CASCADE,
  CONSTRAINT fk_sessions_teacher  FOREIGN KEY (teacherId)  REFERENCES users(id)     ON DELETE CASCADE,
  INDEX idx_sessions_offering  (offeringId),
  -- Composite index used by conflict detection query
  INDEX idx_sessions_time      (offeringId, startTime, endTime)
) ENGINE=InnoDB;

-- Bookings (parent books an entire offering)
CREATE TABLE IF NOT EXISTS bookings (
  id         VARCHAR(36)                       NOT NULL PRIMARY KEY,
  parentId   VARCHAR(36)                       NOT NULL,
  offeringId VARCHAR(36)                       NOT NULL,
  status     ENUM('confirmed', 'cancelled')    NOT NULL DEFAULT 'confirmed',
  bookedAt   DATETIME(6)                       NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  CONSTRAINT fk_bookings_parent   FOREIGN KEY (parentId)   REFERENCES users(id)     ON DELETE CASCADE,
  CONSTRAINT fk_bookings_offering FOREIGN KEY (offeringId) REFERENCES offerings(id) ON DELETE CASCADE,
  -- Prevents duplicate confirmed booking for same parent+offering
  UNIQUE KEY uq_booking_parent_offering (parentId, offeringId),
  INDEX idx_bookings_parent   (parentId),
  INDEX idx_bookings_offering (offeringId),
  INDEX idx_bookings_status   (status)
) ENGINE=InnoDB;
