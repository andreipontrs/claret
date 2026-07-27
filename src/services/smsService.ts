import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const IPROG_BASE_URL = "https://sms.iprogtech.com/api/v1";
const isTestMode = process.env.NODE_ENV !== "production";

/**
 * Format PH numbers — same logic you had before
 */
const formatPHNumber = (number: string): string => {
  const cleaned = number.replace(/\s+/g, "").trim();
  if (cleaned.startsWith("+63")) return cleaned.replace("+", ""); // IPROG uses 639xx, no +
  if (cleaned.startsWith("63"))  return cleaned;
  if (cleaned.startsWith("0"))   return "63" + cleaned.slice(1);
  return "63" + cleaned;
};

/**
 * Core SMS sender — works in both test and live mode
 */
export const sendSMS = async (
  to: string,
  message: string
): Promise<{ success: boolean; messageId?: string; error?: string }> => {
  const formattedTo = formatPHNumber(to);
  const mode = isTestMode ? "🧪 TEST (dry run)" : "🔴 LIVE";

  // In test mode, just log and skip the actual API call
  if (isTestMode) {
    console.log(`[SMS] ${mode} | ✅ Would send to ${formattedTo} | Message: "${message}"`);
    return { success: true, messageId: "dry-run" };
  }

  // Sanity check: make sure the token actually loaded before we bother calling the API
  if (!process.env.IPROG_API_TOKEN) {
    const errMsg = "IPROG_API_TOKEN is missing from environment variables";
    console.error(`[SMS] ${mode} | ❌ Failed to ${formattedTo}: ${errMsg}`);
    return { success: false, error: errMsg };
  }

  try {
    const response = await axios.post(`${IPROG_BASE_URL}/sms_messages`, {
      api_token:    process.env.IPROG_API_TOKEN,
      phone_number: formattedTo,
      message:      message,
    });

    // Debug: see exactly what IPROG returns
    console.log("IPROG Raw Response:", JSON.stringify(response.data, null, 2));

    const data = response.data;

    // IPROG can return HTTP 200 with an error embedded in the body
    // (e.g. { status: 500, message: "Invalid Token" }), so axios won't
    // throw on its own — we have to check the body's status ourselves.
    if (data?.status && data.status !== 200) {
      const errMsg = data.message || "Unknown IPROG error";
      console.error(`[SMS] ${mode} | ❌ Failed to ${formattedTo}: ${errMsg}`);
      return { success: false, error: errMsg };
    }

    const messageId = data?.message_id;

    if (!messageId) {
      const errMsg = "IPROG returned no message_id despite a 200 status";
      console.error(`[SMS] ${mode} | ❌ Failed to ${formattedTo}: ${errMsg}`);
      return { success: false, error: errMsg };
    }

    console.log(`[SMS] ${mode} | ✅ Sent to ${formattedTo} | ID: ${messageId}`);
    return { success: true, messageId };

  } catch (error: any) {
    const errMsg = error.response?.data?.message || error.message;
    console.error(`[SMS] ${mode} | ❌ Failed to ${formattedTo}: ${errMsg}`);
    return { success: false, error: errMsg };
  }
};