import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getEfiConfigStatus } from "../server/efiPix";

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  return res.status(200).json({ version: "2abe6c7", efi: getEfiConfigStatus() });
}
