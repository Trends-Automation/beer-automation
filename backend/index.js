const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3001;
app.use(cors());
app.use(bodyParser.json());

const dispenserRouter = require('./src/routes/dispenser');
app.use('/dispenser', dispenserRouter);

const pagamentoRouter = require('./src/routes/pagamento');
app.use('/pagamento', pagamentoRouter);

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});