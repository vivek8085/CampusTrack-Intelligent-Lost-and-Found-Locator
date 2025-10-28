package com.campustrack.lostandfound.controller;

import com.campustrack.lostandfound.model.Notification;
import com.campustrack.lostandfound.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import jakarta.servlet.http.HttpSession;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.CrossOrigin;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class NotificationController {

    @Autowired
    private NotificationRepository notificationRepository;
    @Autowired
    private com.campustrack.lostandfound.repository.LostItemRepository lostItemRepository;

    @GetMapping("/lost/{lostId}")
    public ResponseEntity<List<Notification>> getNotificationsForLost(@PathVariable Long lostId) {
        List<Notification> list = notificationRepository.findByLostItemIdOrderByCreatedAtDesc(lostId);
        return ResponseEntity.ok(list);
    }

    // Return all confirmed notifications (most recent first)
    @GetMapping("/confirmed")
    public ResponseEntity<List<Notification>> getAllConfirmedNotifications() {
        List<Notification> list = notificationRepository.findAllByOrderByCreatedAtDesc();
        return ResponseEntity.ok(list);
    }

    // Return notifications for the currently authenticated user (session-based)
    @GetMapping("/my")
    public ResponseEntity<Object> getMyNotifications(HttpSession session) {
        String email = (String) session.getAttribute("userEmail");
        if (email == null || email.isBlank()) {
            return ResponseEntity.status(401).body(java.util.Map.of("message", "Not authenticated"));
        }
        List<Notification> list = notificationRepository.findByLostReporterEmailOrderByCreatedAtDesc(email);
        // Fallback: if notifications were created before we started populating lostReporterEmail,
        // try finding lost items for this email and return notifications for those lost item ids.
        if (list == null || list.isEmpty()) {
            List<com.campustrack.lostandfound.model.LostItem> losts = lostItemRepository.findByReporterEmail(email);
            java.util.ArrayList<Notification> agg = new java.util.ArrayList<>();
            for (var l : losts) {
                var part = notificationRepository.findByLostItemIdOrderByCreatedAtDesc(l.getId());
                if (part != null && !part.isEmpty()) agg.addAll(part);
            }
            // sort by createdAt desc
            agg.sort((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()));
            return ResponseEntity.ok(agg);
        }
        return ResponseEntity.ok(list);
    }

    // Public lookup by email (fallback for clients that don't use session auth)
    @GetMapping("/for-email/{email}")
    public ResponseEntity<List<Notification>> getNotificationsForEmail(@PathVariable String email) {
        List<Notification> list = notificationRepository.findByLostReporterEmailOrderByCreatedAtDesc(email);
        return ResponseEntity.ok(list);
    }
}
