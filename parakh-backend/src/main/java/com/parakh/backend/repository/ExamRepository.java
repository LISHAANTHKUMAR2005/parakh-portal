package com.parakh.backend.repository;

import com.parakh.backend.model.Exam;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ExamRepository extends JpaRepository<Exam, Long> {
        List<Exam> findByUserId(Long userId);

        Optional<Exam> findByUserIdAndAssessmentId(Long userId, Long assessmentId);

        List<Exam> findAllByUserIdAndAssessmentId(Long userId, Long assessmentId);

        List<Exam> findByAssessmentId(Long assessmentId);

        List<Exam> findByAssessmentTeacherId(Long teacherId);

        List<Exam> findByAssessmentClassroomId(Long classroomId);

        long countByAssessmentId(Long assessmentId);

        // Pagination & Multi-tenant support
        org.springframework.data.domain.Page<Exam> findByUserId(Long userId,
                        org.springframework.data.domain.Pageable pageable);

        org.springframework.data.domain.Page<Exam> findByInstitutionId(Long institutionId,
                        org.springframework.data.domain.Pageable pageable);

        org.springframework.data.domain.Page<Exam> findByAssessmentTeacherIdAndInstitutionId(Long teacherId,
                        Long institutionId, org.springframework.data.domain.Pageable pageable);

        org.springframework.data.domain.Page<Exam> findByAssessmentTeacherId(Long teacherId,
                        org.springframework.data.domain.Pageable pageable);
}
