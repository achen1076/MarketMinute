-- AlterTable
ALTER TABLE "users" ADD COLUMN     "sentinel_depth" TEXT DEFAULT 'standard',
ADD COLUMN     "sentinel_focus" TEXT DEFAULT 'balanced';
