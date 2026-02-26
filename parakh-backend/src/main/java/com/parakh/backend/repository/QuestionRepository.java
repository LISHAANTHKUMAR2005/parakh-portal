package com.parakh.backend.repository;

import com.parakh.backend.model.Question;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface QuestionRepository extends JpaRepository<Question, Long> {
    List<Question> findBySubject(String subject);

    List<Question> findBySubjectAndDifficulty(String subject, String difficulty);

    List<Question> findByTeacherId(Long teacherId);

    long countByTeacherId(Long teacherId);

    // Pagination & Multi-tenant support
    org.springframework.data.domain.Page<Question> findByInstitutionId(Long institutionId,
            org.springframework.data.domain.Pageable pageable);

    org.springframework.data.domain.Page<Question> findByTeacherIdAndInstitutionId(Long teacherId, Long institutionId,
            org.springframework.data.domain.Pageable pageable);
}
