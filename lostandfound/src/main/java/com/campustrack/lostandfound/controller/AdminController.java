package com.campustrack.lostandfound.controller;

import com.campustrack.lostandfound.model.User;
import com.campustrack.lostandfound.repository.UserRepository;
import com.campustrack.lostandfound.websocket.ChatRecordRepository;
import com.campustrack.lostandfound.websocket.UserBlockRepository;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "http://localhost:5173")
public class AdminController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ChatRecordRepository chatRecordRepository;

    @Autowired
    private UserBlockRepository userBlockRepository;
    @Autowired
    private com.campustrack.lostandfound.repository.LostItemRepository lostItemRepository;
    @Autowired
    private com.campustrack.lostandfound.repository.FoundItemRepository foundItemRepository;
    @Autowired
    private com.campustrack.lostandfound.repository.BackupRepository backupRepository;
    @Autowired
    private com.campustrack.lostandfound.repository.ConfirmedMatchRepository confirmedMatchRepository;
    @Autowired
    private com.campustrack.lostandfound.websocket.ChatService chatService;
    @Autowired
    private com.campustrack.lostandfound.websocket.ChatWebSocketHandler chatWebSocketHandler;

    private boolean isAdmin(HttpSession session) {
        Object r = session.getAttribute("userRole");
        return r != null && "admin".equals(r.toString());
    }

    @GetMapping("/dashboard")
    public ResponseEntity<?> dashboard(HttpSession session) {
        if (!isAdmin(session)) return ResponseEntity.status(403).body("Forbidden");
        Map<String, Object> out = new HashMap<>();
        out.put("totalUsers", userRepository.count());
        out.put("totalChats", chatRecordRepository.count());
        out.put("totalBlocks", userBlockRepository.count());
        out.put("lostCount", lostItemRepository.count());
        out.put("foundCount", foundItemRepository.count());
        out.put("matchedCount", confirmedMatchRepository.count());
        // recovered uses matched count for now (no separate recovered flag exists)
        out.put("recoveredCount", confirmedMatchRepository.count());
        return ResponseEntity.ok(out);
    }

    // Admin: delete a lost item by id
    @PostMapping("/lost/{id}/delete")
    public ResponseEntity<?> deleteLostItem(HttpSession session, @PathVariable("id") Long id) {
        if (!isAdmin(session)) return ResponseEntity.status(403).body("Forbidden");
        lostItemRepository.findById(id).ifPresent(l -> lostItemRepository.delete(l));
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/lost/{id}")
    public ResponseEntity<?> deleteLostItemDelete(HttpSession session, @PathVariable("id") Long id) {
        return deleteLostItem(session, id);
    }

    // Admin: delete a found item by id
    @PostMapping("/found/{id}/delete")
    public ResponseEntity<?> deleteFoundItem(HttpSession session, @PathVariable("id") Long id) {
        if (!isAdmin(session)) return ResponseEntity.status(403).body("Forbidden");
        foundItemRepository.findById(id).ifPresent(f -> foundItemRepository.delete(f));
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/found/{id}")
    public ResponseEntity<?> deleteFoundItemDelete(HttpSession session, @PathVariable("id") Long id) {
        return deleteFoundItem(session, id);
    }

    // Admin: list backups (recovered items)
    @GetMapping("/backups")
    public ResponseEntity<?> backups(HttpSession session) {
        if (!isAdmin(session)) return ResponseEntity.status(403).body("Forbidden");
        try {
            var list = backupRepository.findAll();
            return ResponseEntity.ok(list);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Failed to fetch backups");
        }
    }

    // Admin: delete backup record
    @PostMapping("/backups/{id}/delete")
    public ResponseEntity<?> deleteBackup(HttpSession session, @PathVariable("id") Long id) {
        if (!isAdmin(session)) return ResponseEntity.status(403).body("Forbidden");
        backupRepository.findById(id).ifPresent(b -> backupRepository.delete(b));
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/backups/{id}")
    public ResponseEntity<?> deleteBackupDelete(HttpSession session, @PathVariable("id") Long id) {
        return deleteBackup(session, id);
    }

    

    @GetMapping("/users")
    public ResponseEntity<?> users(HttpSession session) {
        if (!isAdmin(session)) return ResponseEntity.status(403).body("Forbidden");
        List<User> users = userRepository.findAll();
        // strip passwords before returning
        users.forEach(u -> u.setPassword(null));
        return ResponseEntity.ok(users);
    }

    @PostMapping("/user/{id}/delete")
    public ResponseEntity<?> deleteUser(HttpSession session, @PathVariable("id") Long id) {
        if (!isAdmin(session)) return ResponseEntity.status(403).body("Forbidden");
        userRepository.findById(id).ifPresent(u -> userRepository.delete(u));
        return ResponseEntity.ok().build();
    }

    // List all user blocks (reports) for admin review
    @GetMapping("/blocks")
    public ResponseEntity<?> blocks(HttpSession session) {
        if (!isAdmin(session)) return ResponseEntity.status(403).body("Forbidden");
        List<com.campustrack.lostandfound.websocket.UserBlock> blocks = userBlockRepository.findAll();
        return ResponseEntity.ok(blocks);
    }

    // Remove a block/report record
    @PostMapping("/block/{id}/delete")
    public ResponseEntity<?> deleteBlock(HttpSession session, @PathVariable("id") Long id) {
        if (!isAdmin(session)) return ResponseEntity.status(403).body("Forbidden");
        userBlockRepository.findById(id).ifPresent(b -> {
            String blockedEmail = b.getBlockedEmail();
            userBlockRepository.delete(b);
            // also clear blocked flag on the user account (if present)
            var u = userRepository.findByEmail(blockedEmail);
            if (u != null) {
                u.setBlocked(false);
                u.setBlockedReason(null);
                u.setBlockedAt(null);
                userRepository.save(u);
            }
        });
        return ResponseEntity.ok().build();
    }

    // Admin-initiated block: create a UserBlock for the given email with optional reason
    @PostMapping("/blockUser")
    public ResponseEntity<?> blockUserAsAdmin(HttpSession session, @RequestParam("email") String blockedEmail, @RequestParam(value = "reason", required = false) String reason) {
        if (!isAdmin(session)) return ResponseEntity.status(403).body("Forbidden");
        Object emailObj = session.getAttribute("userEmail");
        if (emailObj == null) return ResponseEntity.status(401).body("Unauthorized");
        String adminEmail = emailObj.toString().toLowerCase();
        if (blockedEmail == null || blockedEmail.isBlank()) return ResponseEntity.badRequest().body("Missing email");
        // use ChatService to create the block record and remove conversation records
        com.campustrack.lostandfound.websocket.UserBlock ub = chatService.blockUser(adminEmail, blockedEmail.toLowerCase(), reason);
        // mark the user account as blocked as well (so login is prevented)
        var u = userRepository.findByEmail(blockedEmail.toLowerCase());
        if (u != null) {
            u.setBlocked(true);
            u.setBlockedReason(reason);
            u.setBlockedAt(java.time.LocalDateTime.now());
            userRepository.save(u);
        }
        if (ub == null) return ResponseEntity.status(500).body("Could not create block");
        // attempt to close websocket sessions for the affected emails (best-effort)
        try {
            // best-effort: close any websocket sessions for the affected emails so live connections are removed
            chatWebSocketHandler.closeSessionsForEmails(adminEmail, blockedEmail.toLowerCase());
        } catch (Exception ignore) {
            // ignore errors closing websockets
        }
        return ResponseEntity.ok(ub);
    }
}
