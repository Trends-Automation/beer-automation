import axios from 'axios';
import { useState } from 'react';

const tiposChopp = ['Pilsen', 'IPA', 'Stout', 'Witbier', 'Weiss']
const volumes = [300,500,700];

export default function Home() {
    const [tipoSelecionado, setTipoSelecionado] = useState('');
    const [volumeSelecionado, setVolumeSelecionado] = useState<number | null>(null);
    const [status, setStatus] = useState('');
    const [aguardandoConfirmacao, setAguardandoConfirmacao] = useState(false);
    const [qrCodeBase64, setQrCodeBase64] = useState<string | null>(null);
    const [pagando, setPagando] = useState(false);

    const handlePagamento = async()=> {
        if(!tipoSelecionado || !volumeSelecionado) {
            setStatus('Selecione o tipo e volume do chopp');
            return;
        }

        setStatus('Processando pagamento...');

        const chopp = {
            tipo: tipoSelecionado,
            ml: volumeSelecionado,
            valor: (volumeSelecionado / 1000 * 10).toFixed(2) // Exemplo de cálculo de valor
        };

        console.log('enviando pagamento com valor:', chopp.valor);

        try {
            setPagando(true);
            const response = await axios.post('http://localhost:3001/pagamento/pix', {
                tipo: tipoSelecionado,
                ml: volumeSelecionado,
                valor: chopp.valor
            });

            const {qrCodeBase64} = response.data;
            setQrCodeBase64(qrCodeBase64);
        } catch (err) {
            console.error(err);
            setStatus('Erro ao processar o pagamento. Tente novamente.');
        }finally {
            setPagando(false);
        }
    };

    const confirmarPagamento = async()=> {
        setStatus('Liberando chopp...');
        try {
            const response = await axios.post('http://localhost:3001/dispenser/liberar', {
                tipo: tipoSelecionado,
                ml: volumeSelecionado
            });
            setStatus(response.data.message);
            setAguardandoConfirmacao(false);
        } catch(error) {
            console.error(error);
            setStatus('Erro ao liberar o chopp. Tente novamente.');
        }
    };

return(
    <div>
        <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">Escolha o tipo de chopp:</h2>
            <div className="grid grid-cols-2 gap-3">
                {tiposChopp.map(tipo => (
                    <button
                        key={tipo}
                        className={`border rounded p-3 text-center text-sm font-medium transition
                            ${tipoSelecionado === tipo ? 'bg-yellow-400 text-black' : 'bg-gray-100 hover:bg-gray-200'}`}
                        onClick={() => setTipoSelecionado(tipo)}
                    >
                        {tipo}
                    </button>
                ))}
            </div>
        </div>

        <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">Escolha a quantidade:</h2>
            <div className="grid grid-cols-3 gap-3">
                {volumes.map(ml => (
                    <button
                        key={ml}
                        className={`border rounded p-3 text-center text-sm font-medium transition
                            ${volumeSelecionado === ml ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                        onClick={() => setVolumeSelecionado(ml)}
                    >
                        {ml} ml
                    </button>
                ))}
            </div>
        </div>

        <button 
            className='bg-green-600 text-white px-4 py-2' 
            onClick={handlePagamento}
            disabled={pagando}
            >
            {pagando ? 'Gerando QR Code...' : 'Pagar com PIX'}
        </button>
        {qrCodeBase64 && (
            <div className='mt-4 p-4 border bg-white text-center'>
                <h2 className='text-lg font-semibold mb-2'>Escaneie o QR Code abaixo:</h2>
                <img 
                    src={`data:image/png;base64,${qrCodeBase64}`} 
                    alt="QR Code PIX"
                    className='mx-auto w-60 h-60' />
                <p className='mt-2 text-sm text-gray-600'>O pagamento será identificado automaticamente</p>
            </div>
        )}
        <p className='mt-4'>{status}</p>
    </div>
);
}
