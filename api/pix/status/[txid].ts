import type { VercelRequest, VercelResponse } from "@vercel/node";
import axios from "axios";
import https from "node:https";

let tokenCache: { value: string; expiresAt: number } | undefined;
function client() {
  const p12Text = `${process.env.EFI_P12_PART_A ?? ""}${process.env.EFI_P12_PART_B ?? ""}${process.env.EFI_P12_PART_C ?? ""}` || process.env.EFI_P12_BASE64 || "";
  if (!process.env.EFI_CLIENT_ID || !process.env.EFI_CLIENT_SECRET || !p12Text) throw new Error("Efí secrets missing");
  const p12 = Buffer.from(p12Text.replace(/\s/g, ""), "base64");
  return { clientId: process.env.EFI_CLIENT_ID, clientSecret: process.env.EFI_CLIENT_SECRET, http: axios.create({ baseURL: process.env.EFI_ENVIRONMENT === "sandbox" ? "https://pix-h.api.efipay.com.br" : "https://pix.api.efipay.com.br", timeout: 15000, httpsAgent: new https.Agent({ pfx: p12, passphrase: "", minVersion: "TLSv1.2", rejectUnauthorized: true }) }) };
}
async function token() {
  if (tokenCache && tokenCache.expiresAt > Date.now() + 30000) return tokenCache.value;
  const c = client();
  const response = await c.http.post<{ access_token: string; expires_in?: number }>("/oauth/token", new URLSearchParams({ grant_type: "client_credentials" }).toString(), { auth: { username: c.clientId, password: c.clientSecret }, headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" } });
  tokenCache = { value: response.data.access_token, expiresAt: Date.now() + Math.max(60, Number(response.data.expires_in ?? 300)) * 1000 };
  return tokenCache.value;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  if (req.method !== "GET") return res.status(405).json({ error: "Método não permitido" });
  const txid = String(req.query.txid || "");
  if (!/^[a-zA-Z0-9]{26,35}$/.test(txid)) return res.status(400).json({ error: "Identificador inválido" });
  try {
    const c = client();
    const charge = (await c.http.get(`/v2/cob/${txid}`, { headers: { Authorization: `Bearer ${await token()}` } })).data as { status: string; pix?: unknown[] };
    return res.status(200).json({ status: charge.status, paid: charge.status === "CONCLUIDA" || Boolean(charge.pix?.length) });
  } catch {
    return res.status(502).json({ error: "Falha ao consultar o pagamento" });
  }
}
