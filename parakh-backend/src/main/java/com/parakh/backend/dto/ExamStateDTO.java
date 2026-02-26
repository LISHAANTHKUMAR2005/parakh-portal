package com.parakh.backend.dto;

import com.parakh.backend.model.Question;

public class ExamStateDTO {
    private Long examId;
    private Question nextQuestion;
    private boolean examCompleted;
    private Integer currentScore;
    private Integer totalQuestionsAnswered;

    private String status;
    private Integer durationMinutes;
    private Integer totalQuestions;
    private String currentDifficulty;
    private String currentBloomLevel;
    private String currentTopic;

    private java.util.List<String> difficultyHistory;
    private java.util.List<String> bloomHistory;
    private java.util.List<String> topicHistory;
    private java.util.List<String> integrityEvents;

    public ExamStateDTO(Long examId, Question nextQuestion, boolean examCompleted, Integer currentScore,
            Integer totalQuestionsAnswered, String status, Integer durationMinutes, Integer totalQuestions,
            String currentDifficulty, String currentBloomLevel, String currentTopic,
            java.util.List<String> difficultyHistory, java.util.List<String> bloomHistory,
            java.util.List<String> topicHistory, java.util.List<String> integrityEvents) {
        this.examId = examId;
        this.nextQuestion = nextQuestion;
        this.examCompleted = examCompleted;
        this.currentScore = currentScore;
        this.totalQuestionsAnswered = totalQuestionsAnswered;
        this.status = status;
        this.durationMinutes = durationMinutes;
        this.totalQuestions = totalQuestions;
        this.currentDifficulty = currentDifficulty;
        this.currentBloomLevel = currentBloomLevel;
        this.currentTopic = currentTopic;
        this.difficultyHistory = difficultyHistory;
        this.bloomHistory = bloomHistory;
        this.topicHistory = topicHistory;
        this.integrityEvents = integrityEvents;
    }

    // Getters
    public Long getExamId() {
        return examId;
    }

    public Question getNextQuestion() {
        return nextQuestion;
    }

    public boolean isExamCompleted() {
        return examCompleted;
    }

    public Integer getCurrentScore() {
        return currentScore;
    }

    public Integer getTotalQuestionsAnswered() {
        return totalQuestionsAnswered;
    }

    public String getStatus() {
        return status;
    }

    public Integer getDurationMinutes() {
        return durationMinutes;
    }

    public Integer getTotalQuestions() {
        return totalQuestions;
    }

    public String getCurrentDifficulty() {
        return currentDifficulty;
    }

    public String getCurrentBloomLevel() {
        return currentBloomLevel;
    }

    public String getCurrentTopic() {
        return currentTopic;
    }

    public java.util.List<String> getDifficultyHistory() {
        return difficultyHistory;
    }

    public java.util.List<String> getBloomHistory() {
        return bloomHistory;
    }

    public java.util.List<String> getTopicHistory() {
        return topicHistory;
    }

    public java.util.List<String> getIntegrityEvents() {
        return integrityEvents;
    }
}
