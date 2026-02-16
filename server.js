const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Транспорт через Yandex Cloud Postbox
const transporter = nodemailer.createTransport({
  host: 'postbox.cloud.yandex.net',
  port: 465,          // можно 587 + secure: false + requireTLS: true
  secure: true,
  auth: {
    user: process.env.POSTBOX_USER, // key_id статического ключа
    pass: process.env.POSTBOX_PASS  // secret статического ключа
  }
});

app.post('/api/send-emails', async (req, res) => {
  const { emails } = req.body;

  if (!Array.isArray(emails) || emails.length === 0) {
    return res.status(400).json({ error: 'No emails provided' });
  }

  let successCount = 0;
  let failCount = 0;
  const errors = [];

  for (const item of emails) {
    try {
      await transporter.sendMail({
        from: `"OmyVai Бонусы" <${process.env.POSTBOX_FROM}>`,
        to: item.to,
        subject: item.subject,
        text: item.body,
        html: item.body.replace(/\n/g, '<br>'),
        replyTo: 'info@omyvai.ru'
      });
      successCount++;
      console.log('✓ Sent to:', item.to);
    } catch (error) {
      console.error('✗ Failed to send to', item.to, error);
      failCount++;
      errors.push({ to: item.to, message: error.message });
    }
  }

  if (failCount > 0) {
    return res
      .status(500)
      .json({ success: false, sent: successCount, failed: failCount, errors });
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
