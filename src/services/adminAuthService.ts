import { prisma } from "../lib/prisma.js";
import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { config } from "../config.js";

class AdminAuthService {
    private hashPassword(password: string): string {
        return crypto.createHash("sha256").update(password).digest("hex");
    }

    async login(username: string, password: string) {
        const user = await prisma.staffUser.findUnique({
            where: { username },
        });

        if (!user) return null;

        const hashedPassword = this.hashPassword(password);
        if (user.password !== hashedPassword) return null;

        const token = jwt.sign(
            { userId: user.id, username: user.username, role: user.role },
            config.jwt.secret,
            { expiresIn: "8h" }
        );

        return { token, user: { id: user.id, username: user.username, role: user.role } };
    }

    async createInitialAdmin(username: string, password: string) {
        const count = await prisma.staffUser.count();
        if (count > 0) return null;

        const hashedPassword = this.hashPassword(password);
        return prisma.staffUser.create({
            data: {
                username,
                password: hashedPassword,
                role: "ADMIN",
            },
        });
    }
}

export const adminAuthService = new AdminAuthService();
