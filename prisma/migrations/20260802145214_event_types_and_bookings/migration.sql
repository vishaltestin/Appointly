-- CreateTable
CREATE TABLE `event_types` (
    `id` VARCHAR(191) NOT NULL,
    `membershipId` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `durationMinutes` INTEGER NOT NULL DEFAULT 30,
    `color` VARCHAR(191) NOT NULL DEFAULT '#6366f1',
    `locationType` ENUM('IN_PERSON', 'PHONE_CALL', 'ONLINE_MEETING', 'CUSTOM') NOT NULL DEFAULT 'ONLINE_MEETING',
    `locationValue` VARCHAR(191) NULL,
    `scheduleId` VARCHAR(191) NULL,
    `bufferBeforeMinutes` INTEGER NULL,
    `bufferAfterMinutes` INTEGER NULL,
    `minimumNoticeMinutes` INTEGER NOT NULL DEFAULT 120,
    `slotIntervalMinutes` INTEGER NULL,
    `maximumBookingsPerDay` INTEGER NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `event_types_membershipId_idx`(`membershipId`),
    UNIQUE INDEX `event_types_organizationId_slug_key`(`organizationId`, `slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `booking_questions` (
    `id` VARCHAR(191) NOT NULL,
    `eventTypeId` VARCHAR(191) NOT NULL,
    `label` VARCHAR(191) NOT NULL,
    `type` ENUM('TEXT', 'TEXTAREA', 'PHONE') NOT NULL DEFAULT 'TEXT',
    `required` BOOLEAN NOT NULL DEFAULT false,
    `order` INTEGER NOT NULL DEFAULT 0,

    INDEX `booking_questions_eventTypeId_idx`(`eventTypeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bookings` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `eventTypeId` VARCHAR(191) NULL,
    `eventTitle` VARCHAR(191) NOT NULL,
    `durationMinutes` INTEGER NOT NULL,
    `hostMembershipId` VARCHAR(191) NULL,
    `hostName` VARCHAR(191) NOT NULL,
    `hostEmail` VARCHAR(191) NOT NULL,
    `hostTimezone` VARCHAR(191) NOT NULL,
    `attendeeName` VARCHAR(191) NOT NULL,
    `attendeeEmail` VARCHAR(191) NOT NULL,
    `attendeeTimezone` VARCHAR(191) NOT NULL,
    `attendeeNotes` TEXT NULL,
    `responses` JSON NULL,
    `startTime` DATETIME(3) NOT NULL,
    `endTime` DATETIME(3) NOT NULL,
    `status` ENUM('CONFIRMED', 'CANCELLED') NOT NULL DEFAULT 'CONFIRMED',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `bookings_organizationId_startTime_idx`(`organizationId`, `startTime`),
    INDEX `bookings_hostMembershipId_startTime_idx`(`hostMembershipId`, `startTime`),
    INDEX `bookings_attendeeEmail_idx`(`attendeeEmail`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `event_types` ADD CONSTRAINT `event_types_membershipId_fkey` FOREIGN KEY (`membershipId`) REFERENCES `memberships`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `event_types` ADD CONSTRAINT `event_types_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `event_types` ADD CONSTRAINT `event_types_scheduleId_fkey` FOREIGN KEY (`scheduleId`) REFERENCES `schedules`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `booking_questions` ADD CONSTRAINT `booking_questions_eventTypeId_fkey` FOREIGN KEY (`eventTypeId`) REFERENCES `event_types`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bookings` ADD CONSTRAINT `bookings_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bookings` ADD CONSTRAINT `bookings_eventTypeId_fkey` FOREIGN KEY (`eventTypeId`) REFERENCES `event_types`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bookings` ADD CONSTRAINT `bookings_hostMembershipId_fkey` FOREIGN KEY (`hostMembershipId`) REFERENCES `memberships`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
