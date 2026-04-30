import { Router, Request, Response } from "express";
import { authenticateUser } from "../middleware/auth.middleware";
import { analyzeReferralImageBase64 } from "../services/ocr.service";

const router = Router();

router.get("/ping", (_req: Request, res: Response) => {
  res.json({ message: "OCR route is loaded" });
});

router.post(
  "/analyze",
  authenticateUser,
  async (req: Request, res: Response) => {
    try {
      const { imageBase64 } = req.body;

      if (!imageBase64) {
        return res.status(400).json({
          message: "imageBase64 is required.",
        });
      }

      const result = await analyzeReferralImageBase64(imageBase64);
      return res.json(result);
    } catch (error: any) {
      console.error("Tesseract OCR error:", error);
      return res.status(500).json({
        message: "OCR failed.",
        error: error?.message || "Unknown OCR error",
      });
    }
  }
);

export default router;