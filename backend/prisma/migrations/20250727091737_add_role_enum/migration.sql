-- AlterTable
ALTER TABLE `User` ADD COLUMN `role` ENUM('admin', 'author') NOT NULL DEFAULT 'author';
