package com.campustrack.lostandfound.repository;

import com.campustrack.lostandfound.model.MatchSuggestion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MatchSuggestionRepository extends JpaRepository<MatchSuggestion, Long> {
    List<MatchSuggestion> findByFoundItemIdOrderByScoreDesc(Long foundItemId);
    List<MatchSuggestion> findByLostItemIdIn(List<Long> lostItemIds);
}
