package com.parakh.backend.controller;

import com.parakh.backend.dto.ExamStateDTO;
import com.parakh.backend.service.ExamService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/exam")
@CrossOrigin(origins = { "http://localhost:5173", "http://localhost:5174" })
public class ExamController {

    @Autowired
    private ExamService examService;

    @PostMapping("/start")
    public ResponseEntity<ExamStateDTO> startExam(@RequestBody Map<String, Object> payload) {
        Long userId = Long.valueOf(payload.get("userId").toString());
        String subject = payload.get("subject").toString();
        return ResponseEntity.ok(examService.startExam(userId, subject));
    }

    @PostMapping("/submit")
    public ResponseEntity<ExamStateDTO> submitAnswer(@RequestBody Map<String, Object> payload) {
        Long examId = Long.valueOf(payload.get("examId").toString());
        Long questionId = Long.valueOf(payload.get("questionId").toString());
        String selectedOption = payload.get("selectedOption").toString();

        return ResponseEntity.ok(examService.submitAnswer(examId, questionId, selectedOption));
    }
}
