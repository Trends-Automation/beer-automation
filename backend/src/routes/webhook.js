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
  console.log('--- WEBHOOK RECEBIDO ---');
  console.log('Corpo da requisição:', JSON.stringify(req.body, null, 2)); // Log completo do corpo

  try {
    const data = req.body;

    if (data.type === 'payment') {
      const paymentId = data.data.id;
      console.log(`Tipo de webhook: PAYMENT. ID do pagamento: ${paymentId}`);

      // Consulta o pagamento no Mercado Pago
      const paymentClient = new Payment(mercadopago);
      const pagamento = await paymentClient.get({ id: paymentId });

      console.log('Objeto de Pagamento retornado pelo Mercado Pago:', JSON.stringify(pagamento, null, 2));

      const status = pagamento.status;
      const valor = pagamento.transaction_amount;
      const metodo = pagamento.payment_method_id;
      const descricao = pagamento.description;

      console.log(`Pagamento ${paymentId} consultado. Status: ${status} | Valor: ${valor} | Método: ${metodo}`);

      if (status === 'approved') {
        console.log('Pagamento confirmado! Iniciando liberação do chopp...');

        let volumeMl = 0;
        const match = descricao.match(/(\d+)ml/);
        if(match && match[1]){
          volumeMl = parseInt(match[1], 10);
          console.log(`Volume extraido da descrição: ${volumeMl}ml`);
        } else {
          console.warn('Não foi possível extrair o volume da descrição. Está sendo utilizado o volume padrão (300ml)');
          volumeMl = 300;
        }

        await liberarChopp('chopp', volumeMl);
        console.log('Chopp liberado com sucesso via webhook!');
      } else {
        console.log(`Pagamento ${paymentId} não aprovado. Status: ${status}. Nenhuma ação tomada.`);
      }

      res.sendStatus(200);

    } else {
      console.log(`Webhook de tipo '${data.type}' recebido (não é de pagamento). Retornando 200 OK.`);
      res.sendStatus(200);
    }

  } catch (err) {
    console.error('[ERRO NO PROCESSAMENTO DO WEBHOOK]', err);
    res.sendStatus(500);
  }
});

//APENAS PARA TESTES
router.post('/test-liberacao', async (req, res) => {
  try {
    const { valor = 100 } = req.body;
    console.log('Testando liberação de chopp no valor:', valor);
    await liberarChopp(valor);
    res.status(200).json({ message: 'Chopp liberado com sucesso!' });
  } catch (err) {
    console.error('Erro ao liberar chopp:', err);
    res.status(500).json({ error: 'Erro ao liberar chopp' });
  }
});

module.exports = router;
