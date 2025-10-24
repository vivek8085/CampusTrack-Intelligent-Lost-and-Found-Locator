package com.campustrack.lostandfound.controller;

import com.campustrack.lostandfound.model.MatchSuggestion;
import com.campustrack.lostandfound.repository.MatchSuggestionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/match-suggestions")
public class MatchSuggestionController {

    @Autowired
    private MatchSuggestionRepository matchSuggestionRepository;

    @GetMapping("/found/{foundId}")
    public ResponseEntity<List<MatchSuggestion>> getByFound(@PathVariable Long foundId) {
        return ResponseEntity.ok(matchSuggestionRepository.findByFoundItemIdOrderByScoreDesc(foundId));
    }
}
