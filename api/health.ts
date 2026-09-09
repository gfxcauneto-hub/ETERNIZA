import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getEfiConfigStatus } from "../server/efiPix";

export default function handler(_req: VercelRequest, res: VercelResponse) {
  return res.status(200).json({ ok: true, efi: getEfiConfigStatus() });
}
