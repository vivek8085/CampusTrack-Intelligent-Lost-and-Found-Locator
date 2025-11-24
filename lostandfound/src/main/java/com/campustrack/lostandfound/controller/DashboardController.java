package com.campustrack.lostandfound.controller;

import com.campustrack.lostandfound.model.LostItem;
import com.campustrack.lostandfound.repository.LostItemRepository;
import com.campustrack.lostandfound.repository.FoundItemRepository;
import com.campustrack.lostandfound.repository.BackupRepository;
import com.campustrack.lostandfound.repository.ConfirmedMatchRepository;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.*;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class DashboardController {

    @Autowired
    private LostItemRepository lostItemRepository;

    @Autowired
    private FoundItemRepository foundItemRepository;

    @Autowired
    private BackupRepository backupRepository;

    @Autowired
    private ConfirmedMatchRepository confirmedMatchRepository;

    @GetMapping("/dashboard")
    public ResponseEntity<?> userDashboard(HttpSession session) {
        String email = (String) session.getAttribute("userEmail");
        if (email == null || email.isBlank()) {
            return ResponseEntity.status(401).body(Collections.singletonMap("message", "Not authenticated"));
        }
        email = email.trim().toLowerCase();

        Map<String, Object> out = new HashMap<>();

        // lost items reported by this user
        List<LostItem> losts = lostItemRepository.findByReporterEmail(email);
        int lostCount = losts == null ? 0 : losts.size();
        out.put("lostCount", lostCount);

        // total found items on campus (global)
        long foundCount = foundItemRepository.count();
        out.put("foundCount", foundCount);

        // matched items: use overall confirmed matches (global)
        long matchedCount = 0L;
        try {
            matchedCount = confirmedMatchRepository.count();
        } catch (Exception ignore) { /* best-effort: if counting fails, leave as 0 */ }
        out.put("matchedCount", matchedCount);
        // compatibility alias used by frontend
        out.put("matches", matchedCount);
        // overallMatchedCount kept for explicit naming as well
        out.put("overallMatchedCount", matchedCount);

        // recovered: use overall backup records count (global)
        long recoveredCount = 0L;
        try {
            recoveredCount = backupRepository.count();
        } catch (Exception ignore) { /* best-effort: if counting fails, leave as 0 */ }
        out.put("recoveredCount", recoveredCount);
        out.put("recovered", recoveredCount);
        out.put("overallRecoveredCount", recoveredCount);

        return ResponseEntity.ok(out);
    }
}
