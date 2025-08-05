-- CreateIndex
CREATE FULLTEXT INDEX `Post_content_title_idx` ON `Post`(`content`, `title`);
