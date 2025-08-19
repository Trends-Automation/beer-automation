const express = require('express');
const axios = require('axios');
const router = express.Router();
require('dotenv').config();

const MP_ACCESS_TOKEN = process.env.MERCADO_PAGO_ACCESS_TOKEN;
const DEVICE_ID = 'NEWLAND_N950__N950NCC603902836';

router.post('/', async(req, res)=> {
  try {
    const { ml, valor, metodo } = req.body;
    console.log('Recebido:', { ml, valor, metodo });

    const amount = Math.round(parseFloat(valor) * 100);
    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({ error: 'Valor inválido ou abaixo do mínimo (R$1.00)' });
    }

    if (!['debito', 'credito'].includes(metodo)) {
      console.log('Erro: Método inválido para Point', metodo);
      return res.status(400).json({ error: 'Método inválido. Use débito ou crédito.' });
    }

    const paymentType = metodo === 'debito' ? 'debit_card' : 'credit_card';

    console.log('Enviando intenção para:', DEVICE_ID, 'Tipo:', paymentType, 'Valor:', amount);
    const response = await axios.post(
      `https://api.mercadopago.com/point/integration-api/devices/${DEVICE_ID}/payment-intents`,
      {
        amount: amount,
        payment: {
          type: paymentType,
          installments: metodo === 'credito' ? 1 : undefined
        }
      },
      {
        headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` }
      }
    );

    const intentId = response.data.id;
    console.log('Intenção criada:', response.data);
    res.json({ intentId, message: 'Pagamento iniciado na maquininha' });
  } catch (err) {
    console.error('Erro ao criar intenção:', err.response?.data || err.message);
    res.status(500).json({ error: 'Erro ao acionar maquininha' });
  }
});

module.exports = router;