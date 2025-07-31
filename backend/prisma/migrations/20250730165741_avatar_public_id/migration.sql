/*
  Warnings:

  - Added the required column `public_id` to the `Avatar` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Avatar` ADD COLUMN `public_id` VARCHAR(191) NOT NULL;
