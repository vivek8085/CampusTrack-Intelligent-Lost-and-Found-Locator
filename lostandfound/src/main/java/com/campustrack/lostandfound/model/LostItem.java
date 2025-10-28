package com.campustrack.lostandfound.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "lost_items")
public class LostItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String itemName;
    private String brand;
    private String modelNo;
    private String size;
    private String location;

    @Column(length = 1000)
    private String about;

    private LocalDateTime lostDateTime;
    private String imageUrl;
    // Email/contact of the person who reported the lost item (optional)
    private String reporterEmail;
}
