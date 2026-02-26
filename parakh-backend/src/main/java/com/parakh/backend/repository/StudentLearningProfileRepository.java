package com.parakh.backend.repository;

import com.parakh.backend.model.StudentLearningProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface StudentLearningProfileRepository extends JpaRepository<StudentLearningProfile, Long> {
    Optional<StudentLearningProfile> findByStudentId(Long studentId);

    java.util.List<StudentLearningProfile> findByStudentInstitutionId(Long institutionId);
}
