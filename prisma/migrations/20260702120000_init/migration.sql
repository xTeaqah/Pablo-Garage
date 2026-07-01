-- CreateTable
CREATE TABLE `Settings` (
    `id` VARCHAR(191) NOT NULL DEFAULT 'default',
    `businessName` VARCHAR(191) NOT NULL DEFAULT 'Pablo Auto''s',
    `address` VARCHAR(191) NOT NULL DEFAULT '',
    `phone` VARCHAR(191) NOT NULL DEFAULT '',
    `email` VARCHAR(191) NOT NULL DEFAULT '',
    `defaultLaborRate` DOUBLE NOT NULL DEFAULT 45,
    `invoicePrefix` VARCHAR(191) NOT NULL DEFAULT 'MG',
    `nextInvoiceNumber` INTEGER NOT NULL DEFAULT 1,
    `paymentTermsDays` INTEGER NOT NULL DEFAULT 14,
    `sortCode` VARCHAR(191) NOT NULL DEFAULT '',
    `accountNumber` VARCHAR(191) NOT NULL DEFAULT '',
    `invoiceTitle` VARCHAR(191) NOT NULL DEFAULT 'INVOICE',
    `invoiceHeaderNote` VARCHAR(191) NOT NULL DEFAULT '',
    `invoicePaymentText` VARCHAR(191) NOT NULL DEFAULT 'Payment due within {days} days.',
    `invoiceBankText` VARCHAR(191) NOT NULL DEFAULT 'BACS: Sort {sortCode} · Account {accountNumber}',
    `invoiceFooterText` VARCHAR(191) NOT NULL DEFAULT 'Thank you for your business.

Not VAT registered — no VAT has been charged.',
    `adminUsername` VARCHAR(191) NOT NULL DEFAULT 'Pablo',
    `passwordHash` VARCHAR(191) NOT NULL DEFAULT '',

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LoginAttempt` (
    `key` VARCHAR(191) NOT NULL,
    `count` INTEGER NOT NULL DEFAULT 1,
    `resetAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Customer` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NULL,
    `address` VARCHAR(191) NULL,
    `notes` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Vehicle` (
    `id` VARCHAR(191) NOT NULL,
    `customerId` VARCHAR(191) NOT NULL,
    `registration` VARCHAR(191) NOT NULL,
    `make` VARCHAR(191) NOT NULL,
    `model` VARCHAR(191) NOT NULL,
    `year` INTEGER NULL,
    `mileage` INTEGER NULL,
    `color` VARCHAR(191) NULL,
    `vin` VARCHAR(191) NULL,
    `notes` VARCHAR(191) NULL,
    `fuelType` VARCHAR(191) NULL,
    `motStatus` VARCHAR(191) NULL,
    `motExpiryDate` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Vehicle_customerId_idx`(`customerId`),
    INDEX `Vehicle_registration_idx`(`registration`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Job` (
    `id` VARCHAR(191) NOT NULL,
    `customerId` VARCHAR(191) NOT NULL,
    `vehicleId` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `notes` VARCHAR(191) NULL,
    `status` ENUM('SCHEDULED', 'IN_PROGRESS', 'WAITING_PARTS', 'COMPLETE', 'INVOICED', 'PAID', 'CANCELLED') NOT NULL DEFAULT 'SCHEDULED',
    `scheduledAt` DATETIME(3) NULL,
    `startedAt` DATETIME(3) NULL,
    `completedAt` DATETIME(3) NULL,
    `total` DOUBLE NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Job_customerId_idx`(`customerId`),
    INDEX `Job_vehicleId_idx`(`vehicleId`),
    INDEX `Job_status_idx`(`status`),
    INDEX `Job_scheduledAt_idx`(`scheduledAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `JobLineItem` (
    `id` VARCHAR(191) NOT NULL,
    `jobId` VARCHAR(191) NOT NULL,
    `type` ENUM('LABOR', 'PART') NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `quantity` DOUBLE NOT NULL,
    `unitPrice` DOUBLE NOT NULL,
    `lineTotal` DOUBLE NOT NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,

    INDEX `JobLineItem_jobId_idx`(`jobId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Invoice` (
    `id` VARCHAR(191) NOT NULL,
    `jobId` VARCHAR(191) NOT NULL,
    `invoiceNumber` VARCHAR(191) NOT NULL,
    `status` ENUM('DRAFT', 'SENT', 'PAID', 'OVERDUE') NOT NULL DEFAULT 'DRAFT',
    `issuedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `dueAt` DATETIME(3) NOT NULL,
    `paidAt` DATETIME(3) NULL,
    `subtotal` DOUBLE NOT NULL,
    `total` DOUBLE NOT NULL,
    `notes` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Invoice_jobId_key`(`jobId`),
    UNIQUE INDEX `Invoice_invoiceNumber_key`(`invoiceNumber`),
    INDEX `Invoice_status_idx`(`status`),
    INDEX `Invoice_issuedAt_idx`(`issuedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `InventoryCar` (
    `id` VARCHAR(191) NOT NULL,
    `registration` VARCHAR(191) NOT NULL,
    `make` VARCHAR(191) NOT NULL,
    `model` VARCHAR(191) NOT NULL,
    `year` INTEGER NULL,
    `color` VARCHAR(191) NULL,
    `mileage` INTEGER NULL,
    `notes` VARCHAR(191) NULL,
    `purchaseCost` DOUBLE NOT NULL DEFAULT 0,
    `purchaseDate` DATETIME(3) NULL,
    `salePrice` DOUBLE NULL,
    `soldAt` DATETIME(3) NULL,
    `status` ENUM('IN_STOCK', 'SOLD') NOT NULL DEFAULT 'IN_STOCK',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `InventoryCar_status_idx`(`status`),
    INDEX `InventoryCar_registration_idx`(`registration`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `InventoryPart` (
    `id` VARCHAR(191) NOT NULL,
    `inventoryCarId` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `cost` DOUBLE NOT NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,

    INDEX `InventoryPart_inventoryCarId_idx`(`inventoryCarId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Vehicle` ADD CONSTRAINT `Vehicle_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Job` ADD CONSTRAINT `Job_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Job` ADD CONSTRAINT `Job_vehicleId_fkey` FOREIGN KEY (`vehicleId`) REFERENCES `Vehicle`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `JobLineItem` ADD CONSTRAINT `JobLineItem_jobId_fkey` FOREIGN KEY (`jobId`) REFERENCES `Job`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Invoice` ADD CONSTRAINT `Invoice_jobId_fkey` FOREIGN KEY (`jobId`) REFERENCES `Job`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InventoryPart` ADD CONSTRAINT `InventoryPart_inventoryCarId_fkey` FOREIGN KEY (`inventoryCarId`) REFERENCES `InventoryCar`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
