const express = require('express');
const router = express.Router();
const { liberarChopp } = require('../services/arduino_service');

router.post('/liberar', async(req, res)=> {
    try {
        const {ml}  =req.body;

        if(!ml) {
            return res.status(400).json({ error: 'O valume é obrigatório' });
        }
        
        await liberarChopp(ml);
        res.status(200).json({ message: 'Comando enviado com sucesso' });
    } catch(err) {
        console.error('Erro ao liberar chopp:', err);
        return res.status(500).json({ error: err.message });
    }
});

module.exports = router;