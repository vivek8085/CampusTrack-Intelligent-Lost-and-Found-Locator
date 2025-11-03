package com.campustrack.lostandfound.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Data
public class BackupRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Emails of the reporters involved
    private String lostReporterEmail;
    private String foundReporterEmail;

    @Column(length = 4000)
    private String lostItemSnapshot;

    @Column(length = 4000)
    private String foundItemSnapshot;

    private LocalDateTime archivedAt = LocalDateTime.now();
}
