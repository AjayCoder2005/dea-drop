// All email logic lives in @/lib/email.js
// This file re-exports both functions so any import from @/lib/resend still works.
export { sendPriceDropAlert, sendTargetPriceAlert } from "@/lib/email";