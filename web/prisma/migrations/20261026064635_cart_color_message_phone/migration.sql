-- The old unique index backs the userId foreign key, so drop the FK, swap the index, re-add the FK.
ALTER TABLE `CartItem` DROP FOREIGN KEY `CartItem_userId_fkey`;
DROP INDEX `CartItem_userId_sku_size_key` ON `CartItem`;
ALTER TABLE `CartItem` ADD COLUMN `color` VARCHAR(191) NOT NULL;
CREATE UNIQUE INDEX `CartItem_userId_sku_size_color_key` ON `CartItem`(`userId`, `sku`, `size`, `color`);
ALTER TABLE `CartItem` ADD CONSTRAINT `CartItem_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `Message` ADD COLUMN `phone` VARCHAR(191) NULL;
