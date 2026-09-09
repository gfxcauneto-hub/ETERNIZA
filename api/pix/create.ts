import type { VercelRequest, VercelResponse } from "@vercel/node";
import axios from "axios";
import QRCode from "qrcode";
import crypto from "node:crypto";
import https from "node:https";

const TICKET_VALUES = [12.9, 14.97, 19.9, 24.9, 27.96];
const BASE_URL = process.env.EFI_ENVIRONMENT === "sandbox" ? "https://pix-h.api.efipay.com.br" : "https://pix.api.efipay.com.br";
let tokenCache: { value: string; expiresAt: number } | undefined;

function validTicket(value: number) { return TICKET_VALUES.some((ticket) => Math.abs(ticket - value) < 0.001); }
function httpClient() {
  const p12Text = `${process.env.EFI_P12_PART_A ?? ""}${process.env.EFI_P12_PART_B ?? ""}${process.env.EFI_P12_PART_C ?? ""}` || process.env.EFI_P12_BASE64 || "";
  if (!process.env.EFI_CLIENT_ID || !process.env.EFI_CLIENT_SECRET || !process.env.EFI_PIX_KEY || !p12Text) throw new Error("Efí secrets missing");
  const p12 = Buffer.from(p12Text.replace(/\s/g, ""), "base64");
  return { clientId: process.env.EFI_CLIENT_ID, clientSecret: process.env.EFI_CLIENT_SECRET, pixKey: process.env.EFI_PIX_KEY, http: axios.create({ baseURL: BASE_URL, timeout: 15000, httpsAgent: new https.Agent({ pfx: p12, passphrase: "", minVersion: "TLSv1.2", rejectUnauthorized: true }) }) };
}
async function accessToken() {
  if (tokenCache && tokenCache.expiresAt > Date.now() + 30000) return tokenCache.value;
  const c = httpClient();
  const response = await c.http.post<{ access_token: string; expires_in?: number }>("/oauth/token", new URLSearchParams({ grant_type: "client_credentials" }).toString(), { auth: { username: c.clientId, password: c.clientSecret }, headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" } });
  tokenCache = { value: response.data.access_token, expiresAt: Date.now() + Math.max(60, Number(response.data.expires_in ?? 300)) * 1000 };
  return tokenCache.value;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  if (req.method !== "POST") return res.status(405).json({ error: "Método não permitido" });
  const body = req.body && typeof req.body === "object" ? req.body as Record<string, unknown> : {};
  const amount = Number(body.amount);
  const email = String(body.email || "");
  const whatsapp = String(body.whatsapp || "");
  if (!Number.isFinite(amount) || !validTicket(amount) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !/^\(\d{2}\) \d{5}-\d{4}$/.test(whatsapp)) return res.status(400).json({ error: "Dados do pagamento inválidos" });
  try {
    const c = httpClient();
    const txid = crypto.randomBytes(16).toString("hex");
    const charge = (await c.http.put(`/v2/cob/${txid}`, { calendario: { expiracao: 900 }, valor: { original: amount.toFixed(2) }, chave: c.pixKey, solicitacaoPagador: `Pedido Eterniza Amor ${txid}` }, { headers: { Authorization: `Bearer ${await accessToken()}` } })).data as { txid: string; status: string; pixCopiaECola: string; valor: { original: string } };
    const qrCodeDataUrl = await QRCode.toDataURL(charge.pixCopiaECola, { errorCorrectionLevel: "M", margin: 2, width: 420 });
    return res.status(201).json({ txid: charge.txid, status: charge.status, amount: charge.valor.original, pixCopiaECola: charge.pixCopiaECola, qrCodeDataUrl, expiresInSeconds: 900 });
  } catch (error) {
    const provider = error as { code?: string; message?: string; response?: { status?: number; data?: { error?: string; error_description?: string; mensagem?: string } } };
    const data = provider.response?.data;
    console.error("[Pix] create failed", provider.code || provider.message || "unknown");
    return res.status(502).json({ error: "Não foi possível gerar o PIX agora", detail: data?.error_description || data?.mensagem || data?.error || provider.code || "efipay_request_failed", providerStatus: provider.response?.status ?? null });
  }
}
