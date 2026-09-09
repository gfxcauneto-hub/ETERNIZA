import type { VercelRequest, VercelResponse } from "@vercel/node";
import QRCode from "qrcode";
import { z } from "zod";
import { createCharge, allowed } from "../_efi";

const input = z.object({
  amount: z.number().refine(allowed),
  email: z.string().email().max(320),
  whatsapp: z.string().regex(/^\(\d{2}\) \d{5}-\d{4}$/),
});

const attempts = new Map<string, { count: number; resetAt: number }>();

function address(req: VercelRequest) {
  return String(req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown").split(",")[0].trim();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ error: "Método não permitido" });

  const origin = req.headers.origin;
  if (origin) {
    try {
      if (new URL(origin).host !== req.headers.host) return res.status(403).json({ error: "Origem inválida" });
    } catch {
      return res.status(403).json({ error: "Origem inválida" });
    }
  }

  const key = address(req);
  const now = Date.now();
  const current = attempts.get(key);
  if (!current || current.resetAt <= now) attempts.set(key, { count: 1, resetAt: now + 15 * 60_000 });
  else if (current.count >= 5) return res.status(429).json({ error: "Muitas tentativas. Aguarde alguns minutos." });
  else current.count += 1;

  const parsed = input.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Dados do pagamento inválidos" });

  try {
    const charge = await createCharge(parsed.data.amount) as {
      txid: string;
      status: string;
      pixCopiaECola: string;
      valor: { original: string };
    };
    const qrCodeDataUrl = await QRCode.toDataURL(charge.pixCopiaECola, { errorCorrectionLevel: "M", margin: 2, width: 420 });
    return res.status(201).json({ txid: charge.txid, status: charge.status, amount: charge.valor.original, pixCopiaECola: charge.pixCopiaECola, qrCodeDataUrl, expiresInSeconds: 900 });
  } catch (error) {
    console.error("[Pix] create failed", error instanceof Error ? error.message : "unknown");
    return res.status(502).json({ error: "Não foi possível gerar o PIX agora" });
  }
}
