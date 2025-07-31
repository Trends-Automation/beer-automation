const express = require('express');
const router = express.Router();
const { liberarChopp } = require('../services/esp32_service');

router.post('/liberar', async(req, res)=> {
    try {
        const {tipo,ml}  =req.body;

        if(!tipo || !ml) {
            return res.status(400).json({ error: 'Tipo e ml são obrigatórios' });
        }
        
        await liberarChopp(tipo, ml);
        res.status(200).json({ message: 'Comando enviado com sucesso' });
    } catch(err) {
        console.error('Erro ao liberar chopp:', err);
        return res.status(500).json({ error: err.message });
    }
});

module.exports = router;