package com.example.event_management.configuration;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.*;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // prefix cho broker (client subscribe)
        registry.enableSimpleBroker("/topic");
        // prefix cho gửi message từ client tới server
        registry.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // endpoint để client connect websocket
        registry.addEndpoint("/ws-event").setAllowedOriginPatterns("*").withSockJS();
    }
}
