package com.beerautomation.backend.controller;

import com.beerautomation.backend.model.PagamentoRequest;
import com.beerautomation.backend.model.PagamentoResponse;
import com.beerautomation.backend.model.WebhookRequest;
import com.beerautomation.backend.service.ArduinoService;
import com.beerautomation.backend.service.MercadoPagoService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/pagamento")
public class PagamentoController {
    private final MercadoPagoService mercadoPagoService;
    private final ArduinoService arduinoService;

    public PagamentoController(MercadoPagoService mercadoPagoService, ArduinoService arduinoService) {
        this.mercadoPagoService = mercadoPagoService;
        this.arduinoService = arduinoService;
    }

    @PostMapping
    public ResponseEntity<?> criarIntencao(@RequestBody PagamentoRequest request) {
        try {
            System.out.println("--- CRIANDO INTENÇÃO DE PAGAMENTO ---");
            System.out.println("Método: " + request.getMetodo());
            System.out.println("Items: " + request.getItems().size());

            if(request.getItems() == null || request.getItems().isEmpty()) {
                return ResponseEntity.badRequest().body("Erro: Lista de items não pode estar vazia");
            }

            if(request.getMetodo() == null || request.getMetodo().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Erro: Método de pagamento é obrigatório");
            }
            System.out.println("Verificando status da maquininha...");
            if (!mercadoPagoService.isDeviceOnline(mercadoPagoService.getDeviceId())) {
                System.err.println("Maquininha offline - Device ID: " + mercadoPagoService.getDeviceId());
                return ResponseEntity.status(503).body("Erro: Maquininha não está online. Verifique a conexão.");
            }

            System.out.println("Maquininha está online, criando intenção...");
            String id = mercadoPagoService.criarIntencaoPagamento(request.getMetodo(), request.getItems());
            System.out.println("Intenção criada com sucesso: " + id);
            return ResponseEntity.ok(new PagamentoResponse(id, "Pagamento iniciado na maquininha"));

        } catch(Exception e) {
            System.err.println("Erro ao criar intenção de pagamento: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body("Erro: " + e.getMessage());
        }
    }

    @PostMapping("/pix")
    public ResponseEntity<?> criarPix(@RequestBody PagamentoRequest request) {
        try {
            String qrCode = mercadoPagoService.criarPix(request.getItems());
            return ResponseEntity.ok(new PagamentoResponse(null, qrCode));
        } catch(Exception e) {
            return ResponseEntity.status(500).body("Erro: " + e.getMessage());
        }
    }

    @PostMapping("/webhook")
    public ResponseEntity<?> receberWebhook(@RequestBody WebhookRequest request) {
        try {
            System.out.println("--- WEBHOOK RECEBIDO ---");
            System.out.println("Tipo de webhook: " + request.getType());
            System.out.println("ID: " + request.getData().getId());
            boolean aprovado = false;
            String description = "Chopp 300ml"; // valor padrão

            if("payment".equals(request.getType())) {
                System.out.println("Processando webhook de pagamento PIX...");
                aprovado = mercadoPagoService.verificarPagamento(request.getData().getId());

            } else if("payment_intent".equals(request.getType())) {
                System.out.println("Processando webhook de intenção de pagamento (maquininha)...");
                aprovado = mercadoPagoService.verificarIntencao(request.getData().getId());

            } else {
                System.err.println("Tipo de webhook não reconhecido: " + request.getType());
                return ResponseEntity.badRequest().body("Tipo de webhook inválido: " + request.getType());
            }

            if(aprovado) {
                System.out.println("✓ Pagamento aprovado! Iniciando liberação do chopp...");

                // para teste, vou usar uma descrição padrão
                // melhorar depois buscando a descrição da API
                List<Integer> volumes = mercadoPagoService.extrairVolumes(description);

                for(int ml : volumes) {
                    try {
                        String resultado = arduinoService.liberarChopp(ml);
                        System.out.println("✓ Liberado: " + ml + "ml - " + resultado);
                    } catch(Exception e) {
                        System.err.println("Erro ao liberar chopp de " + ml + "ml: " + e.getMessage());
                    }
                }

                return ResponseEntity.ok("Chopp liberado com sucesso: " + volumes + "ml");
            } else {
                System.out.println("✗ Pagamento não foi aprovado");
                return ResponseEntity.badRequest().body("Pagamento não aprovado");
            }

        } catch(Exception e) {
            System.err.println("Erro no processamento do webhook: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body("Erro interno: " + e.getMessage());
        }
    }
}