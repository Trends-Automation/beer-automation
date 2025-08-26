package com.beerautomation.backend.service;

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

    public String criarIntencaoPagamento(double valor, String metodo, String[] volumes) throws Exception {
        int amountInCents = (int) (valor * 100);
        String paymentType = metodo.equals("debito") ? "debit_card" : "credit_card";
        String description = "Chopp " + String.join(" + ", volumes) + "ml";

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);
        headers.set("Content-Type", "application/json");

        String body = String.format("{\"amount\": %d, \"description\": \"%s\", \"payment_type\": \"%s\"}",
                amountInCents, description, paymentType);
        HttpEntity<String> entity = new HttpEntity<>(body, headers);

        ResponseEntity<String> response = restTemplate.exchange(
                "https://api.mercadopago.com/point/integration-api/devices/" + deviceId + "/payment-intents",
                HttpMethod.POST,
                entity,
                String.class
        );

        String responseBody = response.getBody();
        return objectMapper.readTree(responseBody).get("id").asText();
    }

    public String criarPix(double valor, String[] volumes) throws Exception {
        String description = "Chopp " + String.join(" + ", volumes) + "ml";
        PaymentCreateRequest request = PaymentCreateRequest.builder()
                .transactionAmount(BigDecimal.valueOf(valor))
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
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);

        HttpEntity<String> entity = new HttpEntity<>(headers);
        ResponseEntity<String> response = restTemplate.exchange(
                "https://api.mercadopago.com/point/integration-api/payment-intents/" + intentId,
                HttpMethod.GET,
                entity,
                String.class
        );

        String responseBody = response.getBody();
        var jsonNode = objectMapper.readTree(responseBody);
        String state = jsonNode.get("state").asText();
        String status = jsonNode.get("payment").get("status").asText();
        return "finished".equals(state) && "approved".equals(status);
    }

    public List<Integer> extrairVolumes(String description) {
        List<Integer> volumes = new ArrayList<>();
        Pattern pattern = Pattern.compile("(\\d+)ml");
        Matcher matcher = pattern.matcher(description);
        while (matcher.find()) {
            volumes.add(Integer.parseInt(matcher.group(1)));
        }
        return volumes.isEmpty() ? List.of(300) : volumes; // Padrão 300ml
    }
}