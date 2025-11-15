package com.campustrack.lostandfound.controller;

import com.campustrack.lostandfound.model.User;
import com.campustrack.lostandfound.service.UserService;
import com.campustrack.lostandfound.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpSession;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:5173")
public class AuthController {

    @Autowired
    private UserService userService;

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/signup")
    public Map<String, String> signup(@RequestBody User user) {
        Map<String, String> res = new HashMap<>();
        String email = user.getEmail() == null ? "" : user.getEmail().trim().toLowerCase();
        // restrict to university domain
        if (!email.endsWith("@university.edu")) {
            res.put("message", "Signup failed: only @university.edu emails are allowed");
            return res;
        }
        // If signing up as admin, require an adminId of the form 2UIxxx
        if ("admin".equalsIgnoreCase(user.getRole())) {
            String aid = user.getAdminId() == null ? "" : user.getAdminId().trim();
            if (!aid.matches("^2UI\\d{3}$")) {
                res.put("message", "Signup failed: adminId required and must be like 2UI123");
                return res;
            }
        }
        try {
            userService.register(user);
            res.put("message", "Signup successful!");
        } catch (IllegalStateException ex) {
            res.put("message", "Signup failed: email already in use");
        } catch (IllegalArgumentException ex) {
            res.put("message", "Signup failed: " + ex.getMessage());
        } catch (Exception ex) {
            res.put("message", "Signup failed: unexpected error");
        }
        return res;
    }

    @PostMapping("/login")
    public Map<String, String> login(@RequestBody Map<String, String> payload, HttpSession session) {
        Map<String, String> res = new HashMap<>();
        String email = payload.getOrDefault("email", "").trim().toLowerCase();
        String password = payload.getOrDefault("password", "");
        if (!email.endsWith("@university.edu")) {
            res.put("message", "Invalid credentials");
            return res;
        }

        boolean valid = userService.login(email, password);
        if (valid) {
            // fetch persisted user to determine their actual role (do NOT trust payload)
            var u = userRepository.findByEmail(email);
            // if account is blocked, return blocked info and do not create a session
            if (u != null && u.isBlocked()) {
                res.put("message", "Account blocked");
                res.put("blocked", "true");
                if (u.getBlockedReason() != null) res.put("reason", u.getBlockedReason());
                return res;
            }
            String role = (u != null && u.getRole() != null) ? u.getRole() : "user";
            // store user email and derived role in session
            session.setAttribute("userEmail", email);
            session.setAttribute("userName", u != null ? u.getName() : "");
            session.setAttribute("userRole", role);
            res.put("message", "Login successful");
            res.put("role", role);
            res.put("email", email);
        } else {
            res.put("message", "Invalid credentials");
        }
        return res;
    }
}
