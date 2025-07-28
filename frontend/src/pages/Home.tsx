import axios from 'axios';
import { useState } from 'react';


export default function Home() {
    const [status, setStatus] = useState('');

    const handlePagar = async() => {
        setStatus('Processando...');
        try {
            await axios.post('http://localhost:3001/dispenser/liberar');
            setStatus('Pagamento realizado com sucesso!');
        } catch {
            setStatus('Erro ao processar o pagamento. Tente novamente.');
        }
    };

    return(
        <div className='p-6'>
            <h1 className='text-2xl font-bold mb-4'>Beer Automation</h1>
            <button
                onClick={handlePagar}
                className='bg-green-600 text-white px-4 py-2'>
                Pagar
                </button>
                <p className='mt-4'>{status}</p>
        </div>
    );
}
