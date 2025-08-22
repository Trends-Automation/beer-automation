const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001;
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Server is running!');
});

const dispenserRouter = require('./src/routes/dispenser');
app.use('/dispenser', dispenserRouter);

const pagamentoRouter = require('./src/routes/pagamento');
app.use('/pagamento', pagamentoRouter);

const pagamentoPixRouter = require('./src/routes/pagamento_pix');
app.use('/pagamento/pix', pagamentoPixRouter);

const webhookRouter = require('./src/routes/webhook');
app.use('/webhook', webhookRouter); // Movido para /webhook

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});