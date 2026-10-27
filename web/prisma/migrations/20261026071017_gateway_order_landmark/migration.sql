-- AlterTable
ALTER TABLE `Address` ADD COLUMN `landmark` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `Order` ADD COLUMN `gatewayOrderId` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Order_gatewayOrderId_key` ON `Order`(`gatewayOrderId`);

