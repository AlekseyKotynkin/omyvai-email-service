const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const transporter = nodemailer.createTransport({
  host: 'smtp.mail.ru',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER || 'info@omyvai.ru',
    pass: process.env.EMAIL_PASS
  }
});

app.post('/api/send-emails', async (req, res) => {
  const { emails } = req.body;

  if (!Array.isArray(emails) || emails.length === 0) {
    return res.status(400).json({ error: 'No emails provided' });
  }

  let successCount = 0;
  let failCount = 0;

  for (const item of emails) {
    try {
      await transporter.sendMail({
        from: '"OmyVai Бонусы" <info@omyvai.ru>',
        to: item.to,
        subject: item.subject,
        text: item.body,
        html: item.body.replace(/\n/g, '<br>'),
      });
      successCount++;
      console.log('✓ Sent to:', item.to);
    } catch (error) {
      console.error('✗ Failed to send to', item.to, error.message);
      failCount++;
    }
  }

  res.json({ success: true, sent: successCount, failed: failCount });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'omyvai-email' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✓ Email service running on port ${PORT}`);
});
