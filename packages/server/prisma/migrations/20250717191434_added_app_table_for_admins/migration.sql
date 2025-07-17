-- CreateTable
CREATE TABLE "App" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" VARCHAR(1000),
    "addedToEnvironment" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "App_pkey" PRIMARY KEY ("id")
);
