import request from "supertest";
import { describe, it, expect } from "vitest";
import { app } from "../app.js";

describe("Health Check", () => {
    it("should return 200 OK", async () => {
        const response = await request(app).get("/healthz");
        expect(response.status).toBe(200);
        expect(response.text).toBe("ok");
    });
});
