const express = require('express');
const router = express.Router();

router.post('/criar-link', async (req, res)=> {
    const {ml,valor} = req.body;

    if (!ml || !valor) {
        return res.status(400).json({ error: 'Tipo, ml e valor são obrigatórios' });
    }

    const link = `https://app.infinitepay.io/deeplink/payment?amount=${valor}&reason=Chopp+${ml}`;
    res.json({link});
});

module.exports = router;