package com.campustrack.lostandfound.service;

import com.campustrack.lostandfound.model.User;
import com.campustrack.lostandfound.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserService {
    @Autowired
    private UserRepository repo;

    private BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    public String register(User user) {
        // normalize email to lower-case
        String email = user.getEmail() == null ? null : user.getEmail().trim().toLowerCase();
        if (email == null || email.isBlank()) throw new IllegalArgumentException("Email required");
        if (repo.findByEmail(email) != null) throw new IllegalStateException("Email already in use");
        user.setEmail(email);
        user.setPassword(encoder.encode(user.getPassword()));
        repo.save(user);
        return "User registered successfully!";
    }

    public boolean login(String email, String password) {
        User u = repo.findByEmail(email);
        return u != null && encoder.matches(password, u.getPassword());
    }
}
