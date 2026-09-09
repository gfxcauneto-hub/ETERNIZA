import axios, { AxiosInstance } from "axios";
import https from "node:https";
import crypto from "node:crypto";

const TICKET_VALUES = [12.9, 14.97, 19.9, 24.9, 27.96] as const;
const PRODUCTION_BASE_URL = "https://pix.api.efipay.com.br";
const SANDBOX_BASE_URL = "https://pix-h.api.efipay.com.br";

type EfiConfig = {
  clientId: string;
  clientSecret: string;
  pixKey: string;
  baseUrl: string;
  p12: Buffer;
  p12Password: string;
};

type TokenResponse = { access_token: string; expires_in?: number };

let tokenCache: { value: string; expiresAt: number } | undefined;

function getConfig(): EfiConfig {
  const { EFI_CLIENT_ID, EFI_CLIENT_SECRET, EFI_P12_BASE64, EFI_PIX_KEY } = process.env;
  const segmentedP12 = `${process.env.EFI_P12_PART_A ?? ""}${process.env.EFI_P12_PART_B ?? ""}${process.env.EFI_P12_PART_C ?? ""}`;
  const p12Base64 = segmentedP12 || EFI_P12_BASE64;
  if (!EFI_CLIENT_ID || !EFI_CLIENT_SECRET || !p12Base64 || !EFI_PIX_KEY) {
    throw new Error("Efí production secrets are not configured");
  }
  const baseUrl = process.env.EFI_ENVIRONMENT === "sandbox" ? SANDBOX_BASE_URL : PRODUCTION_BASE_URL;
  return {
    clientId: EFI_CLIENT_ID,
    clientSecret: EFI_CLIENT_SECRET,
    pixKey: EFI_PIX_KEY,
    baseUrl,
    p12: Buffer.from(p12Base64, "base64"),
    p12Password: "",
  };
}

export function getEfiConfigStatus() {
  const p12Base64 = `${process.env.EFI_P12_PART_A ?? ""}${process.env.EFI_P12_PART_B ?? ""}${process.env.EFI_P12_PART_C ?? ""}` || process.env.EFI_P12_BASE64 || "";
  let p12Bytes = 0;
  try {
    p12Bytes = Buffer.from(p12Base64, "base64").length;
  } catch {
    p12Bytes = 0;
  }
  return {
    environment: process.env.EFI_ENVIRONMENT || "not-set",
    clientIdConfigured: Boolean(process.env.EFI_CLIENT_ID),
    clientSecretConfigured: Boolean(process.env.EFI_CLIENT_SECRET),
    pixKeyConfigured: Boolean(process.env.EFI_PIX_KEY),
    p12Configured: p12Bytes > 0,
    p12Bytes,
  };
}

function createHttpClient(config = getConfig()): AxiosInstance {
  return axios.create({
    baseURL: config.baseUrl,
    timeout: 15_000,
    httpsAgent: new https.Agent({
      pfx: config.p12,
      passphrase: config.p12Password,
      minVersion: "TLSv1.2",
      rejectUnauthorized: true,
    }),
    headers: { "Content-Type": "application/json", Accept: "application/json" },
  });
}

export async function getEfiAccessToken(): Promise<string> {
  const now = Date.now();
  if (tokenCache && tokenCache.expiresAt > now + 30_000) return tokenCache.value;

  const config = getConfig();
  const client = createHttpClient(config);
  const response = await client.post<TokenResponse>(
    "/oauth/token",
    new URLSearchParams({ grant_type: "client_credentials" }).toString(),
    {
      auth: { username: config.clientId, password: config.clientSecret },
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    },
  );
  const expiresIn = Math.max(60, Number(response.data.expires_in ?? 300));
  tokenCache = { value: response.data.access_token, expiresAt: now + expiresIn * 1000 };
  return response.data.access_token;
}

export function isAllowedTicketValue(value: number) {
  return TICKET_VALUES.some((ticket) => Math.abs(ticket - value) < 0.001);
}

export async function createPixCharge(amount: number) {
  if (!isAllowedTicketValue(amount)) {
    throw new Error("Invalid ticket value");
  }
  const config = getConfig();
  const token = await getEfiAccessToken();
  const txid = crypto.randomBytes(16).toString("hex");
  const client = createHttpClient(config);
  const solicitation = `Pedido Eterniza Amor ${txid}`;
  const response = await client.put(
    `/v2/cob/${txid}`,
    {
      calendario: { expiracao: 900 },
      valor: { original: amount.toFixed(2) },
      chave: config.pixKey,
      solicitacaoPagador: solicitation,
    },
    { headers: { Authorization: `Bearer ${token}` } },
  );
  return response.data;
}

export async function getPixCharge(txid: string) {
  if (!/^[a-zA-Z0-9]{26,35}$/.test(txid)) throw new Error("Invalid txid");
  const config = getConfig();
  const token = await getEfiAccessToken();
  const client = createHttpClient(config);
  const response = await client.get(`/v2/cob/${txid}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}

export function clearEfiTokenCache() {
  tokenCache = undefined;
}

export { TICKET_VALUES };
