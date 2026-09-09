import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getEfiConfigStatus } from "../server/efiPix";

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.query.debug === "1") return res.status(200).json({ ok: true, efi: getEfiConfigStatus() });
  return res.status(200).json({ ok: true });
}
