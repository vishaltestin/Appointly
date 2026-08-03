-- AlterTable
ALTER TABLE `organizations` ADD COLUMN `plan` ENUM('FREE', 'PRO', 'BUSINESS') NOT NULL DEFAULT 'FREE',
    ADD COLUMN `planChangedAt` DATETIME(3) NULL,
    ADD COLUMN `planChangedBy` VARCHAR(191) NULL,
    ADD COLUMN `planNotes` TEXT NULL;

-- CreateTable
CREATE TABLE `plan_change_logs` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `fromPlan` ENUM('FREE', 'PRO', 'BUSINESS') NOT NULL,
    `toPlan` ENUM('FREE', 'PRO', 'BUSINESS') NOT NULL,
    `changedBy` VARCHAR(191) NOT NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `plan_change_logs_organizationId_idx`(`organizationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `organizations_plan_idx` ON `organizations`(`plan`);

-- AddForeignKey
ALTER TABLE `plan_change_logs` ADD CONSTRAINT `plan_change_logs_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
