const { SerialPort } = require('serialport');

const port = new SerialPort({
  path: 'COM5', // troque conforme a porta real
  baudRate: 9600,
  autoOpen: true
});

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function liberarChopp(chopp, ml) {
  return new Promise((resolve, reject) => {
    const comando = 'ABRIR\n';

    port.write(comando, err => {
      if (err) {
        return reject(err);
      }

      console.log('Comando enviado ao Arduino:', comando.trim());

      port.once('data', data => {
        const resposta = data.toString().trim();
        console.log('Resposta do Arduino:', resposta);
        if (resposta === 'OK') {
          resolve();
        } else {
          reject(new Error('Resposta inválida do Arduino: ' + resposta));
        }
      });
    });
  });
}


module.exports = { liberarChopp };
