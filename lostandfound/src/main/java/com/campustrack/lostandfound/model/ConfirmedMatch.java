package com.campustrack.lostandfound.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Data
public class ConfirmedMatch {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long foundItemId;
    private Long lostItemId;
    // Email of the user who confirmed this match
    private String confirmerEmail;
    private LocalDateTime confirmedAt = LocalDateTime.now();
}
