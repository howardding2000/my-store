import { PrismaClient } from "@prisma/client";

/**
 * PrismaClient 单例：开发环境热重载时避免重复建连接。
 * 用法：import { prisma } from "@/lib/prisma";
 */
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
