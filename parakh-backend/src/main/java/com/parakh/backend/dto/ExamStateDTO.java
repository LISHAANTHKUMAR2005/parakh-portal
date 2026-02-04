package com.parakh.backend.dto;

import com.parakh.backend.model.Question;

public class ExamStateDTO {
    private Long examId;
    private Question nextQuestion;
    private boolean examCompleted;
    private Integer currentScore;
    private Integer totalQuestionsAnswered;

    public ExamStateDTO(Long examId, Question nextQuestion, boolean examCompleted, Integer currentScore,
            Integer totalQuestionsAnswered) {
        this.examId = examId;
        this.nextQuestion = nextQuestion;
        this.examCompleted = examCompleted;
        this.currentScore = currentScore;
        this.totalQuestionsAnswered = totalQuestionsAnswered;
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
}
