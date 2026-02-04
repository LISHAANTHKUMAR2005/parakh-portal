package com.parakh.backend.repository;

import com.parakh.backend.model.Assessment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AssessmentRepository extends JpaRepository<Assessment, Long> {
    List<Assessment> findByTeacherId(Long teacherId);

    List<Assessment> findByClassroomId(Long classroomId);
}
