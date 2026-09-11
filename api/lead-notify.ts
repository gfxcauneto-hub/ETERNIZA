import type { VercelRequest, VercelResponse } from "@vercel/node";
import nodemailer from "nodemailer";
import { getCharge } from "./_efi";

const DESTINATION = "sunshinevarieties@gmail.com";
const MAX_PHOTOS = 2;
const MAX_ATTACHMENT_BYTES = 8 * 1024 * 1024;

type Photo = { filename?: string; mimeType?: string; contentBase64?: string };
const deliveredTxids = new Set<string>();

function configured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_USER && process.env.SMTP_PASSWORD && (process.env.SMTP_FROM || process.env.SMTP_USER));
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  if (req.method !== "POST") return res.status(405).json({ error: "Método não permitido" });
  if (!configured()) return res.status(202).json({ accepted: true, delivered: false });

  const body = req.body && typeof req.body === "object" ? req.body as { email?: unknown; whatsapp?: unknown; txid?: unknown; photos?: Photo[] } : {};
  const email = String(body.email || "").trim();
  const whatsapp = String(body.whatsapp || "").trim();
  const txid = String(body.txid || "").trim();
  const photos = Array.isArray(body.photos) ? body.photos.slice(0, MAX_PHOTOS) : [];
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !/^\(\d{2}\) \d{5}-\d{4}$/.test(whatsapp) || !/^[a-zA-Z0-9]{26,35}$/.test(txid)) return res.status(400).json({ error: "Dados do pedido inválidos" });
  if (deliveredTxids.has(txid)) return res.status(200).json({ accepted: true, delivered: true, txid, duplicate: true });

  try {
    const charge = await getCharge(txid) as { status?: string; pix?: unknown[] };
    const paid = charge.status === "CONCLUIDA" || Boolean(charge.pix?.length);
    if (!paid) return res.status(402).json({ accepted: false, delivered: false, error: "Pagamento ainda não confirmado" });
  } catch {
    return res.status(502).json({ accepted: false, delivered: false, error: "Não foi possível confirmar o pagamento" });
  }

  const attachments = photos.flatMap((photo) => {
    if (!photo?.contentBase64) return [];
    const content = photo.contentBase64.replace(/^data:[^;]+;base64,/, "");
    const bytes = Math.floor(content.length * 0.75);
    if (bytes <= 0 || bytes > MAX_ATTACHMENT_BYTES) return [];
    return [{ filename: String(photo.filename || "foto-cliente.jpg").replace(/[^a-zA-Z0-9._-]/g, "_"), content, encoding: "base64", contentType: String(photo.mimeType || "image/jpeg") }];
  });

  try {
    const transporter = nodemailer.createTransport({ host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT), secure: process.env.SMTP_SECURE === "true", auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } });
    await transporter.sendMail({ from: process.env.SMTP_USER, to: DESTINATION, replyTo: email, subject: `Compra aprovada Eterniza Amor — ${txid}`, text: `Compra aprovada no site Eterniza Amor.\n\nTXID Efí: ${txid}\nE-mail: ${email}\nWhatsApp: ${whatsapp}\nFotos anexadas: ${attachments.length}`, attachments });
    deliveredTxids.add(txid);
    return res.status(200).json({ accepted: true, delivered: true, txid });
  } catch (error) {
    console.error("[Lead] SMTP delivery failed", error instanceof Error ? error.message : "unknown");
    return res.status(202).json({ accepted: true, delivered: false });
  }
}
