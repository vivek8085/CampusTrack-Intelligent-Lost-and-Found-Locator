package com.campustrack.lostandfound.controller;

import com.campustrack.lostandfound.model.User;
import com.campustrack.lostandfound.service.UserService;
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

    @PostMapping("/signup")
    public Map<String, String> signup(@RequestBody User user) {
        userService.register(user);
        Map<String, String> res = new HashMap<>();
        res.put("message", "Signup successful!");
        return res;
    }

    @PostMapping("/login")
    public Map<String, String> login(@RequestBody User user, HttpSession session) {
        boolean valid = userService.login(user.getEmail(), user.getPassword());
        Map<String, String> res = new HashMap<>();
        if (valid) {
            // store user email in session to identify authenticated requests
            session.setAttribute("userEmail", user.getEmail());
            session.setAttribute("userName", user.getName());
            res.put("message", "Login successful");
        } else {
            res.put("message", "Invalid credentials");
        }
        return res;
    }
}
