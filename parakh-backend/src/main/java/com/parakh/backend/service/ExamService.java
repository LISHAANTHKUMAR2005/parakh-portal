package com.parakh.backend.service;

import com.parakh.backend.dto.ExamStateDTO;
import com.parakh.backend.model.*;
import com.parakh.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.Random;

@Service
public class ExamService {

    @Autowired
    private ExamRepository examRepository;

    @Autowired
    private QuestionRepository questionRepository;

    @Autowired
    private StudentResponseRepository studentResponseRepository;

    @Autowired
    private UserRepository userRepository;

    public ExamStateDTO startExam(Long userId, String subject) {
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));

        Exam exam = new Exam();
        exam.setUser(user);
        exam.setSubject(subject);
        exam.setStartTime(LocalDateTime.now());
        exam.setStatus("IN_PROGRESS");
        exam.setCurrentDifficulty("Medium"); // Start at Medium
        examRepository.save(exam);

        return getNextQuestionState(exam);
    }

    public ExamStateDTO submitAnswer(Long examId, Long questionId, String selectedOption) {
        Exam exam = examRepository.findById(examId).orElseThrow(() -> new RuntimeException("Exam not found"));
        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new RuntimeException("Question not found"));

        if (!exam.getStatus().equals("IN_PROGRESS")) {
            throw new RuntimeException("Exam is already completed");
        }

        boolean isCorrect = question.getCorrectOption().equalsIgnoreCase(selectedOption);

        StudentResponse response = new StudentResponse();
        response.setExam(exam);
        response.setQuestion(question);
        response.setSelectedOption(selectedOption);
        response.setIsCorrect(isCorrect);
        response.setTimeTakenSeconds(0L); // TODO: Calculate actual time from frontend if sent
        studentResponseRepository.save(response);

        // Update Score
        if (isCorrect) {
            exam.setScore(exam.getScore() + 1);
        }

        // Adaptive Logic
        adjustDifficulty(exam, isCorrect);
        examRepository.save(exam);

        return getNextQuestionState(exam);
    }

    private void adjustDifficulty(Exam exam, boolean lastCorrect) {
        String current = exam.getCurrentDifficulty();
        if (lastCorrect) {
            if (current.equals("Easy"))
                exam.setCurrentDifficulty("Medium");
            else if (current.equals("Medium"))
                exam.setCurrentDifficulty("Hard");
        } else {
            if (current.equals("Hard"))
                exam.setCurrentDifficulty("Medium");
            else if (current.equals("Medium"))
                exam.setCurrentDifficulty("Easy");
        }
    }

    private ExamStateDTO getNextQuestionState(Exam exam) {
        List<StudentResponse> existingResponses = studentResponseRepository.findByExamId(exam.getId());

        // MVP Constraint: End exam after 10 questions
        if (existingResponses.size() >= 10) {
            exam.setStatus("COMPLETED");
            exam.setEndTime(LocalDateTime.now());
            examRepository.save(exam);
            return new ExamStateDTO(exam.getId(), null, true, exam.getScore(), existingResponses.size());
        }

        List<Long> answeredQuestionIds = existingResponses.stream()
                .map(r -> r.getQuestion().getId())
                .collect(Collectors.toList());

        List<Question> candidates = questionRepository.findBySubjectAndDifficulty(exam.getSubject(),
                exam.getCurrentDifficulty());

        // Filter out answered questions
        List<Question> available = candidates.stream()
                .filter(q -> !answeredQuestionIds.contains(q.getId()))
                .collect(Collectors.toList());

        if (available.isEmpty()) {
            // Fallback: If no questions left in this difficulty, try any difficulty not
            // answered
            List<Question> allSubjectQuestions = questionRepository.findBySubject(exam.getSubject());
            available = allSubjectQuestions.stream()
                    .filter(q -> !answeredQuestionIds.contains(q.getId()))
                    .collect(Collectors.toList());
        }

        if (available.isEmpty()) {
            // No questions left at all
            exam.setStatus("COMPLETED");
            exam.setEndTime(LocalDateTime.now());
            examRepository.save(exam);
            return new ExamStateDTO(exam.getId(), null, true, exam.getScore(), existingResponses.size());
        }

        // Pick random
        Question next = available.get(new Random().nextInt(available.size()));

        // Mask correct answer before sending to frontend (Security best practice)
        Question safeQuestion = new Question();
        safeQuestion.setId(next.getId());
        safeQuestion.setContent(next.getContent());
        safeQuestion.setOptionA(next.getOptionA());
        safeQuestion.setOptionB(next.getOptionB());
        safeQuestion.setOptionC(next.getOptionC());
        safeQuestion.setOptionD(next.getOptionD());
        safeQuestion.setSubject(next.getSubject());
        safeQuestion.setDifficulty(next.getDifficulty());
        safeQuestion.setTopic(next.getTopic());
        // DO NOT SET CORRECT OPTION

        return new ExamStateDTO(exam.getId(), safeQuestion, false, exam.getScore(), existingResponses.size());
    }
}
