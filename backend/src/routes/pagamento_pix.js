const { parse } = require('dotenv');
const express = require('express');
const { MercadoPagoConfig, Payment } = require('mercadopago');
require('dotenv').config();
const router = express.Router();

const mercadopago = new MercadoPagoConfig({
    accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN
});

router.post('/', async(req, res)=> {
    try {
        const {ml, valor} = req.body;
        console.log('[PAYLOAD RECEBIDO]', req.body);
        console.log('[VALOR PROCESSADO]', valor, 'typeof:', typeof valor);

        const transactionAmount = Number(valor);

        console.log('[VALOR NUMÉRICO PROCESSADO]', transactionAmount, 'typeof:', typeof transactionAmount);

        if(isNaN(transactionAmount) || transactionAmount <= 0) {
            return res.status(400).json({error:'Valor inválido para pagamento'});
        }

        const paymentData = {
            transaction_amount: 0.01, // transactionAmount
            description: `Pagamento de Chopp ${ml}ml`,
            payment_method_id: "pix",
            payer: {
                email: "cliente@email.com",
                first_name: "Cliente",
                last_name: "Exemplo",
                identification: {
                    type: "CPF",
                    number: "12345678909"
                },
                address: {
                    zip_code: "06233-200",
                    street_name: "Av. das Nações Unidas",
                    street_number: "3003",
                    neighborhood: "Vila Progredior",
                    city: "Osasco",
                    federal_unit: "SP"
                }
            }
        };

        const pagamento = await new Payment(mercadopago).create({body: paymentData});

        const qrCode = pagamento.point_of_interaction.transaction_data.qr_code;
        const qrCodeBase64 = pagamento.point_of_interaction.transaction_data.qr_code_base64;

        res.json({
            qrCode,
            qrCodeBase64,
            paymentId: pagamento.id,
        });

    } catch (err) {
        console.error('[ERRO NO BACKEND AO PROCESSAR PAGAMENTO]', err);
        if(err.cause && err.cause.lenght > 0){
            console.log('[DETALHES DO ERRO MERCADO PAGO]', err.cause);
        }
        console.error('[ERRO MERCADO PAGO]', err);
        res.status(500).json({ error: 'Erro ao gerar QR Code PIX' });
    }
});

module.exports = router;
