import { Resend } from "resend";

export async function GET() {
  try {
    // ✅ Initialize Resend
    const resend = new Resend(process.env.RESEND_API_KEY);

    // ✅ Send email
    const { data, error } = await resend.emails.send({
      from: "onboarding@resend.dev", // ✅ use this for testing
      to: "a22937541@gmail.com",     // ✅ MUST be your Resend account email
      subject: "Test Email 🚀",
      html: "<h1>Resend is working ✅</h1>",
    });

    // ❌ If error
    if (error) {
      console.error("Resend Error:", error);
      return new Response(
        JSON.stringify({ error }),
        { status: 500 }
      );
    }

    // ✅ Success
    return new Response(
      JSON.stringify({ success: true, data }),
      { status: 200 }
    );

  } catch (err) {
    console.error("Catch Error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500 }
    );
  }
}