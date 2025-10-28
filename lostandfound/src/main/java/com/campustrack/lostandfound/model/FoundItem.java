package com.campustrack.lostandfound.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Data
public class FoundItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String itemName;
    private String brand;
    private String modelNo;
    private String size;
    private String location;
    private String about;
    private LocalDateTime foundDateTime;
    private String imageUrl;
    // Email/contact of the person who reported the found item (optional)
    private String reporterEmail;
}
