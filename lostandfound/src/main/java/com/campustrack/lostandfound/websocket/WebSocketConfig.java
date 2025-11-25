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
        // Allow common local-dev and deployed frontend origins so cookies/session are sent
        // Note: consider restricting these in production to known origins only.
        registry.addHandler(chatWebSocketHandler(null), "/ws/chat")
            .addInterceptors(new AuthHandshakeInterceptor())
            .setAllowedOriginPatterns("http://localhost:*", "http://127.0.0.1:*", "http://192.168.*.*", "https://*.vercel.app", "https://*.onrender.com", "https://*.netlify.app", "https://*.up.railway.app");
    }

    @Bean
    public ChatWebSocketHandler chatWebSocketHandler(org.springframework.beans.factory.ObjectProvider<com.campustrack.lostandfound.websocket.ChatService> cs) {
        return new ChatWebSocketHandler(cs == null ? null : cs.getIfAvailable());
    }
}
