package com.parakh.backend.repository;

import com.parakh.backend.model.Assessment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AssessmentRepository extends JpaRepository<Assessment, Long> {
    List<Assessment> findByTeacherId(Long teacherId);

    long countByClassroomId(Long classroomId);

    List<Assessment> findByClassroomId(Long classroomId);

    // Pagination & Multi-tenant support
    org.springframework.data.domain.Page<Assessment> findByInstitutionId(Long institutionId,
            org.springframework.data.domain.Pageable pageable);

    org.springframework.data.domain.Page<Assessment> findByTeacherIdAndInstitutionId(Long teacherId, Long institutionId,
            org.springframework.data.domain.Pageable pageable);
}
