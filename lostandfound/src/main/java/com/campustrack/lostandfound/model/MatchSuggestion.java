package com.campustrack.lostandfound.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
public class MatchSuggestion {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long foundItemId;
    private Long lostItemId;
    private Double score;
}
