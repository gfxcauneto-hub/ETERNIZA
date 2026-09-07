import type { Express, Request } from "express";
import QRCode from "qrcode";
import { z } from "zod";
import { createPixCharge, getPixCharge, isAllowedTicketValue } from "./efiPix";

const createInput = z.object({
  amount: z.number().refine(isAllowedTicketValue),
  email: z.string().email().max(320),
  whatsapp: z.string().regex(/^\(\d{2}\) \d{5}-\d{4}$/),
});

const attempts = new Map<string, { count: number; resetAt: number }>();

function clientAddress(req: Request) {
  const forwarded = req.headers["x-forwarded-for"];
  return ((Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(",")[0]) || req.ip || "unknown").trim();
}

function sameOrigin(req: Request) {
  const origin = req.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === req.get("host");
  } catch {
    return false;
  }
}

function consumeAttempt(key: string) {
  const now = Date.now();
  const current = attempts.get(key);
  if (!current || current.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + 15 * 60_000 });
    return true;
  }
  if (current.count >= 5) return false;
  current.count += 1;
  return true;
}

export function registerPixRoutes(app: Express) {
  app.post("/api/pix/create", async (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    if (!sameOrigin(req)) return res.status(403).json({ error: "Origem inválida" });
    if (!consumeAttempt(clientAddress(req))) return res.status(429).json({ error: "Muitas tentativas. Aguarde alguns minutos." });

    const parsed = createInput.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Dados do pagamento inválidos" });

    try {
      const charge = await createPixCharge(parsed.data.amount) as {
        txid: string;
        status: string;
        pixCopiaECola: string;
        valor: { original: string };
      };
      const qrCodeDataUrl = await QRCode.toDataURL(charge.pixCopiaECola, {
        errorCorrectionLevel: "M",
        margin: 2,
        width: 420,
      });
      return res.status(201).json({
        txid: charge.txid,
        status: charge.status,
        amount: charge.valor.original,
        pixCopiaECola: charge.pixCopiaECola,
        qrCodeDataUrl,
        expiresInSeconds: 900,
      });
    } catch (error) {
      console.error("[Pix] Failed to create charge", error instanceof Error ? error.message : "unknown error");
      return res.status(502).json({ error: "Não foi possível gerar o PIX agora" });
    }
  });

  app.get("/api/pix/status/:txid", async (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    const txid = String(req.params.txid || "");
    if (!/^[a-zA-Z0-9]{26,35}$/.test(txid)) return res.status(400).json({ error: "Identificador inválido" });
    try {
      const charge = await getPixCharge(txid) as { status: string; pix?: unknown[] };
      return res.json({ status: charge.status, paid: charge.status === "CONCLUIDA" || Boolean(charge.pix?.length) });
    } catch (error) {
      console.error("[Pix] Failed to check charge", error instanceof Error ? error.message : "unknown error");
      return res.status(502).json({ error: "Falha ao consultar o pagamento" });
    }
  });
}
