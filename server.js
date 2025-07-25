// resume-genie-backend/server.js
const express = require('express');
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { generateResume } = require('./resumeGenerator');

const app = express();
app.use(cors({ origin: 'https://resume-genie.vercel.app' }));
app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.send('ResumeGenie backend OK');
});

// Create Stripe checkout session
app.post('/create-checkout-session', async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'pln',
          product_data: { name: 'Premium CV PDF' },
          unit_amount: 500 // 5 PLN
        },
        quantity: 1
      }],
      success_url: `${process.env.FRONTEND_URL}/download?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/cancel`
    });
    res.json({ url: session.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Stripe session creation failed' });
  }
});

// Webhook to handle successful payment and generate PDF
app.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const customerEmail = session.customer_details.email;
    const formData = JSON.parse(session.metadata.formData);
    const pdfBuffer = await generateResume(formData);
    // TODO: send pdfBuffer via email to customerEmail
  }
  res.json({ received: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));

