/*
  Warnings:

  - A unique constraint covering the columns `[manageToken]` on the table `bookings` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[rescheduledFromId]` on the table `bookings` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `manageToken` to the `bookings` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `bookings` ADD COLUMN `cancelReason` TEXT NULL,
    ADD COLUMN `cancelledAt` DATETIME(3) NULL,
    ADD COLUMN `cancelledBy` ENUM('HOST', 'ATTENDEE') NULL,
    ADD COLUMN `hostNotes` TEXT NULL,
    ADD COLUMN `manageToken` VARCHAR(191) NOT NULL,
    ADD COLUMN `reminderSentAt` DATETIME(3) NULL,
    ADD COLUMN `rescheduledFromId` VARCHAR(191) NULL,
    MODIFY `status` ENUM('PENDING', 'CONFIRMED', 'CANCELLED') NOT NULL DEFAULT 'CONFIRMED';

-- AlterTable
ALTER TABLE `event_types` ADD COLUMN `requiresConfirmation` BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX `bookings_manageToken_key` ON `bookings`(`manageToken`);

-- CreateIndex
CREATE UNIQUE INDEX `bookings_rescheduledFromId_key` ON `bookings`(`rescheduledFromId`);

-- CreateIndex
CREATE INDEX `bookings_status_startTime_reminderSentAt_idx` ON `bookings`(`status`, `startTime`, `reminderSentAt`);

-- AddForeignKey
ALTER TABLE `bookings` ADD CONSTRAINT `bookings_rescheduledFromId_fkey` FOREIGN KEY (`rescheduledFromId`) REFERENCES `bookings`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
