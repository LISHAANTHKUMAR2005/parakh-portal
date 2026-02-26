package com.parakh.backend.controller;

import com.parakh.backend.model.*;
import com.parakh.backend.repository.*;
import com.parakh.backend.service.AnalyticsService;
import com.parakh.backend.service.RemedialEngineService;
import com.parakh.backend.service.LearningPathService;
import com.parakh.backend.service.SystemConfigService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
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
    private AnalyticsService analyticsService;
    @Autowired
    private RemedialEngineService remedialEngineService;
    @Autowired
    private LearningPathService learningPathService;
    @Autowired
    private StudentResponseRepository studentResponseRepository;
    @Autowired
    private ProgressCardRepository progressCardRepository;
    @Autowired
    private StudentLearningProfileRepository studentLearningProfileRepository;

    @Autowired
    private SystemConfigService systemConfigService;

    @Autowired
    private com.parakh.backend.service.AuditService auditService;

    // ─── Paginated History ───────────────────────────────────────────────────
    @GetMapping("/history")
    public Page<Exam> getExamHistory(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Authentication authentication) {
        User student = userRepository.findByEmail(authentication.getName()).orElseThrow();
        Pageable pageable = PageRequest.of(page, size, Sort.by("endTime").descending());
        return examRepository.findByUserId(student.getId(), pageable);
    }

    // ─── Existing endpoints ────────────────────────────────────────────────────

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
        LocalDateTime now = LocalDateTime.now();

        for (Classroom cls : classes) {
            List<Assessment> assessments = assessmentRepository.findByClassroomId(cls.getId());
            for (Assessment assessment : assessments) {
                if (!"PUBLISHED".equals(assessment.getStatus()))
                    continue;

                // Check availability window
                if (assessment.getAvailableFrom() != null && now.isBefore(assessment.getAvailableFrom()))
                    continue;
                if (assessment.getAvailableUntil() != null && now.isAfter(assessment.getAvailableUntil()))
                    continue;

                Map<String, Object> map = new HashMap<>();
                map.put("id", assessment.getId());
                map.put("title", assessment.getTitle());
                map.put("subject", assessment.getSubject());
                map.put("classroom", cls.getName());
                map.put("type", assessment.getType());
                map.put("durationMinutes", assessment.getDurationMinutes());
                map.put("maxAttempts", assessment.getMaxAttempts());
                map.put("availableUntil", assessment.getAvailableUntil());

                List<Exam> attempts = examRepository.findAllByUserIdAndAssessmentId(student.getId(),
                        assessment.getId());
                map.put("attemptCount", attempts.size());

                if (!attempts.isEmpty()) {
                    // Sort by start time to get the latest
                    attempts.sort(Comparator.comparing(Exam::getStartTime).reversed());
                    Exam latest = attempts.get(0);
                    map.put("status", latest.getStatus());
                    map.put("score", latest.getScore());
                    map.put("examId", latest.getId());
                    map.put("integrityScore", latest.getIntegrityScore());
                } else {
                    map.put("status", "PENDING");
                }

                // Allow another attempt if within limit or if there's an in-progress one to
                // resume
                boolean hasInProgress = attempts.stream().anyMatch(e -> "IN_PROGRESS".equals(e.getStatus()));
                map.put("canAttempt", hasInProgress || (attempts.stream()
                        .filter(e -> !"IN_PROGRESS".equals(e.getStatus())).count() < assessment.getMaxAttempts()));

                result.add(map);
            }
        }
        return result;
    }

    @PostMapping("/assessments/{id}/start")
    public ResponseEntity<?> startAssessment(@PathVariable Long id, Authentication authentication) {
        User student = userRepository.findByEmail(authentication.getName()).orElseThrow();
        Assessment assessment = assessmentRepository.findById(id).orElseThrow();

        // Check if Remedial Mode is enforced
        boolean remedialEnforced = "true".equals(systemConfigService.getConfig("REMEDIAL_MODE_ENFORCED")
                .map(SystemConfig::getConfigValue).orElse("false"));

        if (remedialEnforced) {
            StudentLearningProfile profile = analyticsService.computeLongitudinalMetrics(student.getId());
            if (profile != null && "DECLINING".equals(profile.getCognitiveTrend())) {
                return ResponseEntity.status(403).body(Map.of("error", "REMEDIAL_REQUIRED",
                        "message", "Cognitive trajectory is DECLINING. Complete Foundation Reassessment first."));
            }
        }

        if (examRepository.findByUserIdAndAssessmentId(student.getId(), id).isPresent())
            return ResponseEntity.badRequest().body("Exam already started or completed");
        Exam exam = new Exam();
        exam.setUser(student);
        exam.setAssessment(assessment);
        exam.setSubject(assessment.getSubject() != null ? assessment.getSubject() : "General");
        exam.setStartTime(LocalDateTime.now());
        exam.setStatus("IN_PROGRESS");
        exam.setScore(0);
        examRepository.save(exam);
        auditService.logAction("EXAM_STARTED", "ASSESSMENT", assessment.getId().toString(),
                "Started assessment: " + assessment.getTitle());
        return ResponseEntity.ok(Map.of("examId", exam.getId(), "message", "Exam started"));
    }

    @GetMapping("/my/remediation-plan")
    public ResponseEntity<?> getRemedialPlan(Authentication authentication) {
        User student = userRepository.findByEmail(authentication.getName()).orElseThrow();
        try {
            return ResponseEntity.ok(remedialEngineService.computeRemedialPlan(student.getId()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/start-remedial")
    public ResponseEntity<?> startRemedialSession(Authentication authentication) {
        User student = userRepository.findByEmail(authentication.getName()).orElseThrow();
        try {
            return ResponseEntity.ok(remedialEngineService.startRemedialSession(student.getId()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/my/learning-path")
    public ResponseEntity<?> getMyLearningPath(Authentication authentication) {
        User student = userRepository.findByEmail(authentication.getName()).orElseThrow();
        return ResponseEntity.ok(learningPathService.generateLearningPath(student.getId()));
    }

    @GetMapping("/my/cognitive-profile")
    public ResponseEntity<?> getMyCognitiveProfile(Authentication authentication) {
        User student = userRepository.findByEmail(authentication.getName()).orElseThrow();
        return ResponseEntity.ok(analyticsService.computeLongitudinalMetrics(student.getId()));
    }

    // ══════════════════════════════════════════════════════════════════════════
    // COMPLETION PHASE — New Endpoints
    // ══════════════════════════════════════════════════════════════════════════

    /**
     * GET /api/student/my/profile — Academic profile + cognitive metrics + risk
     * history
     */
    @GetMapping("/my/profile")
    public ResponseEntity<?> getMyProfile(Authentication authentication) {
        User student = userRepository.findByEmail(authentication.getName()).orElseThrow();
        Long sid = student.getId();

        StudentLearningProfile profile = analyticsService.computeLongitudinalMetrics(sid);

        List<ProgressCard> cards = progressCardRepository
                .findByStudentIdOrderByGeneratedAtDesc(sid).stream().limit(10).collect(Collectors.toList());

        List<Map<String, Object>> riskHistory = new ArrayList<>();
        for (int i = cards.size() - 1; i >= 0; i--) {
            ProgressCard c = cards.get(i);
            Map<String, Object> e = new LinkedHashMap<>();
            e.put("date", c.getGeneratedAt().toLocalDate().toString());
            e.put("riskScore", c.getRiskScore());
            e.put("riskIndicator", c.getRiskIndicator());
            e.put("academicScore", c.getAcademicScore());
            riskHistory.add(e);
        }

        List<Exam> exams = examRepository.findByUserId(sid);
        long completed = exams.stream()
                .filter(ex -> "COMPLETED".equals(ex.getStatus()) || "TERMINATED".equals(ex.getStatus())).count();
        double avgIntegrity = exams.stream().filter(ex -> ex.getIntegrityScore() != null)
                .mapToDouble(Exam::getIntegrityScore).average().orElse(100.0);

        Map<String, Object> cognitive = new LinkedHashMap<>();
        if (profile != null) {
            cognitive.put("stabilityIndex", profile.getLearningStabilityIndex());
            cognitive.put("retentionScore", profile.getRetentionScore());
            cognitive.put("accelerationScore", profile.getAccelerationScore());
            cognitive.put("cognitiveTrend", profile.getCognitiveTrend());
            cognitive.put("lastUpdated", profile.getLastUpdated());
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", student.getId());
        result.put("name", student.getName());
        result.put("email", student.getEmail());
        result.put("role", student.getRole());
        result.put("enrolledAt", student.getCreatedAt() != null ? student.getCreatedAt().toString() : null);
        result.put("examsCompleted", completed);
        result.put("avgIntegrityScore", Math.round(avgIntegrity * 10.0) / 10.0);
        result.put("cognitiveProfile", cognitive);
        result.put("riskHistory", riskHistory);
        return ResponseEntity.ok(result);
    }

    /**
     * GET /api/student/my/competency-transcript — Per-topic: mastery, attempts,
     * bloom, trend
     */
    @GetMapping("/my/competency-transcript")
    public ResponseEntity<?> getCompetencyTranscript(Authentication authentication) {
        User student = userRepository.findByEmail(authentication.getName()).orElseThrow();
        Long sid = student.getId();

        List<Exam> exams = examRepository.findByUserId(sid).stream()
                .filter(e -> "COMPLETED".equals(e.getStatus()) || "TERMINATED".equals(e.getStatus()))
                .collect(Collectors.toList());

        Map<String, List<StudentResponse>> byTopic = new LinkedHashMap<>();
        for (Exam e : exams) {
            for (StudentResponse r : studentResponseRepository.findByExamId(e.getId())) {
                String topic = (r.getQuestion() != null && r.getQuestion().getTopic() != null)
                        ? r.getQuestion().getTopic()
                        : "General";
                byTopic.computeIfAbsent(topic, k -> new ArrayList<>()).add(r);
            }
        }

        List<Map<String, Object>> transcript = new ArrayList<>();
        for (Map.Entry<String, List<StudentResponse>> entry : byTopic.entrySet()) {
            List<StudentResponse> rs = entry.getValue();
            long correct = rs.stream().filter(r -> Boolean.TRUE.equals(r.getIsCorrect())).count();
            double mastery = rs.isEmpty() ? 0 : (double) correct / rs.size() * 100;

            Set<String> blooms = rs.stream()
                    .filter(r -> r.getQuestion() != null && r.getQuestion().getBloomLevel() != null)
                    .map(r -> r.getQuestion().getBloomLevel())
                    .collect(Collectors.toCollection(LinkedHashSet::new));

            Map<Long, List<StudentResponse>> byExam = rs.stream()
                    .collect(Collectors.groupingBy(r -> r.getExam().getId()));
            List<Double> scores = byExam.values().stream()
                    .map(list -> {
                        long c = list.stream().filter(r -> Boolean.TRUE.equals(r.getIsCorrect())).count();
                        return list.isEmpty() ? 0.0 : (double) c / list.size() * 100;
                    }).collect(Collectors.toList());

            String trend = "STABLE";
            if (scores.size() >= 2) {
                double diff = scores.get(scores.size() - 1) - scores.get(0);
                if (diff > 10)
                    trend = "UP";
                else if (diff < -10)
                    trend = "DOWN";
            }

            Map<String, Object> row = new LinkedHashMap<>();
            row.put("topic", entry.getKey());
            row.put("mastery", Math.round(mastery * 10.0) / 10.0);
            row.put("attempts", rs.size());
            row.put("correct", correct);
            row.put("bloomExposure", new ArrayList<>(blooms));
            row.put("trend", trend);
            row.put("examScores", scores);
            transcript.add(row);
        }
        transcript.sort(Comparator.comparingDouble(m -> (double) m.get("mastery")));
        return ResponseEntity.ok(Map.of("transcript", transcript, "totalTopics", transcript.size(),
                "generatedAt", java.time.LocalDate.now().toString()));
    }

    /**
     * GET /api/student/my/progress-timeline — Academic, risk, confidence, integrity
     * trend series
     */
    @GetMapping("/my/progress-timeline")
    public ResponseEntity<?> getProgressTimeline(Authentication authentication) {
        User student = userRepository.findByEmail(authentication.getName()).orElseThrow();
        Long sid = student.getId();

        List<ProgressCard> cards = progressCardRepository.findByStudentIdOrderByGeneratedAtDesc(sid)
                .stream().limit(15).collect(Collectors.toList());
        Collections.reverse(cards);

        List<Map<String, Object>> timeline = new ArrayList<>();
        for (ProgressCard c : cards) {
            Map<String, Object> pt = new LinkedHashMap<>();
            pt.put("date", c.getGeneratedAt().toLocalDate().toString());
            pt.put("academicScore", c.getAcademicScore());
            pt.put("riskScore", c.getRiskScore());
            pt.put("confidenceScore", c.getConfidenceScore());
            pt.put("riskIndicator", c.getRiskIndicator());
            timeline.add(pt);
        }

        List<Map<String, Object>> integrityTimeline = examRepository.findByUserId(sid).stream()
                .filter(e -> ("COMPLETED".equals(e.getStatus()) || "TERMINATED".equals(e.getStatus()))
                        && e.getIntegrityScore() != null && e.getStartTime() != null)
                .sorted(Comparator.comparing(Exam::getStartTime))
                .map(e -> {
                    Map<String, Object> pt = new LinkedHashMap<>();
                    pt.put("date", e.getStartTime().toLocalDate().toString());
                    pt.put("integrityScore", e.getIntegrityScore());
                    pt.put("examTitle",
                            e.getAssessment() != null ? e.getAssessment().getTitle() : "Exam #" + e.getId());
                    return pt;
                }).collect(Collectors.toList());

        StudentLearningProfile profile = analyticsService.computeLongitudinalMetrics(sid);
        String badge = (profile != null && profile.getCognitiveTrend() != null) ? profile.getCognitiveTrend()
                : "INSUFFICIENT_DATA";

        return ResponseEntity.ok(Map.of("timeline", timeline, "integrityTimeline", integrityTimeline,
                "trajectoryBadge", badge, "totalDataPoints", timeline.size()));
    }

    /**
     * GET /api/student/my/notifications — Alerts, new exams, risk alerts, remedial
     * recs
     */
    @GetMapping("/my/notifications")
    public ResponseEntity<?> getNotifications(Authentication authentication) {
        User student = userRepository.findByEmail(authentication.getName()).orElseThrow();
        Long sid = student.getId();
        List<Map<String, Object>> notifications = new ArrayList<>();
        int id = 1;

        for (Classroom cls : classroomRepository.findByStudentsId(sid)) {
            for (Assessment a : assessmentRepository.findByClassroomId(cls.getId())) {
                if (!"PUBLISHED".equals(a.getStatus()))
                    continue;
                if (examRepository.findByUserIdAndAssessmentId(sid, a.getId()).isPresent())
                    continue;
                Map<String, Object> n = new LinkedHashMap<>();
                n.put("id", id++);
                n.put("type", "NEW_ASSESSMENT");
                n.put("priority", "HIGH");
                n.put("title", "New Examination Available");
                n.put("message",
                        "\"" + a.getTitle() + "\" is assigned in " + cls.getName() + ". Schedule your attempt.");
                n.put("action", "START_EXAM");
                n.put("assessmentId", a.getId());
                n.put("timestamp", java.time.LocalDate.now().toString());
                notifications.add(n);
            }
        }

        List<ProgressCard> cards = progressCardRepository.findByStudentIdOrderByGeneratedAtDesc(sid);
        if (!cards.isEmpty()) {
            ProgressCard latest = cards.get(0);
            if ("HIGH".equals(latest.getRiskIndicator()) || "MEDIUM".equals(latest.getRiskIndicator())) {
                Map<String, Object> n = new LinkedHashMap<>();
                n.put("id", id++);
                n.put("type", "RISK_ALERT");
                n.put("priority", "HIGH".equals(latest.getRiskIndicator()) ? "CRITICAL" : "MEDIUM");
                n.put("title", "HIGH".equals(latest.getRiskIndicator()) ? "High Academic Risk Detected"
                        : "Moderate Risk Indicator");
                n.put("message", "Your risk score is " + Math.round(latest.getRiskScore()) + "/100. " +
                        ("HIGH".equals(latest.getRiskIndicator()) ? "Immediate remediation required."
                                : "Targeted practice recommended."));
                n.put("action", "VIEW_REMEDIATION");
                n.put("timestamp", latest.getGeneratedAt().toLocalDate().toString());
                notifications.add(n);
            }
        }

        StudentLearningProfile profile = analyticsService.computeLongitudinalMetrics(sid);
        if (profile != null && "DECLINING".equals(profile.getCognitiveTrend())) {
            Map<String, Object> n = new LinkedHashMap<>();
            n.put("id", id++);
            n.put("type", "COGNITIVE_ALERT");
            n.put("priority", "CRITICAL");
            n.put("title", "Cognitive Decline Detected");
            n.put("message",
                    "Your cognitive trajectory is DECLINING. Advanced exams are restricted. Please start a remedial session.");
            n.put("action", "START_REMEDIAL");
            n.put("timestamp", java.time.LocalDate.now().toString());
            notifications.add(n);
        }

        try {
            Map<String, Object> plan = remedialEngineService.computeRemedialPlan(sid);
            if (plan != null && plan.get("recommendedTopic") != null) {
                Map<String, Object> n = new LinkedHashMap<>();
                n.put("id", id++);
                n.put("type", "REMEDIAL_RECOMMENDATION");
                n.put("priority", "MEDIUM");
                n.put("title", "Personalised Practice Available");
                n.put("message", "Adaptive engine recommends " + plan.get("recommendedPracticeCount") +
                        " questions on \"" + plan.get("recommendedTopic") + "\". Est. "
                        + plan.get("estimatedRemediationTime") + " min.");
                n.put("action", "START_REMEDIAL");
                n.put("timestamp", java.time.LocalDate.now().toString());
                notifications.add(n);
            }
        } catch (Exception ignored) {
        }

        // Dynamic System Notice from Config
        boolean noticeEnabled = "true".equals(systemConfigService.getConfig("SYSTEM_NOTICE_ENABLED")
                .map(SystemConfig::getConfigValue).orElse("true"));

        if (noticeEnabled) {
            String title = systemConfigService.getConfig("SYSTEM_NOTICE_TITLE")
                    .map(SystemConfig::getConfigValue).orElse("PARAKH System Notice");
            String message = systemConfigService.getConfig("SYSTEM_NOTICE_MESSAGE")
                    .map(SystemConfig::getConfigValue)
                    .orElse("All examination sessions are monitored for integrity. Ensure webcam and fullscreen are active.");
            String priority = systemConfigService.getConfig("SYSTEM_NOTICE_PRIORITY")
                    .map(SystemConfig::getConfigValue).orElse("LOW");

            Map<String, Object> sys = new LinkedHashMap<>();
            sys.put("id", id);
            sys.put("type", "SYSTEM");
            sys.put("priority", priority);
            sys.put("title", title);
            sys.put("message", message);
            sys.put("action", null);
            sys.put("timestamp", java.time.LocalDate.now().toString());
            notifications.add(sys);
        }

        List<String> order = List.of("CRITICAL", "HIGH", "MEDIUM", "LOW");
        notifications.sort(Comparator.comparingInt(n -> order.indexOf(((Map<String, Object>) n).get("priority"))));

        return ResponseEntity.ok(Map.of("notifications", notifications,
                "unreadCount", notifications.size(),
                "generatedAt", java.time.LocalDateTime.now().toString()));
    }

    /** GET /api/student/my/reassessment-status — Cognitive decline enforcement */
    @GetMapping("/my/reassessment-status")
    public ResponseEntity<?> getReassessmentStatus(Authentication authentication) {
        User student = userRepository.findByEmail(authentication.getName()).orElseThrow();
        StudentLearningProfile profile = analyticsService.computeLongitudinalMetrics(student.getId());
        boolean enforcementEnabled = "true".equals(systemConfigService.getConfig("REMEDIAL_MODE_ENFORCED")
                .map(SystemConfig::getConfigValue).orElse("false"));

        boolean declining = profile != null && "DECLINING".equals(profile.getCognitiveTrend());
        boolean blocked = declining && enforcementEnabled;

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("cognitiveTrend", profile != null ? profile.getCognitiveTrend() : "UNKNOWN");
        result.put("foundationRequired", blocked);
        result.put("advancedExamsBlocked", blocked);
        result.put("remedialOnlyMode", blocked);
        result.put("stabilityIndex", profile != null ? profile.getLearningStabilityIndex() : null);
        result.put("retentionScore", profile != null ? profile.getRetentionScore() : null);
        result.put("message", declining
                ? "Cognitive trajectory is DECLINING. Complete Foundation Reassessment before accessing advanced examinations."
                : null);
        return ResponseEntity.ok(result);
    }
}
