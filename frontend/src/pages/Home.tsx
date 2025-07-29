import axios from 'axios';
import { useState } from 'react';

const tiposChopp = ['Pilsen', 'IPA', 'Stout', 'Witbier', 'Weiss']
const volumes = [300,500,700];

export default function Home() {
    const [tipoSelecionado, setTipoSelecionado] = useState('');
    const [volumeSelecionado, setVolumeSelecionado] = useState<number | null>(null);
    const [status, setStatus] = useState('');
    const [aguardandoConfirmacao, setAguardandoConfirmacao] = useState(false);

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

        try {
            const response = await axios.post('http://localhost:3001/pagamento/criar-link', {
                tipo: tipoSelecionado,
                ml: volumeSelecionado,
                valor: chopp.valor
            });
            
            const {link} = await response.data;
            window.open(link, '_blank');
            setStatus('Aguardando pagamento...');
            setAguardandoConfirmacao(true);
        } catch (err) {
            console.error(err);
            setStatus('Erro ao processar o pagamento. Tente novamente.');
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
            disabled={aguardandoConfirmacao}
            >
            Pagar
        </button>
        {aguardandoConfirmacao && (
            <button 
                className='mt-4 bg-yellow-400 text-white px-4 py-2'
                onClick={confirmarPagamento}
                >
                Já paguei
            </button>
        )}
        <p className='mt-4'>{status}</p>
    </div>
);
}
