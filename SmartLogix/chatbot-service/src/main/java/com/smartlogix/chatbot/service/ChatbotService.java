package com.smartlogix.chatbot.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartlogix.chatbot.dto.ChatResponse;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class ChatbotService {

    private static final Logger log = LoggerFactory.getLogger(ChatbotService.class);

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${services.gateway:http://localhost:8080}")
    private String gatewayUrl;

    @Value("${gemini.api.key:}")
    private String geminiApiKey;

    @Value("${gemini.api.model:gemini-2.0-flash}")
    private String geminiModel;

    @Value("${gemini.api.enabled:true}")
    private boolean geminiEnabled;

    public ChatbotService() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(5));
        factory.setReadTimeout(Duration.ofSeconds(15));
        this.restTemplate = new RestTemplate(factory);
    }

    public ChatResponse ask(String question, String authToken) {
        log.info("Chatbot recibio pregunta: {}", question);
        log.info("Gemini enabled: {}, key present: {}", geminiEnabled, (geminiApiKey != null && !geminiApiKey.isBlank()));

        if (!geminiEnabled || geminiApiKey == null || geminiApiKey.isBlank()) {
            log.info("Gemini API no configurada. Usando respuesta de fallback.");
            return fallbackResponse(question);
        }

        try {
            String contextData = fetchContextData(authToken);
            String prompt = buildPrompt(question, contextData);
            String answer = callGemini(prompt);
            log.info("Respuesta de Gemini recibida correctamente.");
            return new ChatResponse(answer, "GEMINI");
        } catch (Exception e) {
            log.warn("Error al llamar a Gemini API: {}. Usando fallback.", e.getMessage(), e);
            return fallbackResponse(question);
        }
    }

    private String fetchContextData(String authToken) {
        StringBuilder sb = new StringBuilder();
        sb.append("=== DATOS ACTUALES DEL SISTEMA ===\n\n");

        sb.append("-- INVENTARIO --\n");
        try {
            List<?> inventory = fetchList("/api/inventory/items", authToken);
            sb.append(objectMapper.writeValueAsString(inventory)).append("\n\n");
        } catch (Exception e) {
            sb.append("No disponible: ").append(e.getMessage()).append("\n\n");
        }

        sb.append("-- ORDENES --\n");
        try {
            List<?> orders = fetchList("/api/orders", authToken);
            sb.append(objectMapper.writeValueAsString(orders)).append("\n\n");
        } catch (Exception e) {
            sb.append("No disponible: ").append(e.getMessage()).append("\n\n");
        }

        sb.append("-- ENVIOS --\n");
        try {
            List<?> shipments = fetchList("/api/shipments", authToken);
            sb.append(objectMapper.writeValueAsString(shipments)).append("\n\n");
        } catch (Exception e) {
            sb.append("No disponible: ").append(e.getMessage()).append("\n\n");
        }

        return sb.toString();
    }

    @SuppressWarnings("unchecked")
    private List<?> fetchList(String path, String authToken) {
        HttpHeaders headers = new HttpHeaders();
        headers.set(HttpHeaders.AUTHORIZATION, authToken);
        headers.setAccept(List.of(MediaType.APPLICATION_JSON));
        HttpEntity<Void> entity = new HttpEntity<>(headers);

        String url = gatewayUrl + path;
        log.debug("Consultando microservicio: {}", url);
        List<?> result = restTemplate.exchange(url, HttpMethod.GET, entity, List.class).getBody();
        return result != null ? result : List.of();
    }

    private String buildPrompt(String question, String contextData) {
        return "Eres un asistente de soporte tecnico de la plataforma SmartLogix (logistica eCommerce).\n\n"
                + contextData + "\n\n"
                + "El usuario pregunta: \"" + question + "\"\n\n"
                + "Instrucciones:\n"
                + "- Responde SOLO usando los datos del sistema proporcionados arriba.\n"
                + "- Si no tienes la informacion, di que no tienes acceso a esos datos en este momento.\n"
                + "- Responde en español, de forma clara, concisa y profesional.\n"
                + "- No inventes datos.\n"
                + "- Si la pregunta no tiene relacion con logistica, inventario, ordenes o envios, indica amablemente que solo puedes ayudar con temas de la plataforma SmartLogix.\n\n"
                + "Respuesta:";
    }

    private String callGemini(String prompt) throws Exception {
        String url = String.format(
                "https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s",
                geminiModel, geminiApiKey);

        log.info("Llamando a Gemini API: modelo={}, url (truncada)...", geminiModel);

        Map<String, Object> body = Map.of(
                "contents", List.of(Map.of(
                        "parts", List.of(Map.of("text", prompt))
                )),
                "generationConfig", Map.of(
                        "temperature", 0.3,
                        "maxOutputTokens", 1024
                )
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

        Map<String, Object> response = restTemplate.postForObject(url, request, Map.class);
        log.debug("Respuesta cruda de Gemini recibida.");
        return extractTextFromResponse(response);
    }

    @SuppressWarnings("unchecked")
    private String extractTextFromResponse(Map<String, Object> response) {
        if (response == null) {
            throw new RuntimeException("Respuesta vacia de Gemini");
        }
        List<Map<String, Object>> candidates = (List<Map<String, Object>>) response.get("candidates");
        if (candidates == null || candidates.isEmpty()) {
            throw new RuntimeException("No hay candidates en respuesta de Gemini");
        }
        Map<String, Object> content = (Map<String, Object>) candidates.get(0).get("content");
        List<Map<String, Object>> parts = (List<Map<String, Object>>) content.get("parts");
        if (parts == null || parts.isEmpty()) {
            throw new RuntimeException("No hay parts en respuesta de Gemini");
        }
        String text = (String) parts.get(0).get("text");
        return text != null ? text.trim() : "";
    }

    private ChatResponse fallbackResponse(String question) {
        String lower = question.toLowerCase();
        String answer;
        if (lower.contains("hola") || lower.contains("buenos dias") || lower.contains("buenas")) {
            answer = "Hola! Soy el asistente de soporte de SmartLogix. Puedo ayudarte con consultas sobre inventario, ordenes y envios. En este momento la IA no esta disponible, pero estoy usando mi conocimiento basico.";
        } else if (lower.contains("inventario") || lower.contains("stock") || lower.contains("producto")) {
            answer = "Para consultar el inventario actual, ve a la pestana 'Inventario' en el menu lateral. Alli podras ver todos los productos, sus stocks y usar el analisis de IA para recomendaciones.";
        } else if (lower.contains("orden") || lower.contains("pedido")) {
            answer = "Para ver las ordenes, ve a la pestana 'Ordenes' en el menu lateral. Puedes crear nuevas ordenes y ver el historial.";
        } else if (lower.contains("envio") || lower.contains("shipment")) {
            answer = "Para gestionar envios, ve a la pestana 'Envios' en el menu lateral. Puedes crear envios, cambiar estados y hacer seguimiento.";
        } else {
            answer = "Entiendo tu pregunta. En este momento la IA avanzada no esta disponible, pero puedo orientarte: usa el menu lateral para navegar entre Inventario, Ordenes y Envios. Si necesitas algo especifico, intenta reformular tu pregunta.";
        }
        return new ChatResponse(answer, "RULES");
    }
}
