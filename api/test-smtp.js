export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  const { password, to } = req.query;
  if (password !== 'Hogwarts011#') {
    return res.status(401).json({ error: 'Unauthorized. Invalid diagnostic password.' });
  }

  const clientId = process.env.SENDPULSE_CLIENT_ID;
  const clientSecret = process.env.SENDPULSE_CLIENT_SECRET;
  const fromEmail = process.env.SENDPULSE_SMTP_FROM || 'tonydo.pm@gmail.com';
  const targetEmail = to || 'tonydo.pm@gmail.com';

  if (!clientId || !clientSecret) {
    return res.status(400).json({
      error: 'SendPulse Environment Variables are missing inside your Vercel Dashboard.',
      checklist: [
        'SENDPULSE_CLIENT_ID must be set',
        'SENDPULSE_CLIENT_SECRET must be set',
        'SENDPULSE_SMTP_FROM must be set'
      ]
    });
  }

  try {
    const authRes = await fetch('https://api.sendpulse.com/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret
      })
    });

    if (!authRes.ok) {
      const authError = await authRes.text();
      return res.status(400).json({
        success: false,
        error: 'SendPulse OAuth authentication failed. Your Client ID or Client Secret might be incorrect.',
        details: authError
      });
    }

    const authData = await authRes.json();
    const token = authData.access_token;

    const emailHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>SendPulse Verification Test</title>
  <style>
    body { font-family: -apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #0c0c14; color: #ffffff; padding: 2rem; margin: 0; }
    .container { max-width: 600px; margin: 0 auto; background: #12121a; border-radius: 12px; border: 1px solid #222; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.5); }
    .header { padding: 2.5rem; text-align: center; background: linear-gradient(135deg, #12121a 0%, #1a1a2e 100%); border-bottom: 1px solid #222; }
    .header h1 { font-family: "Orbitron", Arial, sans-serif; font-size: 1.8rem; margin: 0; color: #00f5d4; text-transform: uppercase; letter-spacing: 2px; }
    .header p { color: #888; font-size: 0.95rem; margin-top: 0.5rem; }
    .content { padding: 2.5rem; }
    .btn { display: inline-block; background: #00f5d4; color: #000000; font-weight: bold; padding: 0.6rem 1.5rem; border-radius: 6px; text-decoration: none; font-size: 0.9rem; }
    .footer { padding: 2rem 2.5rem; text-align: center; background: #0c0c14; border-top: 1px solid #222; font-size: 0.8rem; color: #555; }
    .footer a { color: #00f5d4; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Tony Do</h1>
      <p>SendPulse API Verification Loop</p>
    </div>
    <div class="content" style="text-align: center;">
      <span style="font-size: 3rem; display: block; margin-bottom: 1.5rem;">⚡</span>
      <h2 style="color: #00f5d4; font-size: 1.5rem; margin-top: 0; margin-bottom: 1rem;">API Connection Verified Successfully!</h2>
      <p style="color: #b0b0b8; font-size: 1rem; line-height: 1.6; margin-bottom: 2rem;">
        Your SendPulse SMTP Client Credentials, Sender Address, and Edge-blasting routines are 100% active, verified, and ready on your Vercel Production Environment.
      </p>
      <a href="https://me.tony.do" class="btn">View Live Portfolio</a>
    </div>
    <div class="footer">
      <p>This is a secure diagnostic verification message from your serverless console.</p>
      <p>Want to unsubscribe? <a href="https://me.tony.do/api/unsubscribe?email=${encodeURIComponent(targetEmail)}">Click here to unsubscribe</a>.</p>
      <p>&copy; ${new Date().getFullYear()} Tony Do. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;

    const base64Html = Buffer.from(emailHtml).toString('base64');

    const emailPayload = {
      email: {
        html: base64Html,
        text: 'SendPulse API Connection Verified Successfully on Vercel!',
        subject: '⚡ SendPulse SMTP API Verification - Success',
        from: {
          name: 'Tony Do - Tech Leader',
          email: fromEmail
        },
        to: [
          {
            name: 'Tony Do',
            email: targetEmail
          }
        ]
      }
    };

    const smtpRes = await fetch('https://api.sendpulse.com/smtp/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(emailPayload)
    });

    if (smtpRes.ok) {
      return res.status(200).json({
        success: true,
        message: `SendPulse SMTP REST API is completely functional! Verification email was successfully queued and blasted to ${targetEmail}. Check your inbox!`,
        sender: fromEmail
      });
    } else {
      const smtpError = await smtpRes.text();
      return res.status(400).json({
        success: false,
        error: 'SendPulse SMTP blasting failed. Your sender email might not be verified/activated inside SendPulse yet, or there is a limit block.',
        details: smtpError
      });
    }

  } catch (err) {
    console.error('SMTP test error:', err);
    return res.status(500).json({ error: 'Internal server diagnostic failure.', details: err.message });
  }
}
