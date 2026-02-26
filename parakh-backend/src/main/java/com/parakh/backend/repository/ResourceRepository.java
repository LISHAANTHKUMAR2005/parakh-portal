package com.parakh.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.parakh.backend.model.Resource;
import java.util.List;

public interface ResourceRepository extends JpaRepository<Resource, Long> {
    List<Resource> findByTeacherId(Long teacherId);
}
