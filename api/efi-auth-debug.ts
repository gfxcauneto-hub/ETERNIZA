import type { VercelRequest, VercelResponse } from "@vercel/node";
import axios from "axios";
import https from "node:https";

function p12FromEnv() {
  const joined = `${process.env.EFI_P12_PART_A ?? ""}${process.env.EFI_P12_PART_B ?? ""}${process.env.EFI_P12_PART_C ?? ""}` || process.env.EFI_P12_BASE64 || "";
  return Buffer.from(joined.replace(/\s/g, ""), "base64");
}

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  try {
    const clientId = process.env.EFI_CLIENT_ID || "";
    const clientSecret = process.env.EFI_CLIENT_SECRET || "";
    const p12 = p12FromEnv();
    if (!clientId || !clientSecret || !p12.length) return res.status(200).json({ ok: false, stage: "config", reason: "missing_secret" });

    const client = axios.create({
      baseURL: process.env.EFI_ENVIRONMENT === "sandbox" ? "https://pix-h.api.efipay.com.br" : "https://pix.api.efipay.com.br",
      timeout: 15000,
      httpsAgent: new https.Agent({ pfx: p12, passphrase: "", minVersion: "TLSv1.2", rejectUnauthorized: true }),
    });
    const response = await client.post("/oauth/token", new URLSearchParams({ grant_type: "client_credentials" }).toString(), {
      auth: { username: clientId, password: clientSecret },
      headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    });
    return res.status(200).json({ ok: true, stage: "oauth", httpStatus: response.status, tokenReceived: Boolean(response.data?.access_token), expiresIn: response.data?.expires_in ?? null });
  } catch (error) {
    if (axios.isAxiosError(error)) return res.status(200).json({ ok: false, stage: "oauth", httpStatus: error.response?.status ?? null, reason: error.response?.data?.error || error.response?.data?.error_description || "efipay_request_failed" });
    return res.status(200).json({ ok: false, stage: "tls_or_runtime", reason: error instanceof Error ? error.message.slice(0, 160) : "unknown_error" });
  }
}
