package com.campustrack.lostandfound.controller;

import com.campustrack.lostandfound.model.Notice;
import com.campustrack.lostandfound.repository.NoticeRepository;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class NoticeController {

    @Autowired
    private NoticeRepository noticeRepository;

    @GetMapping("/notices")
    public ResponseEntity<List<Notice>> getNotices() {
        var list = noticeRepository.findAllByOrderByCreatedAtDesc();
        return ResponseEntity.ok(list);
    }

    // Admin-only: create a notice
    @PostMapping("/admin/notices")
    public ResponseEntity<?> createNotice(@RequestBody Map<String, String> body, HttpSession session) {
        Object r = session.getAttribute("userRole");
        if (r == null || !"admin".equals(r.toString())) return ResponseEntity.status(403).body(Map.of("message", "Forbidden"));
        String title = body.getOrDefault("title", "").trim();
        String content = body.getOrDefault("content", "").trim();
        String author = (String) session.getAttribute("userEmail");
        if (title.isEmpty() && content.isEmpty()) return ResponseEntity.badRequest().body(Map.of("message", "Empty notice"));
        Notice n = new Notice();
        n.setTitle(title);
        n.setContent(content);
        n.setAuthorEmail(author);
        Notice saved = noticeRepository.save(n);
        return ResponseEntity.ok(saved);
    }

    // Admin-only: delete a notice
    @DeleteMapping("/admin/notices/{id}")
    public ResponseEntity<?> deleteNotice(@PathVariable Long id, HttpSession session) {
        Object r = session.getAttribute("userRole");
        if (r == null || !"admin".equals(r.toString())) return ResponseEntity.status(403).body(Map.of("message", "Forbidden"));
        noticeRepository.findById(id).ifPresent(n -> noticeRepository.delete(n));
        return ResponseEntity.ok(Map.of("status", "deleted"));
    }
}
