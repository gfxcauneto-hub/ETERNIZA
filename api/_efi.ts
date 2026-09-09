import axios from "axios";
import crypto from "node:crypto";
import https from "node:https";

export const TICKET_VALUES = [12.9, 14.97, 19.9, 24.9, 27.96] as const;
const BASE_URL = process.env.EFI_ENVIRONMENT === "sandbox" ? "https://pix-h.api.efipay.com.br" : "https://pix.api.efipay.com.br";

function config() {
  const p12Text = `${process.env.EFI_P12_PART_A ?? ""}${process.env.EFI_P12_PART_B ?? ""}${process.env.EFI_P12_PART_C ?? ""}` || process.env.EFI_P12_BASE64 || "";
  if (!process.env.EFI_CLIENT_ID || !process.env.EFI_CLIENT_SECRET || !process.env.EFI_PIX_KEY || !p12Text) throw new Error("Efí production secrets are not configured");
  return { clientId: process.env.EFI_CLIENT_ID, clientSecret: process.env.EFI_CLIENT_SECRET, pixKey: process.env.EFI_PIX_KEY, p12: Buffer.from(p12Text.replace(/\s/g, ""), "base64") };
}

function client() {
  const c = config();
  return { c, http: axios.create({ baseURL: BASE_URL, timeout: 15000, httpsAgent: new https.Agent({ pfx: c.p12, passphrase: "", minVersion: "TLSv1.2", rejectUnauthorized: true }) }) };
}

let token: { value: string; expiresAt: number } | undefined;
export async function accessToken() {
  if (token && token.expiresAt > Date.now() + 30000) return token.value;
  const { c, http } = client();
  const response = await http.post<{ access_token: string; expires_in?: number }>("/oauth/token", new URLSearchParams({ grant_type: "client_credentials" }).toString(), { auth: { username: c.clientId, password: c.clientSecret }, headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" } });
  token = { value: response.data.access_token, expiresAt: Date.now() + Math.max(60, Number(response.data.expires_in ?? 300)) * 1000 };
  return token.value;
}

export function allowed(value: number) { return TICKET_VALUES.some((ticket) => Math.abs(ticket - value) < 0.001); }

export async function createCharge(amount: number) {
  if (!allowed(amount)) throw new Error("Invalid ticket value");
  const { c, http } = client();
  const txid = crypto.randomBytes(16).toString("hex");
  const response = await http.put(`/v2/cob/${txid}`, { calendario: { expiracao: 900 }, valor: { original: amount.toFixed(2) }, chave: c.pixKey, solicitacaoPagador: `Pedido Eterniza Amor ${txid}` }, { headers: { Authorization: `Bearer ${await accessToken()}` } });
  return response.data;
}

export async function getCharge(txid: string) {
  const { http } = client();
  return (await http.get(`/v2/cob/${txid}`, { headers: { Authorization: `Bearer ${await accessToken()}` } })).data;
}
