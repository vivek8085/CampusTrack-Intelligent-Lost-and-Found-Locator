package com.campustrack.lostandfound.model;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    @jakarta.persistence.Column(unique = true, nullable = false)
    private String email;
    private String password;
    private String role = "user"; // 'user' or 'admin'
    private String adminId; // optional admin identifier (e.g., 2UI123)
    // Account block fields: when set, user cannot log in until unblocked by admin
    private boolean blocked = false;
    private String blockedReason;
    private java.time.LocalDateTime blockedAt;
}
