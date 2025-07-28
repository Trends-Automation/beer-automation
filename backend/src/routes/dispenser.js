const express = require('express');
const router = express.Router();
const { liberarChopp } = require('../services/esp32_service');

router.post('/liberar', async(req, res)=> {
    try {
        await liberarChopp();
        res.status(200).json({ message: 'Comando enviado com sucesso' });
    } catch(err) {
        console.error('Erro ao liberar chopp:', err);
        return res.status(500).json({ error: err.message });
    }
});

module.exports = router;