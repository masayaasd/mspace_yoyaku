import { beforeAll, afterAll } from "vitest";
import { prisma } from "../lib/prisma.js";
import { execSync } from "child_process";

beforeAll(async () => {
    // Ensure we are using the test database
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl?.includes("test.db")) {
        throw new Error("Test database URL must include 'test.db'");
    }

    // Run migrations
    execSync("npx prisma migrate deploy", { stdio: "inherit" });
});

afterAll(async () => {
    await prisma.$disconnect();
});
