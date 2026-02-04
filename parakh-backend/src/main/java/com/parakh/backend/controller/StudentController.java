package com.parakh.backend.controller;

import com.parakh.backend.model.*;
import com.parakh.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/student")
@CrossOrigin(origins = { "http://localhost:5173", "http://localhost:5174" })
public class StudentController {

    @Autowired
    private ClassroomRepository classroomRepository;

    @Autowired
    private AssessmentRepository assessmentRepository;

    @Autowired
    private ExamRepository examRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private QuestionRepository questionRepository;

    @GetMapping("/classes")
    public List<Classroom> getMyClasses(Authentication authentication) {
        User student = userRepository.findByEmail(authentication.getName()).orElseThrow();
        return classroomRepository.findByStudentsId(student.getId());
    }

    @GetMapping("/assessments")
    public List<Map<String, Object>> getMyAssessments(Authentication authentication) {
        User student = userRepository.findByEmail(authentication.getName()).orElseThrow();
        List<Classroom> classes = classroomRepository.findByStudentsId(student.getId());

        List<Map<String, Object>> result = new ArrayList<>();

        for (Classroom cls : classes) {
            List<Assessment> assessments = assessmentRepository.findByClassroomId(cls.getId());
            for (Assessment assessment : assessments) {
                if (!"PUBLISHED".equals(assessment.getStatus()))
                    continue;

                Map<String, Object> map = new HashMap<>();
                map.put("id", assessment.getId());
                map.put("title", assessment.getTitle());
                map.put("subject", assessment.getSubject());
                map.put("classroom", cls.getName());
                map.put("type", assessment.getType());
                map.put("durationMinutes", assessment.getDurationMinutes());

                // Check exam status
                Optional<Exam> attempt = examRepository.findByUserIdAndAssessmentId(student.getId(),
                        assessment.getId());
                if (attempt.isPresent()) {
                    map.put("status", attempt.get().getStatus());
                    map.put("score", attempt.get().getScore());
                    map.put("examId", attempt.get().getId());
                } else {
                    map.put("status", "PENDING");
                }

                result.add(map);
            }
        }
        return result;
    }

    @PostMapping("/assessments/{id}/start")
    public ResponseEntity<?> startAssessment(@PathVariable Long id, Authentication authentication) {
        User student = userRepository.findByEmail(authentication.getName()).orElseThrow();
        Assessment assessment = assessmentRepository.findById(id).orElseThrow();

        // Check if already exists
        if (examRepository.findByUserIdAndAssessmentId(student.getId(), id).isPresent()) {
            return ResponseEntity.badRequest().body("Exam already started or completed");
        }

        Exam exam = new Exam();
        exam.setUser(student);
        exam.setAssessment(assessment);
        exam.setSubject(assessment.getSubject() != null ? assessment.getSubject() : "General");
        exam.setStartTime(LocalDateTime.now());
        exam.setStatus("IN_PROGRESS");
        exam.setScore(0);

        examRepository.save(exam);

        return ResponseEntity.ok(Map.of("examId", exam.getId(), "message", "Exam started"));
    }

    @GetMapping("/exam/{id}/questions")
    public ResponseEntity<?> getExamQuestions(@PathVariable Long id, Authentication authentication) {
        Exam exam = examRepository.findById(id).orElseThrow();
        Assessment assessment = exam.getAssessment();

        // MVP: Fetch random questions matching criteria
        List<Question> questions;
        if ("TOPIC".equals(assessment.getType())) {
            questions = questionRepository.findBySubjectAndDifficulty(
                    assessment.getSubject(),
                    assessment.getDifficulty());
            // Simple shuffle and limit
            Collections.shuffle(questions);
            if (questions.size() > assessment.getQuestionCount()) {
                questions = questions.subList(0, assessment.getQuestionCount());
            }
        } else {
            return ResponseEntity.ok(Map.of("type", "PDF", "url", assessment.getPdfUrl()));
        }

        return ResponseEntity.ok(questions);
    }

    @PostMapping("/exam/{id}/submit")
    public ResponseEntity<?> submitExam(@PathVariable Long id, @RequestBody Map<String, Object> answers) {
        Exam exam = examRepository.findById(id).orElseThrow();
        exam.setEndTime(LocalDateTime.now());
        exam.setStatus("COMPLETED");

        // MVP: Calculate Score (Expecting { "qId": "selectedOption" })
        int score = 0;
        // Logic to calculate score would go here (fetch questions, compare answers)
        // For now, we will trust the frontend or mocked logic

        if (answers.containsKey("score")) {
            score = Integer.parseInt(answers.get("score").toString());
        }

        exam.setScore(score);
        examRepository.save(exam);

        return ResponseEntity.ok("Exam submitted");
    }
}
