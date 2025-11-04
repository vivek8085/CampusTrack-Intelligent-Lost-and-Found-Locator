package com.campustrack.lostandfound.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArraySet;

public class ChatWebSocketHandler extends TextWebSocketHandler {

    private static final String USER_EMAIL_KEY = "userEmail";

    private final ObjectMapper mapper = new ObjectMapper();
    // map email -> set of sessions (support multiple devices)
    private final ConcurrentHashMap<String, CopyOnWriteArraySet<WebSocketSession>> sessions = new ConcurrentHashMap<>();

    private final ChatService chatService;

    public ChatWebSocketHandler(ChatService chatService) {
        this.chatService = chatService;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
    Object emailObj = session.getAttributes().get(USER_EMAIL_KEY);
        if (emailObj == null) {
            session.close(CloseStatus.NOT_ACCEPTABLE.withReason("No authenticated user"));
            return;
        }
        String email = emailObj.toString().toLowerCase();
        sessions.computeIfAbsent(email, k -> new CopyOnWriteArraySet<>()).add(session);
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        String payload = message.getPayload();
        ChatMessage msg;
        try {
            msg = mapper.readValue(payload, ChatMessage.class);
        } catch (Exception e) {
            // ignore malformed
            return;
        }
        String from = (String) session.getAttributes().get(USER_EMAIL_KEY);
        if (from == null) {
            return;
        }
        msg.setFrom(from);

        String type = msg.getType();
        if ("typing".equals(type)) {
            // forward typing event to recipient(s) without persistence
            if (msg.getTo() != null) {
                String to = msg.getTo().toLowerCase();
                Set<WebSocketSession> targets = sessions.get(to);
                if (targets != null) {
                    String out = mapper.writeValueAsString(msg);
                    TextMessage outMsg = new TextMessage(out);
                    for (WebSocketSession s : targets) {
                        if (s.isOpen()) s.sendMessage(outMsg);
                    }
                }
            }
            return;
        }

        if ("read".equals(type)) {
            // client notifies that a message id has been read/delivered
            Long mid = msg.getId();
            if (mid != null) {
                chatService.markDeliveredById(mid);
            }
            // forward read receipt to other side
            if (msg.getTo() != null) {
                String to = msg.getTo().toLowerCase();
                Set<WebSocketSession> targets = sessions.get(to);
                if (targets != null) {
                    String out = mapper.writeValueAsString(msg);
                    TextMessage outMsg = new TextMessage(out);
                    for (WebSocketSession s : targets) {
                        if (s.isOpen()) s.sendMessage(outMsg);
                    }
                }
            }
            return;
        }

        // before persisting, check block status
        if (msg.getTo() != null && chatService != null && chatService.isBlockedBetween(msg.getFrom(), msg.getTo())) {
            // inform sender that the message cannot be delivered (optional)
            ChatMessage err = new ChatMessage();
            err.setType("error");
            err.setText("Message blocked by user");
            err.setTo(msg.getFrom());
            session.sendMessage(new TextMessage(mapper.writeValueAsString(err)));
            return;
        }

        // default: normal chat message -> persist and forward
        ChatRecord saved = chatService.save(msg.getFrom(), msg.getTo(), msg.getText());

        // build outgoing message payload with metadata
        ChatMessage out = new ChatMessage();
        out.setFrom(saved.getFromEmail());
        out.setTo(saved.getToEmail());
        out.setText(saved.getText());
        out.setId(saved.getId());
        out.setCreatedAt(saved.getCreatedAt().toString());
        out.setType("message");

        // send to recipient if connected
        boolean delivered = false;
        if (out.getTo() != null) {
            String to = out.getTo().toLowerCase();
            Set<WebSocketSession> targets = sessions.get(to);
            if (targets != null) {
                String outJson = mapper.writeValueAsString(out);
                TextMessage outMsg = new TextMessage(outJson);
                for (WebSocketSession s : targets) {
                    if (s.isOpen()) s.sendMessage(outMsg);
                }
                delivered = true;
                chatService.markDelivered(saved);
            }
        }

        // echo back to sender and include delivered flag
        out.setDelivered(delivered);
        String echo = mapper.writeValueAsString(out);
        session.sendMessage(new TextMessage(echo));
    }

    // Close sessions for a set of emails (used when blocking to drop live connections)
    public void closeSessionsForEmails(String... emails) {
        if (emails == null || emails.length == 0) return;
        for (String e : emails) {
            if (e == null) continue;
            String le = e.toLowerCase();
            Set<WebSocketSession> set = sessions.get(le);
            if (set != null) {
                for (WebSocketSession s : set) {
                    try { s.close(CloseStatus.NORMAL.withReason("Connection closed due to block")); } catch (Exception ex) {}
                }
                sessions.remove(le);
            }
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
    Object emailObj = session.getAttributes().get(USER_EMAIL_KEY);
        if (emailObj != null) {
            String email = emailObj.toString().toLowerCase();
            Set<WebSocketSession> set = sessions.get(email);
            if (set != null) {
                set.remove(session);
                if (set.isEmpty()) sessions.remove(email);
            }
        }
        // on connect closed, cleanup done above; call super
        super.afterConnectionClosed(session, status);
    }
}
