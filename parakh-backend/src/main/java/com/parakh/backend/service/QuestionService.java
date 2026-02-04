package com.parakh.backend.service;

import com.parakh.backend.model.Question;
import com.parakh.backend.repository.QuestionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import jakarta.annotation.PostConstruct;
import java.util.List;

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

        @PostConstruct
        public void initDemoQuestions() {
                if (questionRepository.count() == 0) {
                        // Mathematics Questions
                        questionRepository.save(new Question("What is the value of pi (approx)?", "3.14", "2.14",
                                        "4.14", "3.41",
                                        "A", "Mathematics", "Easy"));
                        questionRepository.save(
                                        new Question("Solve for x: 2x + 5 = 15", "2", "5", "10", "7.5", "B",
                                                        "Mathematics", "Medium"));
                        questionRepository
                                        .save(new Question("Square root of 144 is?", "10", "11", "12", "13", "C",
                                                        "Mathematics", "Easy"));

                        // Science Questions
                        questionRepository.save(new Question("Powerhouse of the cell is?", "Nucleus", "Mitochondria",
                                        "Ribosome",
                                        "Golgi Body", "B", "Science", "Easy"));
                        questionRepository.save(
                                        new Question("Chemical formula for Water?", "H2O", "CO2", "O2", "NaCl", "A",
                                                        "Science", "Easy"));
                        questionRepository.save(new Question("Which planet is known as the Red Planet?", "Venus",
                                        "Mars", "Jupiter",
                                        "Saturn", "B", "Science", "Easy"));

                        System.out.println("Demo questions initialized");
                }
        }

        public Question saveQuestion(Question question) {
                return questionRepository.save(question);
        }

        public void deleteQuestion(Long id) {
                questionRepository.deleteById(id);
        }

        public Question getQuestionById(Long id) {
                return questionRepository.findById(id).orElseThrow(() -> new RuntimeException("Question not found"));
        }

        public Question updateQuestion(Long id, Question questionDetails) {
                Question question = getQuestionById(id);
                question.setContent(questionDetails.getContent());
                question.setOptionA(questionDetails.getOptionA());
                question.setOptionB(questionDetails.getOptionB());
                question.setOptionC(questionDetails.getOptionC());
                question.setOptionD(questionDetails.getOptionD());
                question.setCorrectOption(questionDetails.getCorrectOption());
                question.setSubject(questionDetails.getSubject());
                question.setDifficulty(questionDetails.getDifficulty());
                question.setTopic(questionDetails.getTopic());
                return questionRepository.save(question);
        }
}
