package com.campustrack.lostandfound.controller;

import com.campustrack.lostandfound.model.ConfirmedMatch;
import com.campustrack.lostandfound.repository.ConfirmedMatchRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/match-confirmations")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class MatchConfirmationController {

    @Autowired
    private ConfirmedMatchRepository confirmedMatchRepository;

    @Autowired
    private com.campustrack.lostandfound.service.NotificationService notificationService;

    @PostMapping
    public ResponseEntity<?> confirmMatch(@RequestBody Map<String, Object> body) {
        try {
            Long foundItemId = ((Number) body.get("foundItemId")).longValue();
            Long lostItemId = ((Number) body.get("lostItemId")).longValue();

            var existing = confirmedMatchRepository.findByFoundItemIdAndLostItemId(foundItemId, lostItemId);
            if (existing.isPresent()) {
                return ResponseEntity.ok(Map.of("message", "Already confirmed", "id", existing.get().getId()));
            }

            ConfirmedMatch cm = new ConfirmedMatch();
            cm.setFoundItemId(foundItemId);
            cm.setLostItemId(lostItemId);
            cm.setConfirmedAt(java.time.LocalDateTime.now());

            ConfirmedMatch saved = confirmedMatchRepository.save(cm);
            // create notification for the lost item reporter
            try {
                notificationService.createConfirmationNotification(foundItemId, lostItemId);
            } catch (Exception ignore) {
                // don't fail the request if notification creation fails
                ignore.printStackTrace();
            }

            return ResponseEntity.ok(Map.of("message", "Confirmation saved", "id", saved.getId()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("message", "Failed to save confirmation"));
        }
    }
}
