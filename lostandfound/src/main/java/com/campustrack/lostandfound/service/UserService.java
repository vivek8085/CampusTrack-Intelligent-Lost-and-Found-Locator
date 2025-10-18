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
        user.setPassword(encoder.encode(user.getPassword()));
        repo.save(user);
        return "User registered successfully!";
    }

    public boolean login(String email, String password) {
        User u = repo.findByEmail(email);
        return u != null && encoder.matches(password, u.getPassword());
    }
}
