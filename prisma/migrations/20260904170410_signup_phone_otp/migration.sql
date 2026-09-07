-- AlterTable
ALTER TABLE `users` ADD COLUMN `phone` VARCHAR(191) NULL,
    ADD COLUMN `phoneVerifiedAt` DATETIME(3) NULL;

-- CreateTable
CREATE TABLE `pending_registrations` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `codeHash` VARCHAR(191) NOT NULL,
    `attempts` INTEGER NOT NULL DEFAULT 0,
    `expiresAt` DATETIME(3) NOT NULL,
    `lastSentAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `invitationToken` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `pending_registrations_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
