import type { VercelRequest, VercelResponse } from "@vercel/node";

export default function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    const p12Base64 = `${process.env.EFI_P12_PART_A ?? ""}${process.env.EFI_P12_PART_B ?? ""}${process.env.EFI_P12_PART_C ?? ""}` || process.env.EFI_P12_BASE64 || "";
    const p12Bytes = p12Base64 ? Math.floor((p12Base64.replace(/\s/g, "").length * 3) / 4) : 0;
    res.setHeader("Cache-Control", "no-store, max-age=0");
    return res.status(200).json({
      version: "9a0d2fe",
      efi: {
        environment: process.env.EFI_ENVIRONMENT || "not-set",
        clientIdConfigured: Boolean(process.env.EFI_CLIENT_ID),
        clientSecretConfigured: Boolean(process.env.EFI_CLIENT_SECRET),
        pixKeyConfigured: Boolean(process.env.EFI_PIX_KEY),
        p12Configured: p12Bytes > 0,
        p12Bytes,
      },
    });
  } catch {
    return res.status(500).json({ error: "diagnostic_failed" });
  }
}
