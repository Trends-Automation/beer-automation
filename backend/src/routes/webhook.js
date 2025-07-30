const express = require('express');
const { MercadoPagoConfig, Payment } = require('mercadopago');
const { liberarChopp } = require('../services/esp32_service');
require('dotenv').config();

const router = express.Router();

const mercadopago = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN
});

// Webhook do Mercado Pago
router.post('/webhook', async (req, res) => {
  try {
    const data = req.body;

    // Confirma se é notificação de pagamento
    if (data.type === 'payment') {
      const paymentId = data.data.id;

      // Consulta o pagamento no Mercado Pago
      const paymentClient = new Payment(mercadopago);
      const pagamento = await paymentClient.get({ id: paymentId });

      const status = pagamento.body.status;
      const valor = pagamento.body.transaction_amount;
      const metodo = pagamento.body.payment_method_id;

      console.log(`Webhook recebido: pagamento ${paymentId} com status: ${status} | Valor: ${valor} | Método: ${metodo}`);

      if (status === 'approved') {
        console.log('Pagamento confirmado! Liberar chopp');
        await liberarChopp('chopp', 300); // Exemplo de tipo e quantidade
        console.log('Chopp liberado com sucesso!');
      }

      res.sendStatus(200);
    }
  } catch (err) {
    console.error('[ERRO WEBHOOK]', err);
    res.sendStatus(500);
  }
});


//APENAS PARA TESTES
router.post('/test-liberacao', async(req,res)=> {
  try {
    const {valor = 100, tipo = 'chopp'} = req.body;
    console.log('Testando liberação de chopp:', tipo, 'Valor:', valor);
    await liberarChopp(tipo, valor);
    res.status(200).json({ message: 'Chopp liberado com sucesso!' });
  }catch(err) {
    console.error('Erro ao liberar chopp:', err);
    res.status(500).json({ error: 'Erro ao liberar chopp' });
  }
});

module.exports = router;
