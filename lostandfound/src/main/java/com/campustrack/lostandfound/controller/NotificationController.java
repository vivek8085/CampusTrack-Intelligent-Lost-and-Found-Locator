package com.campustrack.lostandfound.controller;

import com.campustrack.lostandfound.model.Notification;
import com.campustrack.lostandfound.repository.NotificationRepository;
import com.campustrack.lostandfound.repository.BackupRepository;
import com.campustrack.lostandfound.repository.FoundItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import jakarta.servlet.http.HttpSession;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
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
    private BackupRepository backupRepository;
    @Autowired
    private com.campustrack.lostandfound.repository.LostItemRepository lostItemRepository;
    @Autowired
    private FoundItemRepository foundItemRepository;

    @GetMapping("/lost/{lostId}")
    public ResponseEntity<List<Notification>> getNotificationsForLost(@PathVariable Long lostId) {
        List<Notification> list = notificationRepository.findByLostItemIdOrderByCreatedAtDesc(lostId);
        return ResponseEntity.ok(list);
    }

    // Return all confirmed notifications
    @GetMapping("/confirmed")
    public ResponseEntity<List<Notification>> getAllConfirmedNotifications() {
        List<Notification> list = notificationRepository.findAllByOrderByCreatedAtDesc();
        return ResponseEntity.ok(list);
    }

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

    // Mark a single notification as read/delivered - this will be persisted so the red-dot disappears
    @PostMapping("/{id}/mark-read")
    public ResponseEntity<Object> markAsRead(@PathVariable Long id) {
        var opt = notificationRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();
        var n = opt.get();
        n.setDelivered(true);
        notificationRepository.save(n);
        return ResponseEntity.ok(java.util.Map.of("status", "ok"));
    }

    // User confirms they received the item: archive notification + related items to backup table, then delete
    @PostMapping("/{id}/received")
    public ResponseEntity<Object> markAsReceived(@PathVariable Long id) {
        var opt = notificationRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();
        var n = opt.get();

        com.campustrack.lostandfound.model.LostItem lost = null;
        com.campustrack.lostandfound.model.FoundItem found = null;
        if (n.getLostItemId() != null) {
            lost = lostItemRepository.findById(n.getLostItemId()).orElse(null);
        }
        if (n.getFoundItemId() != null) {
            found = foundItemRepository.findById(n.getFoundItemId()).orElse(null);
        }

        // Build backup record
        var br = new com.campustrack.lostandfound.model.BackupRecord();
        br.setLostReporterEmail(n.getLostReporterEmail());
        br.setFoundReporterEmail(n.getFoundReporterEmail());
        try {
            com.fasterxml.jackson.databind.ObjectMapper om = new com.fasterxml.jackson.databind.ObjectMapper();
            String lostJson = lost == null ? null : om.writeValueAsString(lost);
            String foundJson = found == null ? null : om.writeValueAsString(found);
            br.setLostItemSnapshot(lostJson);
            br.setFoundItemSnapshot(foundJson);
        } catch (Exception ex) {
            br.setLostItemSnapshot(lost != null ? lost.toString() : null);
            br.setFoundItemSnapshot(found != null ? found.toString() : null);
        }
        backupRepository.save(br);

        // Now delete the original items and the notification itself
        notificationRepository.delete(n);
        if (lost != null) {
            lostItemRepository.delete(lost);
        }
        if (found != null) {
            foundItemRepository.delete(found);
        }
        return ResponseEntity.ok(java.util.Map.of("status", "archived"));
    }
}
