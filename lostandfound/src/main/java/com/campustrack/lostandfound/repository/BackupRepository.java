package com.campustrack.lostandfound.repository;

import com.campustrack.lostandfound.model.BackupRecord;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BackupRepository extends JpaRepository<BackupRecord, Long> {
}
