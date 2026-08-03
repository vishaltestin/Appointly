-- AlterTable
ALTER TABLE `bookings` ADD COLUMN `customerId` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `customers` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `timezone` VARCHAR(191) NULL,
    `notes` TEXT NULL,
    `totalBookings` INTEGER NOT NULL DEFAULT 0,
    `completedBookings` INTEGER NOT NULL DEFAULT 0,
    `cancelledBookings` INTEGER NOT NULL DEFAULT 0,
    `firstBookingAt` DATETIME(3) NULL,
    `lastBookingAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `customers_organizationId_idx`(`organizationId`),
    INDEX `customers_organizationId_name_idx`(`organizationId`, `name`),
    UNIQUE INDEX `customers_organizationId_email_key`(`organizationId`, `email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `bookings_customerId_idx` ON `bookings`(`customerId`);

-- AddForeignKey
ALTER TABLE `bookings` ADD CONSTRAINT `bookings_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `customers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `customers` ADD CONSTRAINT `customers_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
