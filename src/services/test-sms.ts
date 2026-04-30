import { sendSMS } from "./smsService"; // adjust filename to match yours

const run = async () => {
  const result = await sendSMS("09551120006", "Hello! IPROG SMS test CLARET HERE.");
  console.log("Result:", result);
};

run();