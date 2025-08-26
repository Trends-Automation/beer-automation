package com.beerautomation.backend.controller;

import com.beerautomation.backend.model.PagamentoRequest;
import com.beerautomation.backend.model.PagamentoResponse;
import com.beerautomation.backend.model.WebhookRequest;
import com.beerautomation.backend.service.ArduinoService;
import com.beerautomation.backend.service.MercadoPagoService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.List;

@RestController
@RequestMapping("/pagamento")
public class PagamentoController {
    private final MercadoPagoService mercadoPagoService;
    private final ArduinoService arduinoService;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public PagamentoController(MercadoPagoService mercadoPagoService, ArduinoService arduinoService) {
        this.mercadoPagoService = mercadoPagoService;
        this.arduinoService = arduinoService;
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
    }

    @PostMapping
    public ResponseEntity<?> criarIntencao(@RequestBody PagamentoRequest request) {
        try {
            double valor = Double.parseDouble(request.getValor());
            String id = mercadoPagoService.criarIntencaoPagamento(valor, request.getMetodo(), request.getVolumes());
            return ResponseEntity.ok(new PagamentoResponse(id, "Pagamento iniciado na maquininha"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Erro: " + e.getMessage());
        }
    }

    @PostMapping("/pix")
    public ResponseEntity<?> criarPix(@RequestBody PagamentoRequest request) {
        try {
            double valor = Double.parseDouble(request.getValor());
            String qrCode = mercadoPagoService.criarPix(valor, request.getVolumes());
            return ResponseEntity.ok(new PagamentoResponse(null, qrCode));
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Erro: " + e.getMessage());
        }
    }

    @PostMapping("/webhook")
    public ResponseEntity<?> receberWebhook(@RequestBody WebhookRequest request) {
        try {
            System.out.println("--- WEBHOOK RECEBIDO ---");
            System.out.println("Tipo de webhook: " + request.getType());
            boolean aprovado;
            String description;
            if ("payment".equals(request.getType())) {
                aprovado = mercadoPagoService.verificarPagamento(request.getData().getId());
                // Obter descrição via API
                HttpHeaders headers = new HttpHeaders();
                headers.setBearerAuth(mercadoPagoService.getAccessToken());
                HttpEntity<String> entity = new HttpEntity<>(headers);
                ResponseEntity<String> response = restTemplate.exchange(
                        "https://api.mercadopago.com/v1/payments/" + request.getData().getId(),
                        HttpMethod.GET,
                        entity,
                        String.class
                );
                description = objectMapper.readTree(response.getBody()).get("description").asText();
            } else if ("payment_intent".equals(request.getType())) {
                aprovado = mercadoPagoService.verificarIntencao(request.getData().getId());
                // Obter descrição via API
                HttpHeaders headers = new HttpHeaders();
                headers.setBearerAuth(mercadoPagoService.getAccessToken());
                HttpEntity<String> entity = new HttpEntity<>(headers);
                ResponseEntity<String> response = restTemplate.exchange(
                        "https://api.mercadopago.com/point/integration-api/payment-intents/" + request.getData().getId(),
                        HttpMethod.GET,
                        entity,
                        String.class
                );
                description = objectMapper.readTree(response.getBody()).get("description").asText();
            } else {
                return ResponseEntity.badRequest().body("Tipo de webhook inválido");
            }
            if (aprovado) {
                System.out.println("Pagamento aprovado! Iniciando liberação do chopp...");
                List<Integer> volumes = mercadoPagoService.extrairVolumes(description);
                for (int ml : volumes) {
                    String resultado = arduinoService.liberarChopp(ml);
                    System.out.println("Liberado: " + ml + "ml - " + resultado);
                }
                return ResponseEntity.ok("Chopp liberado: " + volumes);
            }
            return ResponseEntity.badRequest().body("Pagamento não aprovado");
        } catch (Exception e) {
            System.err.println("Erro no webhook: " + e.getMessage());
            return ResponseEntity.status(500).body("Erro: " + e.getMessage());
        }
    }
}