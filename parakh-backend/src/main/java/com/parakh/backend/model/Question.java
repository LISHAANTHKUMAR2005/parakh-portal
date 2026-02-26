package com.parakh.backend.model;

import jakarta.persistence.*;

@Entity
@Table(name = "questions", indexes = {
        @Index(name = "idx_q_subject", columnList = "subject"),
        @Index(name = "idx_q_difficulty", columnList = "difficulty"),
        @Index(name = "idx_q_topic", columnList = "topic"),
        @Index(name = "idx_q_bloom", columnList = "bloomLevel"),
        @Index(name = "idx_q_competency", columnList = "competencyCode"),
        @Index(name = "idx_q_inst", columnList = "institutionId")
})
public class Question {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 1000)
    private String content;

    @Column(nullable = false)
    private String optionA;

    @Column(nullable = false)
    private String optionB;

    @Column(nullable = false)
    private String optionC;

    @Column(nullable = false)
    private String optionD;

    @Column(nullable = false)
    private String correctOption; // "A", "B", "C", or "D"

    @Column(nullable = false)
    private String subject; // e.g., "Mathematics", "Science"

    @Column(nullable = false)
    private String difficulty; // "Easy", "Medium", "Hard"

    @Column(nullable = true)
    private String topic; // Specific topic within subject

    @Column(nullable = true)
    private String competencyCode; // e.g., "MATH-ALG-01" (PARAKH competency code)

    @Column(nullable = true)
    private String bloomLevel; // "Remember", "Understand", "Apply", "Analyze"

    @Column(nullable = true)
    private String learningOutcomeTag; // e.g., "Solve linear equations"

    @Column(nullable = false)
    private Integer usageCount = 0; // tracking how often this Q is used

    @Column(nullable = true)
    private Long institutionId;

    public Long getInstitutionId() {
        return institutionId;
    }

    public void setInstitutionId(Long institutionId) {
        this.institutionId = institutionId;
    }

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "teacher_id")
    private User teacher; // Can be null if created by ADMIN

    @Column(nullable = false, updatable = false)
    private java.time.LocalDateTime createdAt;

    public Question() {
    }

    public Question(String content, String optionA, String optionB, String optionC, String optionD,
            String correctOption, String subject, String difficulty) {
        this(content, optionA, optionB, optionC, optionD, correctOption, subject, difficulty, null);
    }

    public Question(String content, String optionA, String optionB, String optionC, String optionD,
            String correctOption, String subject, String difficulty, User teacher) {
        this.content = content;
        this.optionA = optionA;
        this.optionB = optionB;
        this.optionC = optionC;
        this.optionD = optionD;
        this.correctOption = correctOption;
        this.subject = subject;
        this.difficulty = difficulty;
        this.teacher = teacher;
    }

    @PrePersist
    protected void onCreate() {
        createdAt = java.time.LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getOptionA() {
        return optionA;
    }

    public void setOptionA(String optionA) {
        this.optionA = optionA;
    }

    public String getOptionB() {
        return optionB;
    }

    public void setOptionB(String optionB) {
        this.optionB = optionB;
    }

    public String getOptionC() {
        return optionC;
    }

    public void setOptionC(String optionC) {
        this.optionC = optionC;
    }

    public String getOptionD() {
        return optionD;
    }

    public void setOptionD(String optionD) {
        this.optionD = optionD;
    }

    public String getCorrectOption() {
        return correctOption;
    }

    public void setCorrectOption(String correctOption) {
        this.correctOption = correctOption;
    }

    public String getSubject() {
        return subject;
    }

    public void setSubject(String subject) {
        this.subject = subject;
    }

    public String getDifficulty() {
        return difficulty;
    }

    public void setDifficulty(String difficulty) {
        this.difficulty = difficulty;
    }

    public String getTopic() {
        return topic;
    }

    public void setTopic(String topic) {
        this.topic = topic;
    }

    public String getCompetencyCode() {
        return competencyCode;
    }

    public void setCompetencyCode(String competencyCode) {
        this.competencyCode = competencyCode;
    }

    public String getBloomLevel() {
        return bloomLevel;
    }

    public void setBloomLevel(String bloomLevel) {
        this.bloomLevel = bloomLevel;
    }

    public String getLearningOutcomeTag() {
        return learningOutcomeTag;
    }

    public void setLearningOutcomeTag(String learningOutcomeTag) {
        this.learningOutcomeTag = learningOutcomeTag;
    }

    public Integer getUsageCount() {
        return usageCount;
    }

    public void setUsageCount(Integer usageCount) {
        this.usageCount = usageCount;
    }

    public User getTeacher() {
        return teacher;
    }

    public void setTeacher(User teacher) {
        this.teacher = teacher;
    }

    public java.time.LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
