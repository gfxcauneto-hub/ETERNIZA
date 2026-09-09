import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getCharge } from "../../_efi";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET") return res.status(405).json({ error: "Método não permitido" });
  const txid = String(req.query.txid || "");
  if (!/^[a-zA-Z0-9]{26,35}$/.test(txid)) return res.status(400).json({ error: "Identificador inválido" });
  try {
    const charge = await getCharge(txid) as { status: string; pix?: unknown[] };
    return res.status(200).json({ status: charge.status, paid: charge.status === "CONCLUIDA" || Boolean(charge.pix?.length) });
  } catch (error) {
    console.error("[Pix] status failed", error instanceof Error ? error.message : "unknown");
    return res.status(502).json({ error: "Falha ao consultar o pagamento" });
  }
}
