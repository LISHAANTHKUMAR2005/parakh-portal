package com.parakh.backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Entity
@Table(name = "exams", indexes = {
        @Index(name = "idx_exam_user", columnList = "user_id"),
        @Index(name = "idx_exam_status", columnList = "status"),
        @Index(name = "idx_exam_assessment", columnList = "assessment_id"),
        @Index(name = "idx_exam_integrity", columnList = "integrityScore"),
        @Index(name = "idx_exam_inst", columnList = "institutionId")
})
public class Exam {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne
    @JoinColumn(name = "assessment_id", nullable = false)
    private Assessment assessment;

    @Column(nullable = false)
    private String subject;

    @Column(nullable = false)
    private LocalDateTime startTime;

    private LocalDateTime endTime;

    @Column(nullable = false)
    private String status; // "IN_PROGRESS", "COMPLETED", "TERMINATED"

    @Column(nullable = false)
    private Integer score = 0;

    @Column(nullable = false)
    private String currentDifficulty = "Medium"; // Adaptive state

    @Column(nullable = false)
    private String currentTopic = "General"; // Current adaptive topic focus

    @Column(nullable = false)
    private String currentBloomLevel = "Remember"; // Current Bloom level

    // Topic performance: topic -> [correct, total]
    @ElementCollection
    @CollectionTable(name = "exam_topic_correct", joinColumns = @JoinColumn(name = "exam_id"))
    @MapKeyColumn(name = "topic")
    @Column(name = "correct_count")
    private Map<String, Integer> topicCorrect = new HashMap<>();

    @ElementCollection
    @CollectionTable(name = "exam_topic_total", joinColumns = @JoinColumn(name = "exam_id"))
    @MapKeyColumn(name = "topic")
    @Column(name = "total_count")
    private Map<String, Integer> topicTotal = new HashMap<>();

    // Bloom level performance: bloomLevel -> [correct, total]
    @ElementCollection
    @CollectionTable(name = "exam_bloom_correct", joinColumns = @JoinColumn(name = "exam_id"))
    @MapKeyColumn(name = "bloom_level")
    @Column(name = "correct_count")
    private Map<String, Integer> bloomCorrect = new HashMap<>();

    @ElementCollection
    @CollectionTable(name = "exam_bloom_total", joinColumns = @JoinColumn(name = "exam_id"))
    @MapKeyColumn(name = "bloom_level")
    @Column(name = "total_count")
    private Map<String, Integer> bloomTotal = new HashMap<>();

    // Time tracking: questionId -> seconds taken
    @ElementCollection
    @CollectionTable(name = "exam_time_tracking", joinColumns = @JoinColumn(name = "exam_id"))
    @MapKeyColumn(name = "question_id")
    @Column(name = "time_seconds")
    private Map<Long, Long> questionTimeTracking = new HashMap<>();

    // Average seconds per difficulty level (rolling): difficulty -> avg_seconds
    @ElementCollection
    @CollectionTable(name = "exam_difficulty_time", joinColumns = @JoinColumn(name = "exam_id"))
    @MapKeyColumn(name = "difficulty")
    @Column(name = "avg_seconds")
    private Map<String, Long> difficultyTimeTracking = new HashMap<>();

    // Topic exposure count (to prevent over-repetition): topic -> count served
    @ElementCollection
    @CollectionTable(name = "exam_topic_exposure", joinColumns = @JoinColumn(name = "exam_id"))
    @MapKeyColumn(name = "topic")
    @Column(name = "exposure_count")
    private Map<String, Integer> topicExposureCount = new HashMap<>();

    @ElementCollection
    private java.util.Set<Long> answeredQuestionIds = new java.util.HashSet<>();

    @Column(nullable = false)
    private Integer violationCount = 0;

    @Column(nullable = false)
    private Integer tabSwitchCount = 0;

    @Column(nullable = false)
    private Integer fullscreenExitCount = 0;

    @Column(nullable = false)
    private Integer copyAttemptCount = 0;

    @Column(nullable = false)
    private Integer webcamAbsenceCount = 0;

    @Column(nullable = false)
    private Double integrityScore = 100.0;

    @ElementCollection
    @CollectionTable(name = "exam_difficulty_history", joinColumns = @JoinColumn(name = "exam_id"))
    @Column(name = "difficulty")
    @OrderColumn(name = "history_order")
    private java.util.List<String> difficultyHistory = new java.util.ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "exam_bloom_history", joinColumns = @JoinColumn(name = "exam_id"))
    @Column(name = "bloom_level")
    @OrderColumn(name = "history_order")
    private java.util.List<String> bloomHistory = new java.util.ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "exam_topic_history", joinColumns = @JoinColumn(name = "exam_id"))
    @Column(name = "topic")
    @OrderColumn(name = "history_order")
    private java.util.List<String> topicHistory = new java.util.ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "exam_integrity_events", joinColumns = @JoinColumn(name = "exam_id"))
    @Column(name = "event_detail")
    @OrderColumn(name = "event_order")
    private java.util.List<String> integrityEvents = new java.util.ArrayList<>();

    @Column(nullable = true)
    private Long institutionId;

    public Long getInstitutionId() {
        return institutionId;
    }

    public void setInstitutionId(Long institutionId) {
        this.institutionId = institutionId;
    }

    public Exam() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public Assessment getAssessment() {
        return assessment;
    }

    public void setAssessment(Assessment assessment) {
        this.assessment = assessment;
    }

    public String getSubject() {
        return subject;
    }

    public void setSubject(String subject) {
        this.subject = subject;
    }

    public LocalDateTime getStartTime() {
        return startTime;
    }

    public void setStartTime(LocalDateTime startTime) {
        this.startTime = startTime;
    }

    public LocalDateTime getEndTime() {
        return endTime;
    }

    public void setEndTime(LocalDateTime endTime) {
        this.endTime = endTime;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Integer getScore() {
        return score;
    }

    public void setScore(Integer score) {
        this.score = score;
    }

    public String getCurrentDifficulty() {
        return currentDifficulty;
    }

    public void setCurrentDifficulty(String currentDifficulty) {
        this.currentDifficulty = currentDifficulty;
    }

    public java.util.Set<Long> getAnsweredQuestionIds() {
        return answeredQuestionIds;
    }

    public void setAnsweredQuestionIds(java.util.Set<Long> answeredQuestionIds) {
        this.answeredQuestionIds = answeredQuestionIds;
    }

    public Integer getViolationCount() {
        return violationCount;
    }

    public void setViolationCount(Integer violationCount) {
        this.violationCount = violationCount;
    }

    public String getCurrentTopic() {
        return currentTopic;
    }

    public void setCurrentTopic(String currentTopic) {
        this.currentTopic = currentTopic;
    }

    public String getCurrentBloomLevel() {
        return currentBloomLevel;
    }

    public void setCurrentBloomLevel(String currentBloomLevel) {
        this.currentBloomLevel = currentBloomLevel;
    }

    public Map<String, Integer> getTopicCorrect() {
        return topicCorrect;
    }

    public void setTopicCorrect(Map<String, Integer> topicCorrect) {
        this.topicCorrect = topicCorrect;
    }

    public Map<String, Integer> getTopicTotal() {
        return topicTotal;
    }

    public void setTopicTotal(Map<String, Integer> topicTotal) {
        this.topicTotal = topicTotal;
    }

    public Map<String, Integer> getBloomCorrect() {
        return bloomCorrect;
    }

    public void setBloomCorrect(Map<String, Integer> bloomCorrect) {
        this.bloomCorrect = bloomCorrect;
    }

    public Map<String, Integer> getBloomTotal() {
        return bloomTotal;
    }

    public void setBloomTotal(Map<String, Integer> bloomTotal) {
        this.bloomTotal = bloomTotal;
    }

    public Map<Long, Long> getQuestionTimeTracking() {
        return questionTimeTracking;
    }

    public void setQuestionTimeTracking(Map<Long, Long> questionTimeTracking) {
        this.questionTimeTracking = questionTimeTracking;
    }

    public Map<String, Long> getDifficultyTimeTracking() {
        return difficultyTimeTracking;
    }

    public void setDifficultyTimeTracking(Map<String, Long> difficultyTimeTracking) {
        this.difficultyTimeTracking = difficultyTimeTracking;
    }

    public Map<String, Integer> getTopicExposureCount() {
        return topicExposureCount;
    }

    public void setTopicExposureCount(Map<String, Integer> topicExposureCount) {
        this.topicExposureCount = topicExposureCount;
    }

    public Integer getTabSwitchCount() {
        return tabSwitchCount;
    }

    public void setTabSwitchCount(Integer tabSwitchCount) {
        this.tabSwitchCount = tabSwitchCount;
    }

    public Integer getFullscreenExitCount() {
        return fullscreenExitCount;
    }

    public void setFullscreenExitCount(Integer fullscreenExitCount) {
        this.fullscreenExitCount = fullscreenExitCount;
    }

    public Integer getCopyAttemptCount() {
        return copyAttemptCount;
    }

    public void setCopyAttemptCount(Integer copyAttemptCount) {
        this.copyAttemptCount = copyAttemptCount;
    }

    public Integer getWebcamAbsenceCount() {
        return webcamAbsenceCount;
    }

    public void setWebcamAbsenceCount(Integer webcamAbsenceCount) {
        this.webcamAbsenceCount = webcamAbsenceCount;
    }

    public Double getIntegrityScore() {
        return integrityScore;
    }

    public void setIntegrityScore(Double integrityScore) {
        this.integrityScore = integrityScore;
    }

    public java.util.List<String> getDifficultyHistory() {
        return difficultyHistory;
    }

    public void setDifficultyHistory(java.util.List<String> difficultyHistory) {
        this.difficultyHistory = difficultyHistory;
    }

    public java.util.List<String> getBloomHistory() {
        return bloomHistory;
    }

    public void setBloomHistory(java.util.List<String> bloomHistory) {
        this.bloomHistory = bloomHistory;
    }

    public java.util.List<String> getTopicHistory() {
        return topicHistory;
    }

    public void setTopicHistory(java.util.List<String> topicHistory) {
        this.topicHistory = topicHistory;
    }

    public java.util.List<String> getIntegrityEvents() {
        return integrityEvents;
    }

    public void setIntegrityEvents(java.util.List<String> integrityEvents) {
        this.integrityEvents = integrityEvents;
    }
}
