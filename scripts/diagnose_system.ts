
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

async function diagnose() {
    console.log("=== SYSTEM DIAGNOSIS START ===");
    console.log(`Time: ${new Date().toISOString()}`);

    // 1. Check Env Vars
    console.log("\n[1] Environment Variables Check");
    const requiredEnv = [
        "DATABASE_URL",
        "LINE_LOGIN_CHANNEL_ID",
        "JWT_SECRET"
    ];

    requiredEnv.forEach(key => {
        const val = process.env[key];
        console.log(`${key}: ${val ? (key.includes("SECRET") ? "***" : val) : "MISSING ❌"}`);
    });

    // 2. Check Database Connection
    console.log("\n[2] Database Connection Check");
    try {
        const settingCount = await prisma.systemSetting.count();
        console.log(`✅ Connected to SQLite. SystemSetting count: ${settingCount}`);

        // 3. Check System Settings in DB
        console.log("\n[3] System Settings Check (DB Override)");
        const settings = await prisma.systemSetting.findMany();
        if (settings.length === 0) {
            console.log("⚠️ No SystemSettings found in DB. Using .env values.");
        } else {
            settings.forEach(s => {
                const val = s.key.includes("SECRET") || s.key.includes("TOKEN") ? "***" : s.value;
                console.log(`   DB Setting: ${s.key} = ${val}`);
            });

            const loginIdSetting = settings.find(s => s.key === "LINE_LOGIN_CHANNEL_ID");
            if (loginIdSetting) {
                console.log(`   👉 ACTIVE LINE_LOGIN_CHANNEL_ID (from DB): ${loginIdSetting.value}`);
            } else {
                console.log(`   👉 ACTIVE LINE_LOGIN_CHANNEL_ID (from Env): ${process.env.LINE_LOGIN_CHANNEL_ID}`);
            }
        }

    } catch (e: any) {
        console.error("❌ Database Connection Failed:", e.message);
    }

    // 4. Check for potential port conflicts or URL mismatches
    console.log("\n[4] Config Check");
    console.log("Current Working Directory:", process.cwd());

    console.log("\n=== DIAGNOSIS COMPLETE ===");
}

diagnose()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
