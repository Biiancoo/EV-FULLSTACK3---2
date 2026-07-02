package com.smartlogix.inventory.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartlogix.inventory.domain.InventoryItem;
import com.smartlogix.inventory.dto.InventoryRecommendationResponse;
import com.smartlogix.inventory.repository.InventoryItemRepository;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class AiRecommendationService {

    private static final Logger log = LoggerFactory.getLogger(AiRecommendationService.class);

    private final InventoryItemRepository repository;
    private final InventoryService fallbackService;
    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${gemini.api.key:}")
    private String geminiApiKey;

    @Value("${gemini.api.model:gemini-2.0-flash}")
    private String geminiModel;

    @Value("${gemini.api.enabled:true}")
    private boolean geminiEnabled;

    public AiRecommendationService(InventoryItemRepository repository, InventoryService fallbackService) {
        this.repository = repository;
        this.fallbackService = fallbackService;
        this.objectMapper = new ObjectMapper();
    }

    public List<InventoryRecommendationResponse> getRecommendations() {
        if (!geminiEnabled || geminiApiKey == null || geminiApiKey.isBlank()) {
            log.info("Gemini API no configurada. Usando fallback de reglas.");
            return fallbackService.getRecommendations();
        }

        try {
            return callGemini();
        } catch (Exception e) {
            log.warn("Error al llamar a Gemini API: {}. Usando fallback de reglas.", e.getMessage());
            return fallbackService.getRecommendations();
        }
    }

    private List<InventoryRecommendationResponse> callGemini() throws Exception {
        List<InventoryItem> items = repository.findAll();

        String prompt = buildPrompt(items);

        String url = "https://api.groq.com/openai/v1/chat/completions";

        log.info("Llamando a Groq API con modelo: {}", geminiModel);

        Map<String, Object> body = Map.of(
                "model", geminiModel,
                "messages", List.of(Map.of(
                        "role", "user",
                        "content", prompt
                ))
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", "Bearer " + geminiApiKey);
        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

        Map<String, Object> response = restTemplate.postForObject(url, request, Map.class);

        String rawJson = extractTextFromResponse(response);
        log.debug("Respuesta cruda de Groq: {}", rawJson);

        // Limpiar posibles markdown ```json ... ```
        String cleanJson = rawJson.replaceAll("(?s)```json\\s*", "").replaceAll("(?s)\\s*```", "").trim();

        List<RawRecommendation> raw = objectMapper.readValue(cleanJson, new TypeReference<List<RawRecommendation>>() {});

        OffsetDateTime now = OffsetDateTime.now();
        return raw.stream().map(r -> new InventoryRecommendationResponse(
                r.sku(),
                r.productName(),
                r.warehouseCode(),
                r.currentStock(),
                r.reservedStock(),
                r.reorderLevel(),
                r.recommendedQuantity(),
                r.urgency(),
                r.reason(),
                now,
                r.source() != null ? r.source() : "AI"
        )).toList();
    }

    private String buildPrompt(List<InventoryItem> items) {
        StringBuilder sb = new StringBuilder();
        sb.append("Eres un asistente inteligente de logistica y gestion de inventario. "
                + "Analiza los siguientes productos del inventario y recomienda que pedir y en que cantidad.\n\n");
        sb.append("Reglas de negocio para tu analisis:\n");
        sb.append("- CRITICAL: stock disponible <= nivel de reorden (urgente, reorden inmediata)\n");
        sb.append("- HIGH: stock disponible <= nivel de reorden * 2 (pronto necesitaras reordenar)\n");
        sb.append("- MEDIUM: mas del 50% del stock esta reservado (stock comprometido, pedido preventivo)\n");
        sb.append("- LOW: niveles saludables, reorden menor preventiva\n\n");
        sb.append("Datos del inventario actual:\n");

        for (InventoryItem item : items) {
            sb.append(String.format(
                    "- SKU: %s | Producto: %s | Bodega: %s | Disponible: %d | Reservado: %d | Reorden: %d\n",
                    item.getSku(), item.getProductName(), item.getWarehouseCode(),
                    item.getAvailableQuantity(), item.getReservedQuantity(), item.getReorderLevel()
            ));
        }

        sb.append("\nResponde UNICAMENTE con un array JSON valido. No incluyas explicaciones, markdown ni texto extra. "
                + "Formato exacto de cada objeto del array:\n");
        sb.append("{\"sku\":\"...\",\"productName\":\"...\",\"warehouseCode\":\"...\",\"currentStock\":N,"
                + "\"reservedStock\":N,\"reorderLevel\":N,\"recommendedQuantity\":N,"
                + "\"urgency\":\"CRITICAL|HIGH|MEDIUM|LOW\",\"reason\":\"...\",\"source\":\"AI\"}\n");
        sb.append("\nRazona como un experto de logistica y da recomendaciones realistas.");

        return sb.toString();
    }

    @SuppressWarnings("unchecked")
    private String extractTextFromResponse(Map<String, Object> response) {
        if (response == null) {
            throw new RuntimeException("Respuesta vacia de OpenRouter");
        }
        List<Map<String, Object>> choices = (List<Map<String, Object>>) response.get("choices");
        if (choices == null || choices.isEmpty()) {
            throw new RuntimeException("No hay choices en respuesta de OpenRouter");
        }
        Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
        if (message == null) {
            throw new RuntimeException("No hay message en choice de OpenRouter");
        }
        String content = (String) message.get("content");
        return content != null ? content.trim() : "";
    }

    private record RawRecommendation(
            String sku,
            String productName,
            String warehouseCode,
            int currentStock,
            int reservedStock,
            int reorderLevel,
            int recommendedQuantity,
            String urgency,
            String reason,
            String source
    ) {}
}
