package com.beerautomation.backend.service;

import com.beerautomation.backend.model.ItemRequest;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mercadopago.MercadoPagoConfig;
import com.mercadopago.client.payment.PaymentClient;
import com.mercadopago.client.payment.PaymentCreateRequest;
import com.mercadopago.resources.payment.Payment;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import javax.annotation.PostConstruct;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class MercadoPagoService {
    @Value("${mercado.pago.access.token}")
    private String accessToken;

    @Value("${mercado.pago.device.id}")
    private String deviceId;

    private PaymentClient paymentClient;
    private RestTemplate restTemplate;
    private ObjectMapper objectMapper;

    @PostConstruct
    public void init() {
        MercadoPagoConfig.setAccessToken(accessToken);
        paymentClient = new PaymentClient();
        restTemplate = new RestTemplate();
        objectMapper = new ObjectMapper();
    }

    public String getAccessToken() {
        return accessToken;
    }

    public String getDeviceId() {
        return deviceId;
    }

    public String criarIntencaoPagamento(String metodo, List<ItemRequest> items) throws Exception {
        try {
            int totalAmount = items.stream().mapToInt(item -> (int) (item.getUnitPrice() * item.getQuantity() * 100)).sum(); // Centavos
            String paymentType = metodo.equals("debito") ? "debit_card" : "credit_card";
            String description = items.stream()
                    .map(item -> item.getQuantity() + "x " + item.getTitle())
                    .collect(Collectors.joining(" + "));

            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(accessToken);
            headers.set("Content-Type", "application/json");

            String body = String.format("{\"amount\": %d, \"description\": \"%s\", \"payment_type\": \"%s\"}",
                    totalAmount, description, paymentType);

            System.out.println("Criando intenção de pagamento:");
            System.out.println("Body da requisição: " + body);
            System.out.println("Payment Type: " + paymentType);
            System.out.println("Total Amount: " + totalAmount + " centavos");

            HttpEntity<String> entity = new HttpEntity<>(body, headers);

            ResponseEntity<String> response = restTemplate.exchange(
                    "https://api.mercadopago.com/point/integration-api/devices/" + deviceId + "/payment-intents",
                    HttpMethod.POST,
                    entity,
                    String.class
            );

            System.out.println("Resposta completa da API (criarIntencaoPagamento): " + response.getBody());
            System.out.println("Status da resposta: " + response.getStatusCode());

            JsonNode responseBody = objectMapper.readTree(response.getBody());
            JsonNode idNode = responseBody.get("id");
            if(idNode == null || idNode.isNull()) {
                System.err.println("Campo 'id' não encontrado na resposta da API");
                System.err.println("Campos disponíveis na resposta:");
                responseBody.fieldNames().forEachRemaining(field ->
                        System.err.println("- " + field + ": " + responseBody.get(field))
                );
                JsonNode errorNode = responseBody.get("error");
                if(errorNode != null) {
                    System.err.println("Erro da API: " + errorNode);
                    throw new Exception("Erro ao criar intenção de pagamento: " + errorNode.asText());
                }

                throw new Exception("Resposta da API não contém campo 'id'");
            }

            String intentId = idNode.asText();
            System.out.println("✓ Intenção de pagamento criada com sucesso. ID: " + intentId);
            return intentId;

        } catch(Exception e) {
            System.err.println("Erro ao criar intenção de pagamento: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    public String criarPix(List<ItemRequest> items) throws Exception {
        double totalValor = items.stream().mapToDouble(item -> item.getUnitPrice() * item.getQuantity()).sum();
        String description = items.stream()
                .map(item -> item.getQuantity() + "x " + item.getTitle())
                .collect(Collectors.joining(" + "));

        PaymentCreateRequest request = PaymentCreateRequest.builder()
                .transactionAmount(BigDecimal.valueOf(totalValor))
                .description(description)
                .paymentMethodId("pix")
                .payer(com.mercadopago.client.payment.PaymentPayerRequest.builder()
                        .email("cliente@exemplo.com")
                        .build())
                .build();
        Payment payment = paymentClient.create(request);
        return payment.getPointOfInteraction().getTransactionData().getQrCode();
    }

    public boolean verificarPagamento(String paymentId) throws Exception {
        Payment payment = paymentClient.get(Long.parseLong(paymentId));
        return "approved".equals(payment.getStatus());
    }

    public boolean verificarIntencao(String intentId) throws Exception {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(accessToken);

            HttpEntity<String> entity = new HttpEntity<>(headers);
            ResponseEntity<String> response = restTemplate.exchange(
                    "https://api.mercadopago.com/point/integration-api/payment-intents/" + intentId,
                    HttpMethod.GET,
                    entity,
                    String.class
            );

            System.out.println("Resposta completa da API (verificarIntencao): " + response.getBody());
            JsonNode jsonNode = objectMapper.readTree(response.getBody());

            JsonNode stateNode = jsonNode.get("state");
            if(stateNode == null) {
                System.err.println("Campo 'state' não encontrado na resposta");
                System.err.println("Campos disponíveis: " + jsonNode.fieldNames());
                return false;
            }

            String state = stateNode.asText();
            System.out.println("Estado da intenção: " + state);
            if("FINISHED".equals(state)) {
                System.out.println("✓ Estado FINISHED - Pagamento aprovado pela maquininha");

                JsonNode paymentNode = jsonNode.get("payment");
                if(paymentNode != null) {
                    JsonNode paymentIdNode = paymentNode.get("id");
                    JsonNode typeNode = paymentNode.get("type");
                    if(paymentIdNode != null) {
                        System.out.println("Payment ID: " + paymentIdNode.asText());
                    }
                    if(typeNode != null) {
                        System.out.println("Tipo de pagamento: " + typeNode.asText());
                    }
                }
                return true;
            }

            if("CANCELED".equals(state) || "CANCELLED".equals(state)) {
                System.out.println("✗ Pagamento cancelado");
                return false;
            }

            if("ERROR".equals(state)) {
                System.out.println("✗ Erro no pagamento");
                return false;
            }

            if("OPEN".equals(state) || "PROCESSING".equals(state)) {
                System.out.println("⏳ Pagamento ainda pendente - State: " + state);
                return false;
            }
            System.out.println("⚠ Estado não reconhecido: " + state + " - Considerando como não aprovado");
            return false;

        } catch(Exception e) {
            System.err.println("Erro ao verificar intenção de pagamento: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    public List<Integer> extrairVolumes(String description) {
        if(description == null || description.trim().isEmpty()) {
            System.out.println("Descrição vazia, usando volume padrão de 300ml");
            return List.of(300);
        }

        List<Integer> volumes = new ArrayList<>();
        Pattern pattern = Pattern.compile("(\\d+)ml");
        Matcher matcher = pattern.matcher(description);
        while (matcher.find()) {
            volumes.add(Integer.parseInt(matcher.group(1)));
        }

        if(volumes.isEmpty()) {
            System.out.println("Nenhum volume encontrado na descrição '" + description + "', usando 300ml padrão");
            return List.of(300);
        }

        System.out.println("Volumes extraídos da descrição '" + description + "': " + volumes);
        return volumes;
    }

    public boolean isDeviceOnline(String deviceId) throws Exception {
        try {
            HttpHeaders headers  =new HttpHeaders();
            headers.setBearerAuth(accessToken);
            HttpEntity<String> entity = new HttpEntity<>(headers);
            ResponseEntity<String> response  =restTemplate.exchange(
                    "https://api.mercadopago.com/point/integration-api/devices",
                    HttpMethod.GET,
                    entity,
                    String.class
            );
            System.out.println("Resposta da API de devices: " + response.getBody());
            JsonNode root = objectMapper.readTree(response.getBody());
            JsonNode devices = root.path("devices");

            if(devices.isArray()) {
                for(JsonNode device : devices) {
                    JsonNode idNode = device.get("id");
                    JsonNode statusNode = device.get("status");
                    if(idNode != null && statusNode != null) {
                        if(deviceId.equals(idNode.asText())) {
                            System.out.println("Status da maquininha: " + statusNode.asText());
                            return "online".equals(statusNode.asText());
                        }
                    }
                }
            }
            System.err.println("Dispositivo com ID " + deviceId + " não encontrado ou offline.");
            return false;
        }catch(Exception e){
            System.err.println("Erro ao verificar status do dispositivo: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }
}