package com.parakh.backend.controller;

import com.parakh.backend.model.*;
import com.parakh.backend.repository.*;
import com.parakh.backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/teacher")
@CrossOrigin(origins = { "http://localhost:5173", "http://localhost:5174" })
public class TeacherController {

    @Autowired
    private ClassroomRepository classroomRepository;

    @Autowired
    private AssessmentRepository assessmentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserService userService;

    // --- Classroom Management ---

    @GetMapping("/classes")
    public List<Classroom> getMyClasses(Authentication authentication) {
        User teacher = userRepository.findByEmail(authentication.getName()).orElseThrow();
        return classroomRepository.findByTeacherId(teacher.getId());
    }

    @PostMapping("/classes")
    public Classroom createClass(@RequestBody Classroom classroom, Authentication authentication) {
        User teacher = userRepository.findByEmail(authentication.getName()).orElseThrow();
        classroom.setTeacher(teacher);
        return classroomRepository.save(classroom);
    }

    @GetMapping("/classes/{id}/students")
    public Set<User> getClassStudents(@PathVariable Long id) {
        Classroom classroom = classroomRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Class not found"));
        return classroom.getStudents();
    }

    @PostMapping("/classes/{id}/students")
    public ResponseEntity<?> addStudentToClass(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        String studentEmail = payload.get("email");
        Classroom classroom = classroomRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Class not found"));
        User student = userRepository.findByEmail(studentEmail)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        if (!"STUDENT".equals(student.getRole())) {
            return ResponseEntity.badRequest().body("User is not a student");
        }

        classroom.getStudents().add(student);
        classroomRepository.save(classroom);
        return ResponseEntity.ok("Student added to class");
    }

    // --- Assessment Management ---

    @GetMapping("/assessments")
    public List<Assessment> getMyAssessments(Authentication authentication) {
        User teacher = userRepository.findByEmail(authentication.getName()).orElseThrow();
        return assessmentRepository.findByTeacherId(teacher.getId());
    }

    @PostMapping("/assessments")
    public Assessment createAssessment(@RequestBody Map<String, Object> payload, Authentication authentication) {
        User teacher = userRepository.findByEmail(authentication.getName()).orElseThrow();

        Long classroomId = Long.valueOf(payload.get("classroomId").toString());
        Classroom classroom = classroomRepository.findById(classroomId).orElseThrow();

        Assessment assessment = new Assessment();
        assessment.setTitle((String) payload.get("title"));
        assessment.setClassroom(classroom);
        assessment.setTeacher(teacher);
        assessment.setType((String) payload.get("type")); // "TOPIC" or "PDF"
        assessment.setDurationMinutes(Integer.valueOf(payload.get("durationMinutes").toString()));
        assessment.setStatus("PUBLISHED"); // For MVP, auto-publish

        if ("TOPIC".equals(assessment.getType())) {
            assessment.setSubject((String) payload.get("subject"));
            assessment.setTopic((String) payload.get("topic")); // Can be null if generic
            assessment.setDifficulty((String) payload.get("difficulty"));
            assessment.setQuestionCount(Integer.valueOf(payload.get("questionCount").toString()));
        } else {
            // PDF Mode
            assessment.setPdfUrl("placeholder.pdf");
        }

        return assessmentRepository.save(assessment);
    }
}
