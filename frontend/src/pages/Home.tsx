import axios from 'axios';
import { useState } from 'react';
import Header from '../components/Header';

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
    <div className="min-h-screen bg-gray-50">
      <Header companyName="Beer Automation" />

      <main className="container mx-auto px-6 py-12">
        <div className="max-w-2xl mx-auto">
          {status && (
            <div className="mb-12 p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
              <div className="flex items-center justify-center">
                <div className="w-4 h-4 bg-amber-400 rounded-full mr-3 animate-pulse"></div>
                <p className="text-slate-800 font-medium tracking-wide">{status}</p>
              </div>
            </div>
          )}

          <div className="mb-12">
            <h3 className="text-2xl font-light text-slate-900 mb-8 text-center tracking-wide">
              Selecione o volume desejado
            </h3>
            <div className="grid grid-cols-3 gap-6">
              {VOLUMES.map(ml => (
                <button
                  key={ml}
                  className={`group relative overflow-hidden rounded-2xl border-2 transition-all duration-300 hover:scale-105 ${selectedVolume === ml
                      ? 'border-slate-900 bg-slate-900 text-white shadow-xl'
                      : 'border-slate-200 bg-white text-slate-900 hover:border-slate-300 hover:shadow-lg'
                    }`}
                  onClick={() => setSelectedVolume(ml)}
                >
                  <div className="p-8">
                    <div className="text-3xl font-light mb-2">{ml}</div>
                    <div className="text-sm font-medium tracking-widest opacity-70">ML</div>
                  </div>
                  {selectedVolume === ml && (
                    <div className="absolute top-4 right-4">
                      <div className="w-3 h-3 bg-amber-400 rounded-full"></div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <button
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-6 rounded-2xl disabled:bg-slate-400 disabled:cursor-not-allowed transition-all duration-300 text-xl tracking-wide shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:transform-none disabled:hover:scale-100"
            onClick={handlePayment}
            disabled={isProcessing || !selectedVolume}
          >
            {isProcessing ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                Gerando PIX...
              </div>
            ) : (
              'Pagar com PIX'
            )}
          </button>

          {qrCodeBase64 && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-auto transform transition-all">
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-center">
                    <h3 className="text-2xl font-light text-slate-900 tracking-wide">
                      Pagamento PIX
                    </h3>
                    <button
                      onClick={() => {
                        setQrCodeBase64(null);
                        setSelectedVolume(null);
                      }}
                    >
                    </button>
                  </div>
                </div>

                <div className="p-8 text-center">
                  <div className="mb-8 p-4 bg-gray-50 rounded-xl">
                    <div className="text-sm font-medium text-slate-600 mb-1 tracking-widest uppercase">
                      Resumo do Pedido
                    </div>
                    <div className="text-2xl font-light text-slate-900 mb-1">
                      {selectedVolume}ml
                    </div>
                    <div className="text-3xl font-light text-slate-900">
                      R$ {selectedVolume ? calculatePrice(selectedVolume) : '0.00'}
                    </div>
                  </div>

                  <div className="mb-8">
                    <p className="text-lg text-slate-600 font-light mb-6">
                      Escaneie o QR Code com seu app de pagamento
                    </p>
                    <div className="p-6 bg-white border-2 border-gray-100 rounded-xl inline-block shadow-sm">
                      <img
                        src={`data:image/png;base64,${qrCodeBase64}`}
                        alt="QR Code PIX"
                        className="w-64 h-64 mx-auto"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <button
                      onClick={() => {
                        setQrCodeBase64(null);
                        setSelectedVolume(null);
                      }}
                      className="w-full bg-gray-100 hover:bg-gray-200 text-slate-700 font-medium py-3 rounded-xl transition-all duration-300 tracking-wide"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}