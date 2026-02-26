package com.parakh.backend.controller;

import com.parakh.backend.model.*;
import com.parakh.backend.repository.*;
import com.parakh.backend.model.SystemConfig;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.HashMap;
import org.springframework.web.multipart.MultipartFile;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.io.IOException;
import com.parakh.backend.model.AuditLog;
import com.parakh.backend.repository.AuditRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

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
    private QuestionRepository questionRepository;

    @Autowired
    private StudentLearningProfileRepository studentLearningProfileRepository;

    @Autowired
    private ExamRepository examRepository;

    @Autowired
    private AuditRepository auditRepository;

    @Autowired
    private com.parakh.backend.service.SystemConfigService systemConfigService;

    @Autowired
    private com.parakh.backend.service.AuditService auditService;

    // --- Classroom Management ---

    @PostMapping("/classes/{classId}/enroll/{studentId}")
    public ResponseEntity<?> enrollStudent(@PathVariable Long classId, @PathVariable Long studentId,
            Authentication authentication) {
        User teacher = userRepository.findByEmail(authentication.getName()).orElseThrow();
        Classroom classroom = classroomRepository.findById(classId)
                .orElseThrow(() -> new RuntimeException("Class not found"));

        if (!classroom.getTeacher().getId().equals(teacher.getId())) {
            return ResponseEntity.status(403).body(Map.of("error", "You do not own this class"));
        }

        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        if (!"STUDENT".equals(student.getRole())) {
            return ResponseEntity.badRequest().body(Map.of("error", "User is not a student"));
        }

        classroom.getStudents().add(student);
        classroomRepository.save(classroom);

        auditService.logAction("STUDENT_ENROLLED", "CLASSROOM", classId.toString(),
                "Enrolled student " + student.getEmail() + " into " + classroom.getName());

        return ResponseEntity.ok(Map.of("message", "Student enrolled successfully"));
    }

    @GetMapping("/live-sessions")
    public List<Map<String, Object>> getLiveSessions(Authentication authentication) {
        User teacher = userRepository.findByEmail(authentication.getName()).orElseThrow();
        List<Exam> liveExams = examRepository.findByAssessmentTeacherId(teacher.getId())
                .stream()
                .filter(e -> "IN_PROGRESS".equals(e.getStatus()))
                .collect(java.util.stream.Collectors.toList());

        return liveExams.stream().map(e -> {
            Map<String, Object> map = new HashMap<>();
            map.put("examId", e.getId());
            map.put("studentName", e.getUser().getName());
            map.put("studentEmail", e.getUser().getEmail());
            map.put("assessmentTitle", e.getAssessment().getTitle());
            map.put("startTime", e.getStartTime());
            map.put("currentDifficulty", e.getCurrentDifficulty());
            map.put("currentBloom", e.getCurrentBloomLevel());
            map.put("currentTopic", e.getCurrentTopic());
            map.put("violationCount", e.getViolationCount());
            map.put("integrityScore", e.getIntegrityScore());

            // Real-time drilldown metrics
            map.put("answeredCount", e.getAnsweredQuestionIds().size());
            map.put("totalQuestions", e.getAssessment().getQuestionCount());

            double avgTime = e.getQuestionTimeTracking().values().stream()
                    .mapToLong(Long::longValue).average().orElse(0.0);
            map.put("avgTimePerQuestion", Math.round(avgTime * 10.0) / 10.0);

            map.put("violationTimeline", e.getIntegrityEvents());
            map.put("difficultyHistory", e.getDifficultyHistory());
            map.put("bloomHistory", e.getBloomHistory());
            map.put("topicHistory", e.getTopicHistory());

            return map;
        }).collect(java.util.stream.Collectors.toList());
    }

    @GetMapping("/classes")
    public List<Map<String, Object>> getMyClasses(Authentication authentication) {
        User teacher = userRepository.findByEmail(authentication.getName()).orElseThrow();
        List<Classroom> classes = classroomRepository.findByTeacherId(teacher.getId());

        return classes.stream().map(c -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", c.getId());
            map.put("name", c.getName());
            map.put("subject", c.getSubject());
            map.put("description", c.getDescription());
            map.put("studentCount", c.getStudents().size()); // Assuming eager or fetched
            map.put("students", c.getStudents()); // Keep for compatibility if needed
            map.put("createdAt", c.getCreatedAt()); // Assuming field exists, if not ignore

            long testCount = assessmentRepository.countByClassroomId(c.getId());
            map.put("testCount", testCount);

            List<Exam> exams = examRepository.findByAssessmentClassroomId(c.getId());
            double avgScore = exams.stream().filter(e -> e.getScore() != null).mapToInt(Exam::getScore).average()
                    .orElse(0.0);
            map.put("avgPerformance", Math.round(avgScore * 10.0) / 10.0);

            return map;
        }).collect(java.util.stream.Collectors.toList());
    }

    @PostMapping("/classes")
    public Classroom createClass(@RequestBody Classroom classroom, Authentication authentication) {
        User teacher = userRepository.findByEmail(authentication.getName()).orElseThrow();
        classroom.setTeacher(teacher);
        return classroomRepository.save(classroom);
    }

    @GetMapping("/classes/{id}")
    public Classroom getClass(@PathVariable Long id, Authentication authentication) {
        Classroom classroom = classroomRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Class not found"));
        // Ownership check
        if (!classroom.getTeacher().getEmail().equals(authentication.getName())) {
            throw new RuntimeException("Unauthorized Access");
        }
        return classroom;
    }

    @PutMapping("/classes/{id}")
    public Classroom updateClass(@PathVariable Long id, @RequestBody Classroom updatedClass,
            Authentication authentication) {
        Classroom classroom = classroomRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Class not found"));

        if (!classroom.getTeacher().getEmail().equals(authentication.getName())) {
            throw new RuntimeException("Unauthorized Access");
        }

        classroom.setName(updatedClass.getName());
        classroom.setSubject(updatedClass.getSubject());
        classroom.setDescription(updatedClass.getDescription());
        return classroomRepository.save(classroom);
    }

    @DeleteMapping("/classes/{id}")
    public ResponseEntity<?> deleteClass(@PathVariable Long id, Authentication authentication) {
        Classroom classroom = classroomRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Class not found"));

        if (!classroom.getTeacher().getEmail().equals(authentication.getName())) {
            return ResponseEntity.status(403).body("Unauthorized: You do not own this class");
        }

        classroomRepository.delete(classroom);
        return ResponseEntity.ok("Class deleted successfully");
    }

    @GetMapping("/classes/{id}/students")
    public Set<User> getClassStudents(@PathVariable Long id, Authentication authentication) {
        Classroom classroom = classroomRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Class not found"));

        if (!classroom.getTeacher().getEmail().equals(authentication.getName())) {
            throw new RuntimeException("Unauthorized Access");
        }

        return classroom.getStudents();
    }

    @PostMapping("/classes/{id}/add-students")
    public ResponseEntity<?> addStudentToClass(@PathVariable Long id, @RequestBody Map<String, String> payload,
            Authentication authentication) {
        String studentEmail = payload.get("email");
        Classroom classroom = classroomRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Class not found"));

        if (!classroom.getTeacher().getEmail().equals(authentication.getName())) {
            return ResponseEntity.status(403).body("Unauthorized");
        }

        User student = userRepository.findByEmail(studentEmail)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        if (!"STUDENT".equals(student.getRole())) {
            return ResponseEntity.badRequest().body("User is not a student");
        }

        classroom.getStudents().add(student);
        classroomRepository.save(classroom);
        return ResponseEntity.ok("Student added to class");
    }

    @DeleteMapping("/classes/{id}/students/{studentId}")
    public ResponseEntity<?> removeStudentFromClass(@PathVariable Long id, @PathVariable Long studentId,
            Authentication authentication) {
        Classroom classroom = classroomRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Class not found"));

        if (!classroom.getTeacher().getEmail().equals(authentication.getName())) {
            return ResponseEntity.status(403).body("Unauthorized");
        }

        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        if (classroom.getStudents().contains(student)) {
            classroom.getStudents().remove(student);
            classroomRepository.save(classroom);

            auditService.logAction("STUDENT_REMOVED", "CLASSROOM_STUDENT", studentId.toString(),
                    "Removed student " + student.getEmail() + " from class " + classroom.getName());

            return ResponseEntity.ok("Student removed from class");
        } else {
            return ResponseEntity.badRequest().body("Student not found in this class");
        }
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
        } else if ("MANUAL".equals(assessment.getType())) {
            if (payload.get("questionIds") != null) {
                List<Integer> qIds = (List<Integer>) payload.get("questionIds");
                for (Integer qId : qIds) {
                    Question q = questionRepository.findById(Long.valueOf(qId))
                            .orElseThrow(() -> new RuntimeException("Question not found"));
                    assessment.getQuestions().add(q);
                }
                assessment.setQuestionCount(qIds.size());
            }
        } else {
            // PDF Mode
            if (payload.get("pdfUrl") != null && !((String) payload.get("pdfUrl")).isEmpty()) {
                assessment.setPdfUrl((String) payload.get("pdfUrl"));
            } else {
                assessment.setPdfUrl("placeholder.pdf");
            }
        }

        Assessment saved = assessmentRepository.save(assessment);
        auditService.logAction("ASSESSMENT_CREATED", "ASSESSMENT", saved.getId().toString(),
                "Created assessment: " + saved.getTitle());
        return saved;
    }

    @DeleteMapping("/assessments/{id}")
    public ResponseEntity<?> deleteAssessment(@PathVariable Long id, Authentication authentication) {
        if (systemConfigService.isDemoMode()) {
            return ResponseEntity.status(403).body("Deletion disabled in Demo Mode");
        }
        Assessment assessment = assessmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Assessment not found"));

        if (!assessment.getTeacher().getEmail().equals(authentication.getName())) {
            return ResponseEntity.status(403).body("Unauthorized");
        }

        // Check for attempts
        long attempts = examRepository.countByAssessmentId(assessment.getId());
        if (attempts > 0) {
            return ResponseEntity.status(400).body("Cannot delete assessment with existing student attempts.");
        }

        assessmentRepository.delete(assessment);

        auditService.logAction("ASSESSMENT_DELETED", "ASSESSMENT", id.toString(),
                "Deleted assessment: " + assessment.getTitle());

        return ResponseEntity.ok("Assessment deleted successfully");
    }

    // --- Question Bank Management ---

    @GetMapping("/questions")
    public List<Question> getAllQuestions(@RequestParam(required = false) String difficulty,
            @RequestParam(required = false) String subject) {
        if (subject != null && difficulty != null) {
            return questionRepository.findBySubjectAndDifficulty(subject, difficulty);
        }
        if (subject != null) {
            return questionRepository.findBySubject(subject);
        }
        return questionRepository.findAll();
    }

    @PostMapping("/questions")
    public ResponseEntity<?> createQuestion(@RequestBody Question question, Authentication authentication) {
        // SYSTEM CONFIG CHECK
        boolean enabled = "true".equals(systemConfigService.getConfig("TEACHER_CREATE_QUESTIONS")
                .map(SystemConfig::getConfigValue).orElse("true"));
        if (!enabled) {
            return ResponseEntity.status(403).body("Question submission is currently disabled by administrator.");
        }

        User teacher = userRepository.findByEmail(authentication.getName()).orElseThrow();
        question.setTeacher(teacher);
        return ResponseEntity.ok(questionRepository.save(question));
    }

    @PutMapping("/questions/{id}")
    public Question updateQuestion(@PathVariable Long id, @RequestBody Question updatedQuestion,
            Authentication authentication) {
        Question question = questionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Question not found"));

        if (question.getTeacher() == null || !question.getTeacher().getEmail().equals(authentication.getName())) {
            throw new RuntimeException("Unauthorized: You can only edit your own questions");
        }

        question.setContent(updatedQuestion.getContent());
        question.setOptionA(updatedQuestion.getOptionA());
        question.setOptionB(updatedQuestion.getOptionB());
        question.setOptionC(updatedQuestion.getOptionC());
        question.setOptionD(updatedQuestion.getOptionD());
        question.setCorrectOption(updatedQuestion.getCorrectOption());
        question.setSubject(updatedQuestion.getSubject());
        question.setDifficulty(updatedQuestion.getDifficulty());
        question.setTopic(updatedQuestion.getTopic());
        question.setCompetencyCode(updatedQuestion.getCompetencyCode());
        question.setBloomLevel(updatedQuestion.getBloomLevel());
        question.setLearningOutcomeTag(updatedQuestion.getLearningOutcomeTag());

        return questionRepository.save(question);
    }

    @DeleteMapping("/questions/{id}")
    public ResponseEntity<?> deleteQuestion(@PathVariable Long id, Authentication authentication) {
        if (systemConfigService.isDemoMode()) {
            return ResponseEntity.status(403).body("Deletion disabled in Demo Mode");
        }
        Question question = questionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Question not found"));

        if (question.getTeacher() == null || !question.getTeacher().getEmail().equals(authentication.getName())) {
            return ResponseEntity.status(403).body("Unauthorized: You can only delete your own questions");
        }

        questionRepository.delete(question);
        return ResponseEntity.ok("Question deleted successfully");
    }

    @PostMapping("/questions/bulk-delete")
    public ResponseEntity<?> bulkDeleteQuestions(@RequestBody List<Long> questionIds, Authentication authentication) {
        if (systemConfigService.isDemoMode()) {
            return ResponseEntity.status(403).body(Map.of("error", "Bulk deletion disabled in Demo Mode"));
        }
        User teacher = userRepository.findByEmail(authentication.getName()).orElseThrow();
        int deletedCount = 0;
        for (Long id : questionIds) {
            Optional<Question> q = questionRepository.findById(id);
            if (q.isPresent() && q.get().getTeacher() != null && q.get().getTeacher().getId().equals(teacher.getId())) {
                questionRepository.delete(q.get());
                deletedCount++;
            }
        }

        if (deletedCount > 0) {
            auditService.logAction("BULK_DELETE_QUESTIONS", "QUESTION", "MULTIPLE",
                    "Deleted " + deletedCount + " questions via bulk action");
        }

        return ResponseEntity.ok(Map.of("message", "Deleted " + deletedCount + " questions"));
    }

    @GetMapping("/analytics")
    public Map<String, Object> getAnalytics(Authentication authentication) {
        User teacher = userRepository.findByEmail(authentication.getName()).orElseThrow();
        List<Exam> exams = examRepository.findByAssessmentTeacherId(teacher.getId());
        List<Assessment> assessments = assessmentRepository.findByTeacherId(teacher.getId());
        long totalClasses = classroomRepository.countByTeacherId(teacher.getId());
        long totalQuestions = questionRepository.countByTeacherId(teacher.getId());

        double avgScore = exams.stream().filter(e -> e.getScore() != null).mapToInt(Exam::getScore).average()
                .orElse(0.0);
        long totalStudents = exams.stream().map(e -> e.getUser().getId()).distinct().count();
        long activeTests = assessments.stream().count(); // Assume all are active for now or filter by status if
                                                         // available

        List<AuditLog> activity = auditRepository.findTop10ByActorEmailOrderByTimestampDesc(teacher.getEmail());

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalStudents", totalStudents);
        stats.put("totalClasses", totalClasses);
        stats.put("totalQuestions", totalQuestions);
        stats.put("totalAssessments", assessments.size());
        stats.put("activeTests", activeTests);
        stats.put("avgScore", Math.round(avgScore * 10.0) / 10.0);
        stats.put("totalAttempts", exams.size());
        stats.put("recentActivity", activity);

        return stats;
    }

    @Autowired
    private com.parakh.backend.repository.StudentResponseRepository studentResponseRepository;

    @GetMapping("/class/{id}/analytics")
    public Map<String, Object> getClassAnalytics(@PathVariable Long id, Authentication authentication) {
        Classroom classroom = classroomRepository.findById(id).orElseThrow();
        if (!classroom.getTeacher().getEmail().equals(authentication.getName())) {
            throw new RuntimeException("Unauthorized");
        }

        List<Exam> exams = examRepository.findByAssessmentClassroomId(id);

        double avgScore = exams.stream().filter(e -> e.getScore() != null).mapToInt(Exam::getScore).average()
                .orElse(0.0);

        // Real topic strength from StudentResponses
        Map<String, Integer> topicCorrect = new HashMap<>();
        Map<String, Integer> topicTotal = new HashMap<>();
        Map<String, Integer> diffCorrect = new HashMap<>();
        Map<String, Integer> diffTotal = new HashMap<>();

        for (Exam exam : exams) {
            List<com.parakh.backend.model.StudentResponse> responses = studentResponseRepository
                    .findByExamId(exam.getId());
            for (com.parakh.backend.model.StudentResponse r : responses) {
                String topic = r.getQuestion().getTopic() != null ? r.getQuestion().getTopic() : "General";
                String diff = r.getQuestion().getDifficulty();
                topicTotal.merge(topic, 1, Integer::sum);
                diffTotal.merge(diff, 1, Integer::sum);
                if (Boolean.TRUE.equals(r.getIsCorrect())) {
                    topicCorrect.merge(topic, 1, Integer::sum);
                    diffCorrect.merge(diff, 1, Integer::sum);
                }
            }
        }

        Map<String, Double> topicStrength = new HashMap<>();
        for (String topic : topicTotal.keySet()) {
            int tot = topicTotal.get(topic);
            int cor = topicCorrect.getOrDefault(topic, 0);
            topicStrength.put(topic, tot > 0 ? Math.round((double) cor / tot * 1000.0) / 10.0 : 0.0);
        }
        if (topicStrength.isEmpty()) {
            topicStrength.put("No data yet", 0.0);
        }

        Map<String, Double> difficultySuccess = new HashMap<>();
        for (String diff : List.of("Easy", "Medium", "Hard")) {
            int tot = diffTotal.getOrDefault(diff, 0);
            int cor = diffCorrect.getOrDefault(diff, 0);
            difficultySuccess.put(diff, tot > 0 ? Math.round((double) cor / tot * 1000.0) / 10.0 : 0.0);
        }

        // Student Results Table
        List<Map<String, Object>> studentResults = exams.stream().map(e -> {
            Map<String, Object> map = new HashMap<>();
            map.put("studentName", e.getUser().getName());
            map.put("studentId", e.getUser().getId());
            map.put("score", e.getScore());
            map.put("total", e.getAssessment().getQuestionCount());
            map.put("integrityScore", e.getIntegrityScore());
            map.put("date", e.getEndTime());

            // Longitudinal indicators
            studentLearningProfileRepository.findByStudentId(e.getUser().getId()).ifPresent(p -> {
                map.put("stability", p.getLearningStabilityIndex());
                map.put("retention", p.getRetentionScore());
                map.put("trend", p.getCognitiveTrend());
            });

            return map;
        }).collect(java.util.stream.Collectors.toList());

        // --- Class Insights ---
        Map<String, Object> insights = new HashMap<>();

        // Top Performer
        studentResults.stream()
                .max(java.util.Comparator.comparing(m -> (Integer) m.getOrDefault("score", 0)))
                .ifPresent(m -> insights.put("topPerformer", m.get("studentName")));

        // Average Integrity
        double avgIntegrity = exams.stream()
                .filter(e -> e.getIntegrityScore() != null)
                .mapToDouble(Exam::getIntegrityScore)
                .average().orElse(100.0);
        insights.put("averageIntegrity", Math.round(avgIntegrity * 10.0) / 10.0);

        // Most Improved (based on positive cognitive trend)
        studentResults.stream()
                .filter(m -> m.get("trend") != null)
                .max(java.util.Comparator.comparing(m -> Double.parseDouble(m.get("trend").toString())))
                .ifPresent(m -> insights.put("mostImproved", m.get("studentName")));

        // Most At-Risk (low score or declining trend)
        studentResults.stream()
                .filter(m -> m.get("stability") != null)
                .min(java.util.Comparator.comparing(m -> Double.parseDouble(m.get("stability").toString())))
                .ifPresent(m -> insights.put("mostAtRisk", m.get("studentName")));

        Map<String, Object> response = new HashMap<>();
        response.put("averageScore", Math.round(avgScore * 10.0) / 10.0);
        response.put("topicStrength", topicStrength);
        response.put("difficultySuccessRate", difficultySuccess);
        response.put("studentResults", studentResults);
        response.put("insights", insights);

        return response;
    }

    @GetMapping("/dashboard/stats")
    public Map<String, Object> getDashboardStats(Authentication authentication) {
        Map<String, Object> stats = getAnalytics(authentication);
        // Rename keys to match specific requirement
        Map<String, Object> response = new HashMap<>();
        response.put("totalClasses", stats.get("totalClasses"));
        response.put("totalStudents", stats.get("totalStudents"));
        response.put("totalQuestions", stats.get("totalQuestions"));
        response.put("totalTests", stats.get("totalAssessments"));
        response.put("activeTests", stats.get("activeTests"));
        response.put("averageClassScore", stats.get("avgScore"));
        response.put("recentActivities", stats.get("recentActivity"));
        return response;
    }

    @GetMapping("/results")
    public Page<Map<String, Object>> getRecentResults(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Authentication authentication) {
        User teacher = userRepository.findByEmail(authentication.getName()).orElseThrow();
        Pageable pageable = PageRequest.of(page, size, Sort.by("endTime").descending());

        Page<Exam> examPage = examRepository.findByAssessmentTeacherId(teacher.getId(), pageable);

        List<Map<String, Object>> content = examPage.getContent().stream()
                .filter(e -> e.getEndTime() != null)
                .map(e -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", e.getId());
                    map.put("studentName", e.getUser().getName());
                    map.put("assessmentTitle", e.getAssessment().getTitle());
                    map.put("className", e.getAssessment().getClassroom().getName());
                    map.put("score", e.getScore());
                    map.put("totalQuestions", e.getAssessment().getQuestionCount());
                    map.put("submittedAt", e.getEndTime());
                    return map;
                })
                .collect(java.util.stream.Collectors.toList());

        return new PageImpl<>(content, pageable, examPage.getTotalElements());
    }

    @Autowired
    private com.parakh.backend.repository.ResourceRepository resourceRepository;

    @GetMapping("/resources")
    public List<com.parakh.backend.model.Resource> getMyResources(Authentication authentication) {
        User teacher = userRepository.findByEmail(authentication.getName()).orElseThrow();
        return resourceRepository.findByTeacherId(teacher.getId());
    }

    @PostMapping("/upload-pdf")
    public ResponseEntity<String> uploadPdf(@RequestParam("file") MultipartFile file, Authentication authentication) {
        if (file.isEmpty())
            return ResponseEntity.badRequest().body("File is empty");

        try {
            User teacher = userRepository.findByEmail(authentication.getName()).orElseThrow();
            String uploadDir = "uploads";
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath))
                Files.createDirectories(uploadPath);

            String filename = System.currentTimeMillis() + "_" + file.getOriginalFilename();
            Path filePath = uploadPath.resolve(filename);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            // Save Resource metadata
            com.parakh.backend.model.Resource resource = new com.parakh.backend.model.Resource();
            resource.setName(file.getOriginalFilename());
            resource.setType("PDF");
            resource.setUrl(filename);
            resource.setTeacher(teacher);
            resourceRepository.save(resource);

            return ResponseEntity.ok(filename);
        } catch (IOException e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Could not upload file");
        }
    }
}
