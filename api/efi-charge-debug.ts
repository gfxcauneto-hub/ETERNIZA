import type { VercelRequest, VercelResponse } from "@vercel/node";
import axios from "axios";
import { createPixCharge } from "../server/efiPix";

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  try {
    const charge = await createPixCharge(12.9) as Record<string, unknown>;
    return res.status(200).json({
      ok: true,
      amount: charge.valor,
      status: charge.status,
      txid: charge.txid,
      hasPixCopyPaste: Boolean(charge.pixCopiaECola),
    });
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const data = error.response?.data as Record<string, unknown> | undefined;
      return res.status(200).json({
        ok: false,
        stage: "charge",
        httpStatus: error.response?.status ?? null,
        error: data?.error ?? null,
        errorDescription: data?.error_description ?? data?.mensagem ?? null,
        hasApiResponse: Boolean(error.response),
      });
    }
    return res.status(200).json({ ok: false, stage: "runtime", reason: error instanceof Error ? error.message.slice(0, 180) : "unknown_error" });
  }
}
