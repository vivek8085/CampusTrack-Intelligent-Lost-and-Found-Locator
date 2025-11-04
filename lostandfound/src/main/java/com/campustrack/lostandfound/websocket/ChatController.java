package com.campustrack.lostandfound.websocket;

import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
public class ChatController {

    @Autowired
    private ChatService chatService;
    @Autowired
    private ChatWebSocketHandler chatWebSocketHandler;

    @GetMapping("/api/chat/history")
    public ResponseEntity<?> history(HttpSession session, @RequestParam("with") String other) {
        Object emailObj = session.getAttribute("userEmail");
        if (emailObj == null) return ResponseEntity.status(401).body("Unauthorized");
        String me = emailObj.toString().toLowerCase();
        List<ChatRecord> conv = chatService.conversationBetween(me, other.toLowerCase());
        return ResponseEntity.ok(conv);
    }

    @GetMapping("/api/chat/conversations")
    public ResponseEntity<?> conversations(HttpSession session) {
        Object emailObj = session.getAttribute("userEmail");
        if (emailObj == null) return ResponseEntity.status(401).body("Unauthorized");
        String me = emailObj.toString().toLowerCase();
        List<ChatConversation> convs = chatService.listConversations(me);
        return ResponseEntity.ok(convs);
    }

    @PostMapping("/api/chat/markRead")
    public ResponseEntity<?> markRead(HttpSession session, @RequestParam("with") String partner) {
        Object emailObj = session.getAttribute("userEmail");
        if (emailObj == null) return ResponseEntity.status(401).body("Unauthorized");
        String me = emailObj.toString().toLowerCase();
        chatService.markDeliveredForConversation(me, partner.toLowerCase());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/api/chat/block")
    public ResponseEntity<?> blockUser(HttpSession session, @RequestParam("with") String partner, @RequestParam(value = "reason", required = false) String reason) {
        Object emailObj = session.getAttribute("userEmail");
        if (emailObj == null) return ResponseEntity.status(401).body("Unauthorized");
        String me = emailObj.toString().toLowerCase();
        chatService.blockUser(me, partner.toLowerCase(), reason);
        // Close live websocket sessions for both users to ensure connection is removed
        try { chatWebSocketHandler.closeSessionsForEmails(me, partner.toLowerCase()); } catch (Exception e) { }
        return ResponseEntity.ok().build();
    }
}
