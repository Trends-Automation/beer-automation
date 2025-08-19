const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

const ARDUINO_PORT = 'COM5';
const BAUD_RATE = 9600;
let port = null;
let parser = null;
let isOpening = false;

const initSerial = () => {
    return new Promise((resolve, reject) => {
        if (port && port.isOpen) {
            console.log('Porta serial já está aberta.');
            return resolve();
        }

        if (isOpening) {
            console.log('A porta já está em processo de abertura.');
            return reject(new Error('Aguardando a abertura da porta.'));
        }

        isOpening = true;
        console.log(`Tentando abrir porta ${ARDUINO_PORT}...`);
        port = new SerialPort({ path: ARDUINO_PORT, baudRate: BAUD_RATE });
        parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));

        port.on('open', () => {
            console.log('Porta serial aberta com sucesso.');
            isOpening = false;
            resolve();
        });

        port.on('error', (err) => {
            console.error('Erro na porta serial:', err.message);
            isOpening = false;
            reject(err);
        });

        port.on('close', () => {
            console.log('Porta serial fechada');
            isOpening = false;
        });
    });
};

const liberarChopp = async (ml) => {
    if (!ml || isNaN(ml) || ml <= 0) {
        throw new Error('Volume inválido');
    }

    try {
        await initSerial();
    } catch (err) {
        throw new Error('Não foi possível conectar ao Arduino. ' + err.message);
    }
    
    return new Promise((resolve, reject) => {
        if (!port || !port.isOpen) {
             return reject(new Error('Porta serial não está aberta.'));
        }
        
        const comando = `ABRIR ${ml}\n`;
        console.log(`Enviando comando: ${comando.trim()}`);
        
        const timeout = setTimeout(() => {
            reject(new Error('Timeout aguardando resposta do Arduino'));
        }, 5000);
        
        port.write(comando, (err) => {
            if (err) {
                clearTimeout(timeout);
                return reject(new Error(`Erro ao enviar comando: ${err.message}`));
            }
        });
        
        parser.once('data', (data) => {
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
};

module.exports = { liberarChopp };