package com.campustrack.lostandfound.repository;

import com.campustrack.lostandfound.model.ConfirmedMatch;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ConfirmedMatchRepository extends JpaRepository<ConfirmedMatch, Long> {
    Optional<ConfirmedMatch> findByFoundItemIdAndLostItemId(Long foundItemId, Long lostItemId);
    Optional<ConfirmedMatch> findByFoundItemIdAndLostItemIdAndConfirmerEmail(Long foundItemId, Long lostItemId, String confirmerEmail);
}
