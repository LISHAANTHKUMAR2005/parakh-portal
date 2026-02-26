package com.parakh.backend.service;

import com.parakh.backend.model.Exam;
import com.parakh.backend.repository.ExamRepository;
import com.parakh.backend.model.SystemConfig;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
@org.springframework.transaction.annotation.Transactional
public class IntegrityService {

    private static final Logger logger = LoggerFactory.getLogger(IntegrityService.class);

    @Autowired
    private ExamRepository examRepository;

    @Autowired
    private SystemConfigService systemConfigService;

    @Autowired
    private AuditService auditService;

    private boolean isMonitoringEnabled() {
        return "true".equals(systemConfigService.getConfig("AI_PROCTORING_ENABLED")
                .map(SystemConfig::getConfigValue)
                .orElse("true"));
    }

    public boolean reportEvent(Long examId, String eventType) {
        if (!isMonitoringEnabled())
            return false;

        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new RuntimeException("Exam not found"));

        if (!"IN_PROGRESS".equals(exam.getStatus()))
            return false;

        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        long minutesPassed = java.time.Duration.between(exam.getStartTime(), now).toMinutes();
        String timestampLabel = "T+" + minutesPassed + "m";

        switch (eventType) {
            case "TAB_SWITCH":
                exam.setTabSwitchCount(exam.getTabSwitchCount() + 1);
                exam.setViolationCount(exam.getViolationCount() + 1);
                exam.getIntegrityEvents().add(timestampLabel + ": Browser Tab Switch Detected");
                break;
            case "FULLSCREEN_EXIT":
                exam.setFullscreenExitCount(exam.getFullscreenExitCount() + 1);
                exam.setViolationCount(exam.getViolationCount() + 1);
                exam.getIntegrityEvents().add(timestampLabel + ": Fullscreen Mode Exited");
                break;
            case "COPY_ATTEMPT":
                exam.setCopyAttemptCount(exam.getCopyAttemptCount() + 1);
                exam.setViolationCount(exam.getViolationCount() + 1);
                exam.getIntegrityEvents().add(timestampLabel + ": Restricted Shortcut (Copy/Paste) Attempted");
                break;
            case "WEBCAM_ABSENCE":
                exam.setWebcamAbsenceCount(exam.getWebcamAbsenceCount() + 1);
                exam.setViolationCount(exam.getViolationCount() + 1);
                exam.getIntegrityEvents().add(timestampLabel + ": User Presence Not Detected (AI Proctor)");
                break;
            default:
                logger.warn("Unknown integrity event type: {}", eventType);
        }

        examRepository.save(exam);
        auditService.logAction("INTEGRITY_VIOLATION", "EXAM", examId.toString(),
                "Integrity event " + eventType + " reported. Current violations: " + exam.getViolationCount());
        logger.info("Integrity event {} reported for exam {}", eventType, examId);
        return exam.getViolationCount() >= 3;
    }

    public double computeIntegrityScore(Exam exam) {
        if (!isMonitoringEnabled())
            return 100.0;

        double score = 100.0;

        // Deductions
        score -= (exam.getTabSwitchCount() * 5.0);
        score -= (exam.getFullscreenExitCount() * 10.0);
        score -= (exam.getCopyAttemptCount() * 2.0);
        score -= (exam.getWebcamAbsenceCount() * 1.0);

        // Also consider violationCount (existing field)
        score -= (exam.getViolationCount() * 15.0);

        return Math.max(0.0, score);
    }

    /** Alias used by ExamController for the /report-integrity-event endpoint */
    public boolean recordEvent(Long examId, String eventType) {
        return reportEvent(examId, eventType);
    }

    public boolean isIntegrityMonitoringEnabled() {
        return isMonitoringEnabled();
    }

    public java.util.Map<String, Object> getAggregateIntegrityStats() {
        java.util.List<Exam> exams = examRepository.findAll();

        long totalViolations = exams.stream().mapToLong(e -> e.getViolationCount() != null ? e.getViolationCount() : 0)
                .sum();
        long totalTabSwitches = exams.stream().mapToLong(e -> e.getTabSwitchCount() != null ? e.getTabSwitchCount() : 0)
                .sum();
        long totalFullscreenExits = exams.stream()
                .mapToLong(e -> e.getFullscreenExitCount() != null ? e.getFullscreenExitCount() : 0).sum();

        double avgIntegrityScore = exams.stream()
                .filter(e -> e.getIntegrityScore() != null)
                .mapToDouble(Exam::getIntegrityScore)
                .average().orElse(100.0);

        java.util.List<java.util.Map<String, Object>> flaggedExams = exams.stream()
                .filter(e -> e.getIntegrityScore() != null && e.getIntegrityScore() < 80)
                .sorted(java.util.Comparator.comparing(Exam::getIntegrityScore))
                .limit(10)
                .map(e -> {
                    java.util.Map<String, Object> map = new java.util.HashMap<>();
                    map.put("examId", e.getId());
                    map.put("studentName", e.getUser().getName());
                    map.put("score", e.getIntegrityScore());
                    map.put("violations", e.getViolationCount());
                    return map;
                })
                .collect(java.util.stream.Collectors.toList());

        return java.util.Map.of(
                "avgIntegrityScore", Math.round(avgIntegrityScore * 10.0) / 10.0,
                "totalViolations", totalViolations,
                "totalTabSwitches", totalTabSwitches,
                "totalFullscreenExits", totalFullscreenExits,
                "flaggedExams", flaggedExams);
    }
}
