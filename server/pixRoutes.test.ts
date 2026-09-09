import express from "express";
import type { Server } from "node:http";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { registerPixRoutes } from "./pixRoutes";

let server: Server;
let baseUrl = "";

beforeAll(async () => {
  const app = express();
  app.use(express.json());
  registerPixRoutes(app);
  await new Promise<void>((resolve) => {
    server = app.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") throw new Error("Missing test port");
      baseUrl = `http://127.0.0.1:${address.port}`;
      resolve();
    });
  });
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
});

describe("Pix route guards", () => {
  it("rejects cross-origin charge requests", async () => {
    const response = await fetch(`${baseUrl}/api/pix/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: "https://example.invalid" },
      body: JSON.stringify({ amount: 12.9, email: "cliente@example.com", whatsapp: "(11) 99999-9999" }),
    });
    expect(response.status).toBe(403);
  });

  it("rejects values outside the five tickets", async () => {
    const response = await fetch(`${baseUrl}/api/pix/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: 54, email: "cliente@example.com", whatsapp: "(11) 99999-9999" }),
    });
    expect(response.status).toBe(400);
  });

  it("rejects malformed transaction identifiers", async () => {
    expect((await fetch(`${baseUrl}/api/pix/status/invalido`)).status).toBe(400);
  });
});
