/*
  Warnings:

  - You are about to drop the `Credit` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `WorkspaceBilling` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `WorkspaceUsage` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Credit" DROP CONSTRAINT "Credit_FK_agentId_fkey";

-- DropForeignKey
ALTER TABLE "Credit" DROP CONSTRAINT "Credit_FK_executionId_fkey";

-- DropForeignKey
ALTER TABLE "Credit" DROP CONSTRAINT "Credit_FK_knowledgeId_fkey";

-- DropForeignKey
ALTER TABLE "Credit" DROP CONSTRAINT "Credit_FK_projectId_fkey";

-- DropForeignKey
ALTER TABLE "Credit" DROP CONSTRAINT "Credit_FK_taskId_fkey";

-- DropForeignKey
ALTER TABLE "Credit" DROP CONSTRAINT "Credit_FK_workflowId_fkey";

-- DropForeignKey
ALTER TABLE "Credit" DROP CONSTRAINT "Credit_FK_workspaceId_fkey";

-- DropForeignKey
ALTER TABLE "WorkspaceBilling" DROP CONSTRAINT "WorkspaceBilling_FK_workspaceId_fkey";

-- DropForeignKey
ALTER TABLE "WorkspaceUsage" DROP CONSTRAINT "WorkspaceUsage_FK_workspaceId_fkey";

-- DropTable
DROP TABLE "Credit";

-- DropTable
DROP TABLE "WorkspaceBilling";

-- DropTable
DROP TABLE "WorkspaceUsage";

-- DropEnum
DROP TYPE "BillingPlanType";

-- DropEnum
DROP TYPE "BillingStatus";
