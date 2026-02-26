package com.parakh.backend.repository;

import com.parakh.backend.model.LearningPath;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface LearningPathRepository extends JpaRepository<LearningPath, Long> {
    Optional<LearningPath> findTopByStudentIdOrderByGeneratedDateDesc(Long studentId);
}
