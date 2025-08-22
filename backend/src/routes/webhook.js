const express = require('express');
const axios = require('axios');
const router = express.Router();
const { liberarChopp } = require('../services/arduino_service');
require('dotenv').config();

const MP_ACCESS_TOKEN = process.env.MERCADO_PAGO_ACCESS_TOKEN;

router.post('/webhook', async (req, res) => {
  console.log('--- WEBHOOK RECEBIDO ---');
  console.log('Corpo:', JSON.stringify(req.body, null, 2));

  try {
    const data = req.body;

    if (data.type === 'payment_intent') {
      const intentId = data.data.id;
      console.log(`Tipo: PAYMENT_INTENT. ID: ${intentId}`);

      const response = await axios.get(
        `https://api.mercadopago.com/point/integration-api/payment-intents/${intentId}`,
        { headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` } }
      );

      const intent = response.data;
      console.log('Intenção:', JSON.stringify(intent, null, 2));

      if (intent.state === 'finished' && intent.payment.status === 'approved') {
        let volumeMl = 0;
        const match = intent.payment.description.match(/(\d+)ml/);
        if (match && match[1]) {
          volumeMl = parseInt(match[1], 10);
          console.log(`Volume extraído: ${volumeMl}ml`);
        } else {
          console.warn('Volume não encontrado. Usando padrão 300ml');
          volumeMl = 300;
        }

        await liberarChopp(volumeMl);
        console.log('Chopp liberado com sucesso!');
      } else {
        console.log(`Intenção ${intentId} não aprovada. Estado: ${intent.state}, Pagamento: ${intent.payment.status}`);
      }

      res.sendStatus(200);
    } else if (data.type === 'payment') {
      // Mantém compatibilidade com pagamentos gerais (ex: PIX no tablet)
      const paymentId = data.data.id;
      const response = await axios.get(
        `https://api.mercadopago.com/v1/payments/${paymentId}`,
        { headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` } }
      );

      const pagamento = response.data;
      if (pagamento.status === 'approved') {
        let volumeMl = 0;
        const match = pagamento.description.match(/(\d+)ml/);
        if (match && match[1]) {
          volumeMl = parseInt(match[1], 10);
        } else {
          volumeMl = 300;
        }

        await liberarChopp(volumeMl);
      }

      res.sendStatus(200);
    } else {
      console.log(`Webhook tipo '${data.type}' ignorado`);
      res.sendStatus(200);
    }
  } catch (err) {
    console.error('Erro no webhook:', err.response?.data || err.message);
    res.sendStatus(500);
  }
});

// Rota de teste
router.post('/test-liberacao', async (req, res) => {
  try {
    const { ml = 300 } = req.body;
    await liberarChopp(ml);
    res.status(200).json({ message: 'Chopp liberado com sucesso!' });
  } catch (err) {
    console.error('Erro ao liberar chopp:', err.message);
    res.status(500).json({ error: 'Erro ao liberar chopp' });
  }
});

module.exports = router;