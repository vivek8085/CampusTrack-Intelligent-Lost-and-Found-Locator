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
    private com.campustrack.lostandfound.repository.ConfirmedMatchRepository confirmedMatchRepository;

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
}
