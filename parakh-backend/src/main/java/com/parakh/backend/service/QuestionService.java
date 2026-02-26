package com.parakh.backend.service;

import com.parakh.backend.model.Question;
import com.parakh.backend.repository.QuestionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * QuestionService — CRUD operations on the question bank.
 * Initial data seeding is handled exclusively by DataSeeder
 * (CommandLineRunner),
 * NOT here, to avoid pre-empting the richer seeded dataset.
 */
@Service
public class QuestionService {

        @Autowired
        private QuestionRepository questionRepository;

        public List<Question> getAllQuestions() {
                return questionRepository.findAll();
        }

        public List<Question> getQuestionsBySubject(String subject) {
                return questionRepository.findBySubject(subject);
        }

        public Question saveQuestion(Question question) {
                return questionRepository.save(question);
        }

        public void deleteQuestion(Long id) {
                questionRepository.deleteById(id);
        }

        public Question getQuestionById(Long id) {
                return questionRepository.findById(id)
                                .orElseThrow(() -> new RuntimeException("Question not found: " + id));
        }

        public Question updateQuestion(Long id, Question details) {
                Question q = getQuestionById(id);
                q.setContent(details.getContent());
                q.setOptionA(details.getOptionA());
                q.setOptionB(details.getOptionB());
                q.setOptionC(details.getOptionC());
                q.setOptionD(details.getOptionD());
                q.setCorrectOption(details.getCorrectOption());
                q.setSubject(details.getSubject());
                q.setDifficulty(details.getDifficulty());
                q.setTopic(details.getTopic());
                q.setBloomLevel(details.getBloomLevel());
                q.setCompetencyCode(details.getCompetencyCode());
                q.setLearningOutcomeTag(details.getLearningOutcomeTag());
                return questionRepository.save(q);
        }
}
