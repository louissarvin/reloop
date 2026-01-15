import { Resend } from 'resend';

const resend = new Resend(`${process.env.RESEND_API_KEY}`);

export interface BuyerInterestEmailData {
  buyerEmail: string;
  tokenId: string;
  tokenName: string;
  sellerPhone?: string;
  assetUrl: string;
}

/**
 * Send email to BUYER with seller's contact info
 */
export async function sendBuyerInterestEmail(data: BuyerInterestEmailData): Promise<{
  success: boolean;
  error?: string;
}> {
  // Skip if no API key configured
  if (!process.env.RESEND_API_KEY) {
    console.log('Resend API key not configured, skipping email notification');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'ReLoop <onboarding@resend.dev>';

    const { error } = await resend.emails.send({
      from: fromEmail,
      to: data.buyerEmail,
      subject: `Seller Contact Info for ${data.tokenName} - ReLoop`,
      html: generateBuyerEmailHtml(data),
    });

    if (error) {
      console.error('Resend error:', error);
      return { success: false, error: error.message };
    }

    console.log(`Interest confirmation sent to buyer ${data.buyerEmail} for token ${data.tokenId}`);
    return { success: true };
  } catch (error) {
    console.error('Email send error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

function generateBuyerEmailHtml(data: BuyerInterestEmailData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
          background-color: #f5f5f5;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .card {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .header {
          background: #008170;
          color: white;
          padding: 24px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
          font-weight: 600;
        }
        .header p {
          margin: 8px 0 0 0;
          opacity: 0.9;
        }
        .content {
          padding: 24px;
        }
        .contact-box {
          background: #f0fdf4;
          padding: 20px;
          border-radius: 12px;
          margin: 20px 0;
          border: 2px solid #22c55e;
          text-align: center;
        }
        .contact-label {
          color: #166534;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-weight: 600;
          margin-bottom: 8px;
        }
        .contact-value {
          color: #111827;
          font-size: 24px;
          font-weight: 700;
          font-family: 'SF Mono', Monaco, 'Courier New', monospace;
        }
        .info-box {
          background: #f9fafb;
          padding: 16px;
          border-radius: 8px;
          margin: 16px 0;
          border: 1px solid #e5e7eb;
        }
        .label {
          color: #6b7280;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-weight: 600;
          margin-bottom: 4px;
        }
        .value {
          color: #111827;
          font-size: 15px;
        }
        .button {
          display: inline-block;
          background: #008170;
          color: white !important;
          padding: 14px 28px;
          border-radius: 8px;
          text-decoration: none;
          margin-top: 16px;
          font-weight: 600;
        }
        .footer {
          padding: 16px 24px;
          background: #f9fafb;
          border-top: 1px solid #e5e7eb;
          text-align: center;
        }
        .footer p {
          color: #6b7280;
          font-size: 13px;
          margin: 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="card">
          <div class="header">
            <h1>Thanks for Your Interest!</h1>
            <p>Here's how to contact the seller</p>
          </div>
          <div class="content">
            <p>You expressed interest in <strong>${data.tokenName}</strong>. Here's the seller's contact information:</p>

            ${data.sellerPhone ? `
            <div class="contact-box">
              <div class="contact-label">Seller's Phone Number</div>
              <div class="contact-value">${data.sellerPhone}</div>
            </div>
            ` : `
            <div class="info-box">
              <p style="margin: 0; text-align: center; color: #6b7280;">
                The seller hasn't provided contact information yet. Please check the listing for updates.
              </p>
            </div>
            `}

            <div class="info-box">
              <div class="label">Listing</div>
              <div class="value">${data.tokenName}</div>
            </div>

            <div style="text-align: center;">
              <a href="${data.assetUrl}" class="button">View Listing</a>
            </div>
          </div>
          <div class="footer">
            <p>Thank you for using ReLoop Marketplace!</p>
            <p style="margin-top: 8px;">This is an automated email. Please do not reply.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}
