import axios from 'axios';
import { useState } from 'react';

interface ChoppOrder {
    ml: number;
    valor: string;
}

const API_BASE_URL = 'http://localhost:3001';
const PRICE_PER_LITER = 10;

const VOLUMES = [300, 500, 700];

const calculatePrice = (volumeInMl: number): string => {
    return (volumeInMl / 1000 * PRICE_PER_LITER).toFixed(2);
};

const apiService = {
    async processPayment(order: ChoppOrder): Promise<string> {
        const response = await axios.post(`${API_BASE_URL}/pagamento/pix`, order);
        return response.data.qrCodeBase64;
    },

    async releaseChopp(ml: number): Promise<string> {
        const response = await axios.post(`${API_BASE_URL}/dispenser/liberar`, { ml });
        return response.data.message;
    }
};

export default function Home() {
    const [selectedVolume, setSelectedVolume] = useState<number | null>(null);
    const [status, setStatus] = useState('');
    const [qrCodeBase64, setQrCodeBase64] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const handlePayment = async () => {
        if (!selectedVolume) {
            setStatus('Selecione o volume do chopp');
            return;
        }

        setStatus('Processando pagamento...');
        setIsProcessing(true);

        const order: ChoppOrder = {
            ml: selectedVolume,
            valor: calculatePrice(selectedVolume)
        };

        try {
            const qrCode = await apiService.processPayment(order);
            setQrCodeBase64(qrCode);
            setStatus('');
        } catch (error) {
            console.error('Erro ao processar pagamento no frontend:', error);
            setStatus('Erro ao processar o pagamento. Tente novamente.');
        } finally {
            setIsProcessing(false);
        }
    };

    const confirmPayment = async () => {
        setStatus('Liberando chopp...');
        try {
            const message = await apiService.releaseChopp(selectedVolume!);
            setStatus(message);
            setTimeout(() => {
                setSelectedVolume(null);
                setQrCodeBase64(null);
                setStatus('');
            }, 3000);
        } catch (error) {
            console.error('Erro ao liberar chopp no frontend:', error);
            setStatus('Erro ao liberar o chopp. Tente novamente.');
        }
    };

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <div className="mb-8">
                <h2 className="text-2xl font-bold mb-4">Volume</h2>
                <div className="grid grid-cols-3 gap-4">
                    {VOLUMES.map(ml => (
                        <button
                            key={ml}
                            className={`p-6 text-xl font-semibold rounded-lg transition-all ${selectedVolume === ml
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-200 hover:bg-gray-300'
                                }`}
                            onClick={() => setSelectedVolume(ml)}
                        >
                            {ml} ml
                        </button>
                    ))}
                </div>
            </div>

            {selectedVolume && (
                <div className="mb-8 p-6 bg-green-50 rounded-lg border-2 border-green-200">
                    <div className="text-center">
                        <p className="text-lg mb-2">{selectedVolume}ml</p>
                        <p className="text-3xl font-bold text-green-600">
                            R$ {calculatePrice(selectedVolume)}
                        </p>
                    </div>
                </div>
            )}

            <button
                className="w-full bg-green-600 hover:bg-green-700 text-white text-2xl font-bold py-6 rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed transition-all"
                onClick={handlePayment}
                disabled={isProcessing || !selectedVolume} // Ajustado para só depender de selectedVolume
            >
                {isProcessing ? 'Gerando PIX...' : 'Pagar com PIX'}
            </button>

            {qrCodeBase64 && (
                <div className="mt-8 p-6 bg-white border-2 border-gray-200 rounded-lg text-center">
                    <h3 className="text-xl font-bold mb-4">Escaneie para Pagar</h3>
                    <img
                        src={`data:image/png;base64,${qrCodeBase64}`}
                        alt="QR Code PIX"
                        className="mx-auto w-64 h-64 mb-4"
                    />
                    <button
                        className="bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold px-8 py-4 rounded-lg transition-all"
                        onClick={confirmPayment}
                    >
                        Confirmar Pagamento
                    </button>
                </div>
            )}
        </div>
    );
}