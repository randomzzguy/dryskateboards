import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

serve(async (req) => {
  try {
    console.log("Welcome Email Function Triggered");

    // Log environment variable check (masked)
    const apiKey = Deno.env.get('RESEND_API_KEY');
    console.log(`RESEND_API_KEY present: ${!!apiKey}`);
    if (!apiKey) {
      throw new Error("Missing RESEND_API_KEY environment variable");
    }

    const payload = await req.json();
    console.log("Request Payload:", JSON.stringify(payload));

    const { record } = payload;
    if (!record || !record.email) {
      throw new Error("Invalid payload: Missing record or email");
    }

    console.log(`Sending email to: ${record.email}`);

    // Send welcome email via Resend
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        from: 'DRYSKATEBOARDS <noreply@dryskateboards.com>',
        to: [record.email],
        subject: '🎉 Welcome to DRYSKATEBOARDS - Here\'s Your 10% Off!',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome to DRYSKATEBOARDS</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f8f8f8;">
            <table role="presentation" style="width: 100%; border-collapse: collapse;">
              <tr>
                <td align="center" style="padding: 40px 0;">
                  <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    
                    <!-- Header -->
                    <tr>
                      <td style="padding: 40px 30px; background-color: #121212; text-align: center;">
                        <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: bold; letter-spacing: 2px;">
                          DRYSKATEBOARDS<span style="color: #ff3131;">.</span>
                        </h1>
                      </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                      <td style="padding: 40px 30px;">
                        <h2 style="margin: 0 0 20px 0; color: #121212; font-size: 24px;">
                          Welcome to the Crew! 🛹
                        </h2>
                        <p style="margin: 0 0 20px 0; color: #666666; font-size: 16px; line-height: 1.6;">
                          Thanks for subscribing to DRYSKATEBOARDS! We're stoked to have you join our community of riders.
                        </p>
                        <p style="margin: 0 0 20px 0; color: #666666; font-size: 16px; line-height: 1.6;">
                          As a welcome gift, here's your exclusive <strong>10% discount code</strong>:
                        </p>
                        
                        <!-- Discount Code Box -->
                        <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 30px 0;">
                          <tr>
                            <td style="padding: 20px; background-color: #ff3131; text-align: center; border-radius: 4px;">
                              <p style="margin: 0; color: #ffffff; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">
                                Your Discount Code
                              </p>
                              <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 32px; font-weight: bold; letter-spacing: 3px;">
                                WELCOME10
                              </p>
                            </td>
                          </tr>
                        </table>
                        
                        <p style="margin: 0 0 20px 0; color: #666666; font-size: 16px; line-height: 1.6;">
                          Use code <strong>WELCOME10</strong> at checkout to get 10% off your first order. Valid for 30 days!
                        </p>
                        
                        <!-- CTA Button -->
                        <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 30px 0;">
                          <tr>
                            <td align="center">
                              <a href="https://dryskateboards.com" style="display: inline-block; padding: 15px 40px; background-color: #121212; color: #ffffff; text-decoration: none; font-weight: bold; font-size: 16px; letter-spacing: 1px; border-radius: 4px;">
                                SHOP NOW
                              </a>
                            </td>
                          </tr>
                        </table>
                        
                        <p style="margin: 20px 0 0 0; color: #666666; font-size: 14px; line-height: 1.6;">
                          Stay tuned for exclusive drops, events, and skate content!
                        </p>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="padding: 30px; background-color: #f8f8f8; text-align: center; border-top: 1px solid #e0e0e0;">
                        <p style="margin: 0 0 10px 0; color: #999999; font-size: 12px;">
                          DRYSKATEBOARDS | Abu Dhabi, UAE
                        </p>
                        <p style="margin: 0 0 10px 0; color: #999999; font-size: 12px;">
                          <a href="https://instagram.com/dryskateboards" style="color: #ff3131; text-decoration: none;">Instagram</a> | 
                          <a href="mailto:info@dryskateboards.com" style="color: #ff3131; text-decoration: none;">Contact Us</a>
                        </p>
                        <p style="margin: 10px 0 0 0; color: #999999; font-size: 11px;">
                          You're receiving this because you subscribed to our newsletter.
                        </p>
                      </td>
                    </tr>
                    
                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `
      })
    })

    const data = await res.json()
    console.log("Resend API Response:", JSON.stringify(data));

    if (!res.ok) {
      console.error("Resend API Error:", data);
      throw new Error(`Resend API failed: ${data.message || res.statusText}`);
    }

    return new Response(
      JSON.stringify({ success: true, data }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error("Function Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
