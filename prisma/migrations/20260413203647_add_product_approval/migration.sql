-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "approvalDate" TIMESTAMP(3),
ADD COLUMN     "approved" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "approvedBy" TEXT;

-- CreateIndex
CREATE INDEX "Product_approved_idx" ON "Product"("approved");
