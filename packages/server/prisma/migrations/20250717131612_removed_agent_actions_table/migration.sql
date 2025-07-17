/*
  Warnings:

  - You are about to drop the `AgentAction` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "AgentAction" DROP CONSTRAINT "AgentAction_FK_agentId_fkey";

-- DropTable
DROP TABLE "AgentAction";
