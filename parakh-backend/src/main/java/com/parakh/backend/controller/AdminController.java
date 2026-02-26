package com.parakh.backend.controller;

import com.parakh.backend.model.Question;
import com.parakh.backend.model.User;
import com.parakh.backend.service.QuestionService;
import com.parakh.backend.service.UserService;
import com.parakh.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = { "http://localhost:5173", "http://localhost:5174" })
public class AdminController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserService userService;

    @Autowired
    private QuestionService questionService;

    @Autowired
    private com.parakh.backend.service.AuditService auditService; // Use fully qualified class name

    @Autowired
    private com.parakh.backend.service.InstitutionalAnalyticsService institutionalAnalyticsService;

    @Autowired
    private com.parakh.backend.service.IntegrityService integrityService;

    @Autowired
    private com.parakh.backend.repository.AssessmentRepository assessmentRepository;

    @Autowired
    private com.parakh.backend.repository.ExamRepository examRepository;

    @Autowired
    private com.parakh.backend.repository.ProgressCardRepository progressCardRepository;

    @Autowired
    private com.parakh.backend.service.SystemConfigService systemConfigService;

    // --- Institutional Intelligence (Phase 8) ---

    @GetMapping("/institutional-benchmark")
    public ResponseEntity<?> getInstitutionalBenchmark(Authentication authentication) {
        User admin = userRepository.findByEmail(authentication.getName()).orElseThrow();
        return ResponseEntity.ok(institutionalAnalyticsService.getInstitutionalBenchmark(admin.getInstitutionId()));
    }

    @GetMapping("/integrity-stats")
    public ResponseEntity<?> getIntegrityStats() {
        return ResponseEntity.ok(integrityService.getAggregateIntegrityStats());
    }

    // --- User Management ---

    @GetMapping("/users")
    public Page<User> getAllUsers(
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "desc") String direction) {

        Sort sort = direction.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);

        if (role != null && status != null) {
            return userRepository.findByRoleAndStatus(role, status, pageable);
        } else if (role != null) {
            return userRepository.findByRole(role, pageable);
        } else if (status != null) {
            return userRepository.findByStatus(status, pageable);
        }
        return userRepository.findAll(pageable);
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<User> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    @PostMapping("/users")
    public User createUser(@RequestBody User user) {
        User created = userService.createUser(user);
        auditService.logAction("CREATE_USER", "USER", created.getId().toString(),
                "Created user: " + created.getEmail());
        return created;
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<User> updateUser(@PathVariable Long id, @RequestBody User userDetails) {
        User updated = userService.updateUser(id, userDetails);
        auditService.logAction("USER_UPDATED", "USER", id.toString(), "Updated user details for " + updated.getEmail());
        return ResponseEntity.ok(updated);
    }

    @PutMapping("/users/{id}/approve")
    public ResponseEntity<?> approveUser(@PathVariable Long id) {
        if (systemConfigService.isDemoMode()) {
            return ResponseEntity.status(403).body(Map.of("error", "Actions disabled in Demo Mode"));
        }
        userService.approveUser(id);
        auditService.logAction("APPROVE_USER", "USER", id.toString(), "Approved user registration");
        return ResponseEntity.ok().build();
    }

    @PutMapping("/users/{id}/reject")
    public ResponseEntity<?> rejectUser(@PathVariable Long id) {
        userService.rejectUser(id);
        auditService.logAction("REJECT_USER", "USER", id.toString(), "Rejected/Disabled user");
        return ResponseEntity.ok().build();
    }

    @PutMapping("/users/{id}/disable")
    public ResponseEntity<?> disableUser(@PathVariable Long id) {
        userService.rejectUser(id); // Reusing reject logic for disable as status is same or similar
        auditService.logAction("DISABLE_USER", "USER", id.toString(), "Disabled user account");
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        if (systemConfigService.isDemoMode()) {
            return ResponseEntity.status(403).body(Map.of("error", "Deletion disabled in Demo Mode"));
        }
        // Soft delete: change status to DELETED
        User user = userService.getUserById(id);
        user.setStatus("DELETED");
        userService.updateUser(id, user);
        auditService.logAction("USER_DELETED", "USER", id.toString(), "Soft deleted user account");
        return ResponseEntity.ok().build();
    }

    // --- Bulk User Actions ---

    @PutMapping("/users/bulk/approve")
    public ResponseEntity<?> approveUsersBulk(@RequestBody List<Long> ids) {
        for (Long id : ids) {
            try {
                userService.approveUser(id);
                auditService.logAction("USER_APPROVED", "USER", id.toString(), "Bulk approved");
            } catch (Exception e) {
                // log error but continue
            }
        }
        return ResponseEntity.ok().build();
    }

    @PutMapping("/users/bulk/reject")
    public ResponseEntity<?> rejectUsersBulk(@RequestBody List<Long> ids) {
        for (Long id : ids) {
            try {
                userService.rejectUser(id);
                auditService.logAction("USER_REJECTED", "USER", id.toString(), "Bulk rejected/disabled");
            } catch (Exception e) {
            }
        }
        return ResponseEntity.ok().build();
    }

    @PutMapping("/users/bulk/delete")
    public ResponseEntity<?> deleteUsersBulk(@RequestBody List<Long> ids) {
        if (systemConfigService.isDemoMode()) {
            return ResponseEntity.status(403).body(Map.of("error", "Bulk deletion disabled in Demo Mode"));
        }
        for (Long id : ids) {
            try {
                User user = userService.getUserById(id);
                user.setStatus("DELETED");
                userService.updateUser(id, user);
                auditService.logAction("USER_DELETED", "USER", id.toString(), "Bulk soft deleted");
            } catch (Exception e) {
            }
        }
        return ResponseEntity.ok().build();
    }

    @PutMapping("/users/bulk/role")
    public ResponseEntity<?> changeRoleBulk(@RequestBody Map<String, Object> payload) {
        String newRole = (String) payload.get("role");
        List<Integer> idsInt = (List<Integer>) payload.get("ids"); // JSON might deserialize to Integer

        if (newRole == null || idsInt == null)
            return ResponseEntity.badRequest().build();

        for (Integer idInt : idsInt) {
            Long id = Long.valueOf(idInt);
            try {
                User user = userService.getUserById(id);
                if (!"ADMIN".equals(user.getRole())) { // Prevent changing main ADMIN role easily via bulk
                    user.setRole(newRole);
                    userService.updateUser(id, user);
                    auditService.logAction("CHANGE_ROLE", "USER", id.toString(), "Bulk role change to " + newRole);
                }
            } catch (Exception e) {
            }
        }
        return ResponseEntity.ok().build();
    }

    // --- System Controls ---

    private static boolean registrationEnabled = true;

    @GetMapping("/system/registration-status")
    public ResponseEntity<Boolean> getRegistrationStatus() {
        return ResponseEntity.ok(registrationEnabled);
    }

    @PutMapping("/system/toggle-registration")
    public ResponseEntity<?> toggleRegistration() {
        if (systemConfigService.isDemoMode()) {
            return ResponseEntity.status(403).body(Map.of("error", "Operation disabled in Demo Mode"));
        }
        registrationEnabled = !registrationEnabled;
        auditService.logAction("TOGGLE_REGISTRATION", "SYSTEM", null,
                "Registration " + (registrationEnabled ? "Enabled" : "Disabled"));
        return ResponseEntity.ok(registrationEnabled);
    }

    // --- Question Management (READ ONLY FOR ADMIN) ---

    @GetMapping("/questions")
    public List<Question> getAllQuestions() {
        return questionService.getAllQuestions();
    }

    @GetMapping("/questions/{id}")
    public ResponseEntity<Question> getQuestionById(@PathVariable Long id) {
        return ResponseEntity.ok(questionService.getQuestionById(id));
    }

    // Removed Create/Update/Delete Question endpoints for Admin as per
    // requirements.

    // --- Stats & Audits ---

    @GetMapping("/stats")
    public Map<String, Object> getStats() {
        Map<String, Object> stats = new HashMap<>();
        List<User> allUsers = userService.getAllUsers();

        // Summary Cards
        stats.put("totalUsers", allUsers.stream().filter(u -> !"DELETED".equals(u.getStatus())).count());
        stats.put("approvedUsers", allUsers.stream().filter(u -> "APPROVED".equals(u.getStatus())).count());
        stats.put("pendingUsers", allUsers.stream().filter(u -> "PENDING".equals(u.getStatus())).count());
        stats.put("teachersCount", allUsers.stream()
                .filter(u -> "TEACHER".equals(u.getRole()) && !"DELETED".equals(u.getStatus())).count());
        stats.put("studentsCount", allUsers.stream()
                .filter(u -> "STUDENT".equals(u.getRole()) && !"DELETED".equals(u.getStatus())).count());
        stats.put("totalQuestions", questionService.getAllQuestions().size());
        stats.put("totalExams", 0); // Placeholder
        stats.put("activeSessions", (int) (Math.random() * 50) + 10); // Mock active sessions

        // Graph Data: User Registration Trend
        List<String> registrationDates = allUsers.stream()
                .map(u -> u.getCreatedAt().toLocalDate().toString())
                .toList();
        stats.put("registrationDates", registrationDates);

        // Role Distribution
        Map<String, Long> roleDistribution = new HashMap<>();
        roleDistribution.put("ADMIN", allUsers.stream().filter(u -> "ADMIN".equals(u.getRole())).count());
        roleDistribution.put("TEACHER", allUsers.stream().filter(u -> "TEACHER".equals(u.getRole())).count());
        roleDistribution.put("STUDENT", allUsers.stream().filter(u -> "STUDENT".equals(u.getRole())).count());
        stats.put("roleDistribution", roleDistribution);

        return stats;
    }

    @GetMapping("/audit-logs")
    public Page<com.parakh.backend.model.AuditLog> getAuditLogs(
            @RequestParam(required = false) String action,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "timestamp") String sortBy,
            @RequestParam(defaultValue = "desc") String direction) {

        Sort sort = direction.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);
        return auditService.getLogs(action, pageable);
    }

    @GetMapping("/audit-logs/export")
    public void exportAuditLogs(jakarta.servlet.http.HttpServletResponse response) throws java.io.IOException {
        response.setContentType("text/csv");
        response.setHeader("Content-Disposition",
                "attachment; filename=audit_logs_" + java.time.LocalDate.now() + ".csv");

        java.io.PrintWriter writer = response.getWriter();
        writer.println("Timestamp,Action,Admin,Role,IP Address,User Agent,Details");

        List<com.parakh.backend.model.AuditLog> logs = auditService.getAllLogs();
        for (com.parakh.backend.model.AuditLog log : logs) {
            writer.printf("%s,%s,%s,%s,%s,%s,%s%n",
                    log.getTimestamp(),
                    escapeCsv(log.getAction()),
                    escapeCsv(log.getActorEmail()),
                    escapeCsv(log.getPerformerRole()),
                    escapeCsv(log.getIpAddress()),
                    escapeCsv(log.getUserAgent()),
                    escapeCsv(log.getDetails()));
        }
        writer.flush();
    }

    private String escapeCsv(String value) {
        if (value == null)
            return "";
        value = value.replace("\"", "\"\"");
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value + "\"";
        }
        return value;
    }

    @GetMapping("/stats/institution")
    public Map<String, Object> getInstitutionStats() {
        List<User> users = userService.getAllUsers();
        Map<String, Long> userCount = new HashMap<>();
        Map<String, Long> approvalCount = new HashMap<>();

        for (User u : users) {
            String inst = u.getInstitution();
            if (inst == null || inst.isEmpty())
                inst = "Unknown";
            userCount.put(inst, userCount.getOrDefault(inst, 0L) + 1);

            if ("APPROVED".equals(u.getStatus())) {
                approvalCount.put(inst, approvalCount.getOrDefault(inst, 0L) + 1);
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("usersPerInstitution", userCount);
        result.put("approvalsPerInstitution", approvalCount);
        return result;
    }

    @GetMapping("/stats/performance")
    public Map<String, Object> getPerformanceStats() {
        // Mock data for Phase 5 content until Exam/Result service is fully populated
        // with real data
        Map<String, Object> perf = new HashMap<>();
        perf.put("avgStudentScore", 78.5);
        perf.put("avgCompletionTime", 42); // minutes
        perf.put("difficultyDistribution", Map.of("Easy", 30, "Medium", 50, "Hard", 20));
        perf.put("mostAttemptedTopic", "Java Streams");
        return perf;
    }

    @PostMapping("/generate-demo-results")
    public ResponseEntity<?> generateDemoResults() {
        com.parakh.backend.model.Assessment assessment = assessmentRepository.findById(1L).orElseThrow();
        String[] studentEmails = {
                "student1@test.com", "student2@test.com", "student3@test.com",
                "student4@test.com", "student5@test.com"
        };

        for (int i = 0; i < studentEmails.length; i++) {
            String email = studentEmails[i];
            User student = userRepository.findByEmail(email).orElseThrow();

            // Clean up old demo data
            examRepository.findAllByUserIdAndAssessmentId(student.getId(), 1L).forEach(e -> {
                progressCardRepository.deleteByExamId(e.getId());
                examRepository.delete(e);
            });

            com.parakh.backend.model.Exam exam = new com.parakh.backend.model.Exam();
            exam.setUser(student);
            exam.setAssessment(assessment);
            exam.setSubject(assessment.getSubject());
            exam.setStartTime(java.time.LocalDateTime.now().minusHours(1));
            exam.setEndTime(java.time.LocalDateTime.now().minusMinutes(30));
            exam.setStatus("COMPLETED");
            exam.setCurrentTopic("Algebra");
            exam.setViolationCount(i == 3 ? 2 : 0); // Student4 has violations

            // Performance profiles
            int score;
            String risk;
            double integrity;
            String masteryJson;

            switch (i) {
                case 0: // Student1 -> High
                    score = 14;
                    risk = "LOW";
                    integrity = 98.0;
                    masteryJson = "{\"Algebra\":95, \"Geometry\":90, \"Calculus\":88}";
                    exam.setCurrentDifficulty("Hard");
                    exam.setCurrentBloomLevel("Analyze");
                    break;
                case 1: // Student2 -> Medium
                    score = 10;
                    risk = "MEDIUM";
                    integrity = 95.0;
                    masteryJson = "{\"Algebra\":70, \"Geometry\":65, \"Calculus\":60}";
                    exam.setCurrentDifficulty("Medium");
                    exam.setCurrentBloomLevel("Apply");
                    break;
                case 2: // Student3 -> Low
                    score = 5;
                    risk = "HIGH";
                    integrity = 92.0;
                    masteryJson = "{\"Algebra\":40, \"Geometry\":35, \"Calculus\":30}";
                    exam.setCurrentDifficulty("Easy");
                    exam.setCurrentBloomLevel("Remember");
                    break;
                case 3: // Student4 -> High but integrity risk
                    score = 13;
                    risk = "HIGH";
                    integrity = 45.0; // Suspicious
                    masteryJson = "{\"Algebra\":92, \"Geometry\":88, \"Calculus\":85}";
                    exam.setCurrentDifficulty("Hard");
                    exam.setCurrentBloomLevel("Analyze");
                    break;
                default: // Student5 -> Moderate with weakness
                    score = 8;
                    risk = "MEDIUM";
                    integrity = 88.0;
                    masteryJson = "{\"Algebra\":80, \"Geometry\":20, \"Calculus\":75}";
                    exam.setCurrentDifficulty("Medium");
                    exam.setCurrentBloomLevel("Understand");
                    break;
            }

            exam.setScore(score);
            exam.setIntegrityScore(integrity);

            // Mock progression history
            exam.getDifficultyHistory()
                    .addAll(List.of("Easy", "Easy", "Medium", "Medium", "Medium", "Hard", exam.getCurrentDifficulty()));
            exam.getBloomHistory().addAll(List.of("Remember", "Remember", "Understand", "Understand", "Apply", "Apply",
                    exam.getCurrentBloomLevel()));

            examRepository.save(exam);

            // Create Progress Card
            com.parakh.backend.model.ProgressCard card = new com.parakh.backend.model.ProgressCard();
            card.setExam(exam);
            card.setStudent(student);
            card.setAcademicScore((double) score / 15 * 100);
            card.setRiskIndicator(risk);
            card.setTopicMasteryJson(masteryJson);
            card.setAiExplanation("Simulated demo performance profile for presenting " + risk + " risk scenario.");
            card.setConfidenceScore(score > 10 ? 85.0 : score > 7 ? 60.0 : 30.0);
            card.setGrowthScore(65.0);
            card.setCompetencyIndex(score * 6.0);
            card.setLearningConsistency(integrity);
            progressCardRepository.save(card);
        }

        auditService.logAction("GENERATE_DEMO_RESULTS", "SYSTEM", null,
                "Generated 5 simulated student results for assessment 1");
        return ResponseEntity.ok(Map.of("message", "Demo results generated for 5 students"));
    }
}
