import type { VercelRequest, VercelResponse } from "@vercel/node";
import QRCode from "qrcode";
import { createCharge } from "../_efi";

const TICKET_VALUES = [12.9, 14.97, 19.9, 24.9, 27.96];

function allowed(value: number) {
  return TICKET_VALUES.some((ticket) => Math.abs(ticket - value) < 0.001);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  if (req.method !== "POST") return res.status(405).json({ error: "Método não permitido" });

  const body = req.body && typeof req.body === "object" ? req.body as Record<string, unknown> : {};
  const amount = Number(body.amount);
  const email = String(body.email || "");
  const whatsapp = String(body.whatsapp || "");
  if (!Number.isFinite(amount) || !allowed(amount) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !/^\(\d{2}\) \d{5}-\d{4}$/.test(whatsapp)) {
    return res.status(400).json({ error: "Dados do pagamento inválidos" });
  }

  try {
    const charge = await createCharge(amount) as { txid: string; status: string; pixCopiaECola: string; valor: { original: string } };
    const qrCodeDataUrl = await QRCode.toDataURL(charge.pixCopiaECola, { errorCorrectionLevel: "M", margin: 2, width: 420 });
    return res.status(201).json({ txid: charge.txid, status: charge.status, amount: charge.valor.original, pixCopiaECola: charge.pixCopiaECola, qrCodeDataUrl, expiresInSeconds: 900 });
  } catch (error) {
    console.error("[Pix] create failed", error instanceof Error ? error.message : "unknown");
    const provider = error as { code?: string; message?: string; response?: { status?: number; data?: { error?: string; error_description?: string; mensagem?: string } } };
    const data = provider.response?.data;
    return res.status(502).json({
      error: "Não foi possível gerar o PIX agora",
      detail: data?.error_description || data?.mensagem || data?.error || provider.code || provider.message || "efipay_request_failed",
      providerStatus: provider.response?.status ?? null,
    });
  }
}
