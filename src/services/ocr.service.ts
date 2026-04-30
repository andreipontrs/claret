import Tesseract from "tesseract.js";

export type OCRResult = {
  needsBlood: boolean;
  patientName: string | null;
  age: number | null;
  sex: "Male" | "Female" | "Other" | null;
  bloodComponent: "PRBC" | "Whole Blood" | "Platelets" | "FFP" | "Plasma" | "Unknown";
  numberOfUnits: number | null;
  hospital: string | null;
  doctor: string | null;
  referralDate: string | null;
  confidenceLevel: "High" | "Medium" | "Low";
  rawText: string;
};

function parseReferralText(text: string): OCRResult {
  const lowerText = text.toLowerCase();

  // ── Units ────────────────────────────────────────────────────────────────────
  const unitMatch = text.match(/(\d+)\s*(unit|units|bag|bags)/i);
  const numberOfUnits = unitMatch ? parseInt(unitMatch[1], 10) : null;

  // ── Blood component ──────────────────────────────────────────────────────────
  let bloodComponent: OCRResult["bloodComponent"] = "Unknown";

  if (
    lowerText.includes("prbc") ||
    lowerText.includes("packed red blood cell") ||
    lowerText.includes("packed red blood cells") ||
    lowerText.includes("red blood cell") ||
    lowerText.includes("rbc")
  ) {
    bloodComponent = "PRBC";
  } else if (lowerText.includes("whole blood")) {
    bloodComponent = "Whole Blood";
  } else if (lowerText.includes("platelet")) {
    bloodComponent = "Platelets";
  } else if (lowerText.includes("ffp")) {
    bloodComponent = "FFP";
  } else if (lowerText.includes("plasma")) {
    bloodComponent = "Plasma";
  }

  // ── Needs blood ──────────────────────────────────────────────────────────────
  const needsBlood =
    lowerText.includes("transfusion") ||
    lowerText.includes("needs blood") ||
    lowerText.includes("need blood") ||
    lowerText.includes("requires blood") ||
    lowerText.includes("requires") ||
    bloodComponent !== "Unknown";

  // ── Patient name ─────────────────────────────────────────────────────────────
  // Matches "Patient Name: John Doe" or "Patient's Name: John Doe"
  const patientNameMatch =
    text.match(/patient['s]*\s*name\s*[:\-]?\s*([A-Za-z .'-]+?)(?:\s{2,}|Age|Sex|$)/i) ||
    text.match(/name\s*[:\-]\s*([A-Za-z .'-]+?)(?:\s{2,}|Age|Sex|$)/i);
  const patientName = patientNameMatch ? patientNameMatch[1].trim() : null;

  // ── Age ───────────────────────────────────────────────────────────────────────
  // Matches "Age: 22" or "Age 22"
  const ageMatch = text.match(/\bAge\s*[:\-]?\s*(\d{1,3})/i);
  const age = ageMatch ? parseInt(ageMatch[1], 10) : null;

  // ── Sex ───────────────────────────────────────────────────────────────────────
  // Matches "Sex: Female", "Sex: M", "Gender: Male", etc.
  const sexMatch = text.match(/(?:sex|gender)\s*[:\-_]?\s*(male|female|m\b|f\b)/i);
  let sex: OCRResult["sex"] = null;
  if (sexMatch) {
    const raw = sexMatch[1].toLowerCase();
    if (raw === "female" || raw === "f") sex = "Female";
    else if (raw === "male" || raw === "m") sex = "Male";
    else sex = "Other";
  }

  // ── Hospital ─────────────────────────────────────────────────────────────────
  const hospitalMatch =
    text.match(/([A-Za-z0-9 ,.'()\-]+(?:Hospital|Medical Center|Clinic))/i);

  // ── Doctor ───────────────────────────────────────────────────────────────────
  const doctorMatch =
    text.match(/(Dr\.?\s+[A-Z][A-Za-z .'-]+)/i) ||
    text.match(/Doctor\s*[:\-]?\s*([A-Za-z .'-]+)/i);

  // ── Referral date ─────────────────────────────────────────────────────────────
  const dateMatch =
    text.match(/\b(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}|[A-Za-z]+\s+\d{1,2},\s+\d{4})\b/i);

  // ── Confidence level ─────────────────────────────────────────────────────────
  let confidenceLevel: OCRResult["confidenceLevel"] = "Low";

  if (bloodComponent !== "Unknown" && numberOfUnits !== null) {
    confidenceLevel = "High";
  } else if (bloodComponent !== "Unknown" || numberOfUnits !== null) {
    confidenceLevel = "Medium";
  }

  return {
    needsBlood,
    patientName,
    age,
    sex,
    bloodComponent,
    numberOfUnits,
    hospital: hospitalMatch ? hospitalMatch[1].trim() : null,
    doctor: doctorMatch ? (doctorMatch[1] || doctorMatch[0]).trim() : null,
    referralDate: dateMatch ? dateMatch[1].trim() : null,
    confidenceLevel,
    rawText: text.trim(),
  };
}

export async function analyzeReferralImageBase64(
  imageBase64: string
): Promise<OCRResult> {
  if (!imageBase64) {
    throw new Error("imageBase64 is required");
  }

  const cleanBase64 = imageBase64.replace(
    /^data:image\/[a-zA-Z]+;base64,/,
    ""
  );

  const imageBuffer = Buffer.from(cleanBase64, "base64");

  const {
    data: { text },
  } = await Tesseract.recognize(imageBuffer, "eng");

  return parseReferralText(text);
}