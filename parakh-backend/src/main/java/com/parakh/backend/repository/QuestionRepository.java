package com.parakh.backend.repository;

import com.parakh.backend.model.Question;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface QuestionRepository extends JpaRepository<Question, Long> {
    List<Question> findBySubject(String subject);

    List<Question> findBySubjectAndDifficulty(String subject, String difficulty);
}
