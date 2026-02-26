package com.parakh.backend.repository;

import com.parakh.backend.model.ProgressCard;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ProgressCardRepository extends JpaRepository<ProgressCard, Long> {
    Optional<ProgressCard> findByExamId(Long examId);

    List<ProgressCard> findByStudentId(Long studentId);

    List<ProgressCard> findByStudentIdOrderByGeneratedAtDesc(Long studentId);

    List<ProgressCard> findByInstitutionId(Long institutionId);

    void deleteByExamId(Long examId);
}
