package com.parakh.backend.controller;

import com.parakh.backend.dto.ExamStateDTO;
import com.parakh.backend.service.ExamService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * ExamController — owns all /api/exam/* routes.
 * Integrity event reporting is handled separately by IntegrityController.
 */
@RestController
@RequestMapping("/api/exam")
@CrossOrigin(origins = { "http://localhost:5173", "http://localhost:5174" })
public class ExamController {

    @Autowired
    private ExamService examService;

    @Autowired
    private com.parakh.backend.service.AuditService auditService;

    /**
     * GET /api/exam/{id} — Fetch current exam state (used by ExamInterface on load)
     */
    @GetMapping("/{id}")
    public ResponseEntity<ExamStateDTO> getExamState(@PathVariable Long id, java.security.Principal principal) {
        return ResponseEntity.ok(examService.getExamState(id, principal.getName()));
    }

    /**
     * POST /api/exam/start
     * Payload: { assessmentId: Long }
     * Resolves student by JWT principal (email).
     */
    @PostMapping("/start")
    public ResponseEntity<ExamStateDTO> startExam(@RequestBody Map<String, Object> payload,
            java.security.Principal principal) {
        ExamStateDTO state = examService.startExamByEmail(principal.getName(),
                Long.valueOf(payload.get("assessmentId").toString()));
        auditService.logAction("EXAM_STARTED", "EXAM", state.getExamId().toString(),
                "Student started examination session");
        return ResponseEntity.ok(state);
    }

    /**
     * POST /api/exam/submit
     * Payload: { examId, questionId, selectedOption, timeTakenSeconds }
     * Returns next ExamStateDTO driving the adaptive engine.
     */
    @PostMapping("/submit")
    public ResponseEntity<ExamStateDTO> submitAnswer(@RequestBody Map<String, Object> payload,
            java.security.Principal principal) {
        Long examId = Long.valueOf(payload.get("examId").toString());
        Long questionId = Long.valueOf(payload.get("questionId").toString());
        String option = payload.get("selectedOption").toString();
        Long timeTaken = payload.containsKey("timeTakenSeconds")
                ? Long.valueOf(payload.get("timeTakenSeconds").toString())
                : 0L;
        return ResponseEntity.ok(examService.submitAnswer(examId, questionId, option, timeTaken, principal.getName()));
    }

    /**
     * POST /api/exam/violation
     * Payload: { examId, details }
     * Increments violation count; can terminate exam at threshold.
     */
    @PostMapping("/violation")
    public ResponseEntity<?> logViolation(@RequestBody Map<String, Object> payload) {
        Long examId = Long.valueOf(payload.get("examId").toString());
        String details = payload.get("details").toString();
        examService.logViolation(examId, details);
        return ResponseEntity.ok(Map.of("status", "logged", "details", details));
    }

    /**
     * POST /api/exam/finish
     * Payload: { examId }
     * Explicitly marks exam as finished.
     */
    @PostMapping("/finish")
    public ResponseEntity<ExamStateDTO> finishExam(@RequestBody Map<String, Object> payload,
            java.security.Principal principal) {
        Long examId = Long.valueOf(payload.get("examId").toString());
        ExamStateDTO state = examService.finishExam(examId, principal.getName());
        auditService.logAction("EXAM_FINISHED", "EXAM", examId.toString(),
                "Student completed examination session");
        return ResponseEntity.ok(state);
    }
}
