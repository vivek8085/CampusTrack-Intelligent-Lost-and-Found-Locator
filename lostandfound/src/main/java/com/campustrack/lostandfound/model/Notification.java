package com.campustrack.lostandfound.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Data
public class Notification {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long lostItemId;
    private Long foundItemId;
    // Email/contact of the user who confirmed the match (reporter of the found item)
    private String foundReporterEmail;
    // Optional display name of the found-item reporter (may be null)
    private String foundReporterName;
    // Email/contact of the lost item reporter (recipient of this notification)
    private String lostReporterEmail;

    @Column(length = 1000)
    private String message;

    private LocalDateTime createdAt = LocalDateTime.now();

    private boolean delivered = false;
}
