const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

const ARDUINO_PORT = process.env.NODE_ENV === 'production' ? '/dev/ttyACM0' : 'COM5'; // Para Raspberry Pi vs PC
const BAUD_RATE = 9600;
let port = null;
let parser = null;
let retryCount = 0;
const MAX_RETRIES = 3;

const initSerial = () => {
    return new Promise((resolve, reject) => {
        if (port && port.isOpen) {
            console.log('Porta serial já está aberta:', ARDUINO_PORT);
            return resolve();
        }

        console.log(`Tentando abrir porta ${ARDUINO_PORT} (tentativa ${retryCount + 1}/${MAX_RETRIES})`);
        port = new SerialPort({ path: ARDUINO_PORT, baudRate: BAUD_RATE, autoOpen: false });
        parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));

        port.open((err) => {
            if (err) {
                console.error('Erro ao abrir porta serial:', err.message);
                retryCount++;
                port = null;
                if (retryCount < MAX_RETRIES) {
                    console.log('Tentando novamente em 5s...');
                    setTimeout(() => initSerial().then(resolve).catch(reject), 5000);
                } else {
                    console.error('Máximo de tentativas atingido. Verifique a conexão do Arduino.');
                    reject(new Error('Falha ao abrir porta serial após tentativas'));
                }
            } else {
                console.log('Porta serial aberta com sucesso:', ARDUINO_PORT);
                retryCount = 0;
                resolve();
            }
        });

        port.on('error', (err) => {
            console.error('Erro na porta serial:', err.message);
            port = null;
            retryCount++;
            if (retryCount < MAX_RETRIES) {
                console.log('Tentando reconectar em 5s...');
                setTimeout(() => initSerial().then(resolve).catch(reject), 5000);
            }
        });

        port.on('close', () => {
            console.log('Porta serial fechada');
            port = null;
            retryCount = 0;
        });
    });
};

const liberarChopp = async (ml) => {
    if (!ml || isNaN(ml) || ml <= 0) {
        throw new Error('Volume inválido');
    }

    await initSerial(); // Espera a porta abrir

    if (!port || !port.isOpen) {
        console.error('Porta serial não está aberta. Estado:', port ? 'fechada' : 'não inicializada');
        throw new Error('Porta serial não está aberta');
    }

    return new Promise((resolve, reject) => {
        const comando = `ABRIR ${ml}\n`;
        console.log(`Enviando comando: ${comando.trim()}`);
        port.write(comando, (err) => {
            if (err) {
                return reject(new Error(`Erro ao enviar comando: ${err.message}`));
            }

            const timeout = setTimeout(() => {
                reject(new Error('Timeout aguardando resposta do Arduino (10s)'));
            }, 10000);

            parser.on('data', (data) => {
                clearTimeout(timeout);
                const resposta = data.toString().trim();
                console.log('Resposta do Arduino:', resposta);
                if (resposta === 'OK') {
                    resolve('Chopp liberado com sucesso');
                } else {
                    reject(new Error(`Resposta inválida do Arduino: ${resposta}`));
                }
            });
        });
    });
};

module.exports = { liberarChopp };