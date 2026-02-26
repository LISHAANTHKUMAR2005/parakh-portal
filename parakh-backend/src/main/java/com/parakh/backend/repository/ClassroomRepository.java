package com.parakh.backend.repository;

import com.parakh.backend.model.Classroom;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ClassroomRepository extends JpaRepository<Classroom, Long> {
    List<Classroom> findByTeacherId(Long teacherId);

    long countByTeacherId(Long teacherId);

    List<Classroom> findByStudentsId(Long studentId);

    List<Classroom> findByInstitutionId(Long institutionId);
}
