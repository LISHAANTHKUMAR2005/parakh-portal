package com.parakh.backend.repository;

import com.parakh.backend.model.AiCache;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface AiCacheRepository extends JpaRepository<AiCache, Long> {
    Optional<AiCache> findByPromptHash(String promptHash);
}
