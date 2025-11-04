package com.campustrack.lostandfound.websocket;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        // Create handler via bean so dependencies can be injected
        registry.addHandler(chatWebSocketHandler(null), "/ws/chat")
                .addInterceptors(new AuthHandshakeInterceptor())
                .setAllowedOrigins("http://localhost:5173", "http://127.0.0.1:5173");
    }

    @Bean
    public ChatWebSocketHandler chatWebSocketHandler(org.springframework.beans.factory.ObjectProvider<com.campustrack.lostandfound.websocket.ChatService> cs) {
        return new ChatWebSocketHandler(cs == null ? null : cs.getIfAvailable());
    }
}
