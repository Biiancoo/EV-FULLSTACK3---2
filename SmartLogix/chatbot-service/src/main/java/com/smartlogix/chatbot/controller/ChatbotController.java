package com.smartlogix.chatbot.controller;

import com.smartlogix.chatbot.dto.ChatRequest;
import com.smartlogix.chatbot.dto.ChatResponse;
import com.smartlogix.chatbot.service.ChatbotService;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/chat")
public class ChatbotController {

    private final ChatbotService chatbotService;

    public ChatbotController(ChatbotService chatbotService) {
        this.chatbotService = chatbotService;
    }

    @PostMapping("/ask")
    public ChatResponse ask(
            @Valid @RequestBody ChatRequest request,
            @RequestHeader(HttpHeaders.AUTHORIZATION) String authHeader) {
        return chatbotService.ask(request.question(), authHeader);
    }
}
