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
    private String email;
    private String password;
    private String role = "user"; // 'user' or 'admin'
    private String adminId; // optional admin identifier (e.g., 2UI123)
}
