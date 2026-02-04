package com.parakh.backend.repository;

import com.parakh.backend.model.Exam;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ExamRepository extends JpaRepository<Exam, Long> {
    List<Exam> findByUserId(Long userId);

    Optional<Exam> findByUserIdAndAssessmentId(Long userId, Long assessmentId);
}
