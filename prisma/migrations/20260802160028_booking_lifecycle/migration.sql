/*
  Warnings:

  - You are about to drop the column `cancelReason` on the `bookings` table. All the data in the column will be lost.
  - You are about to drop the column `hostNotes` on the `bookings` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX `bookings_status_startTime_reminderSentAt_idx` ON `bookings`;

-- AlterTable
ALTER TABLE `bookings` DROP COLUMN `cancelReason`,
    DROP COLUMN `hostNotes`,
    ADD COLUMN `cancellationReason` TEXT NULL;

-- CreateIndex
CREATE INDEX `bookings_manageToken_idx` ON `bookings`(`manageToken`);
