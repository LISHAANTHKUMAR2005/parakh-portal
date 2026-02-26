package com.parakh.backend.service;

import com.parakh.backend.dto.ExamStateDTO;
import com.parakh.backend.model.*;
import com.parakh.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * ExamService — Multi-Parameter Adaptive Intelligence Engine
 *
 * Decision signals (per answer submission):
 * 1. Accuracy — Is the student correct on this topic?
 * 2. Speed — Fast/slow relative to difficulty baseline
 * 3. Topic Mastery — Rolling accuracy rate per topic
 * 4. Bloom Success — Accuracy rate at the current Bloom level
 *
 * Adaptive rules (applied in priority order):
 * A. Fast + Correct → raise difficulty + advance Bloom
 * B. Slow + Correct → maintain difficulty (consolidation)
 * C. Fast + Wrong → lower difficulty (careless) + drop Bloom
 * D. Slow + Wrong → lower difficulty + drop Bloom + revisit topic
 *
 * Question selection uses a priority-weighted scoring model:
 * score = topicWeight(40%) + bloomWeight(30%) + difficultyMatch(30%)
 *
 * Topic exposure is capped at MAX_TOPIC_EXPOSURE to ensure variety.
 */
@Service
@org.springframework.transaction.annotation.Transactional
public class ExamService {

    // ── Injection ────────────────────────────────────────────────────────────
    @Autowired
    private ExamRepository examRepository;
    @Autowired
    private QuestionRepository questionRepository;
    @Autowired
    private StudentResponseRepository studentResponseRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private com.parakh.backend.repository.ClassroomRepository classroomRepository;

    @Autowired
    private AssessmentRepository assessmentRepository;
    @Autowired
    private ProgressCardRepository progressCardRepository;
    @Autowired
    private IntegrityService integrityService;
    @Autowired
    private LearningPathService learningPathService;

    // ── Constants ────────────────────────────────────────────────────────────
    private static final List<String> BLOOM_LEVELS = Arrays.asList("Remember", "Understand", "Apply", "Analyze");
    private static final List<String> DIFFICULTIES = Arrays.asList("Easy", "Medium", "Hard");

    /** Baseline seconds per difficulty — used for speed classification */
    private static final Map<String, Long> SPEED_BASELINE = Map.of(
            "Easy", 25L,
            "Medium", 45L,
            "Hard", 75L);
    /** Accuracy threshold to consider a topic "mastered" */
    private static final double MASTERY_THRESHOLD = 0.75;
    /** Accuracy threshold to consider a topic "weak" */
    private static final double WEAK_THRESHOLD = 0.40;
    /** Maximum questions served per topic before rotating to another */
    private static final int MAX_TOPIC_EXPOSURE = 3;
    /** Minimum answers needed on a topic before judging it */
    private static final int MIN_TOPIC_SAMPLE = 2;

    // ── Public API ───────────────────────────────────────────────────────────

    public ExamStateDTO getExamState(Long examId, String email) {
        Exam exam = getAndValidateExam(examId, email);
        return getNextQuestionState(exam);
    }

    private Exam getAndValidateExam(Long examId, String email) {
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new RuntimeException("Exam not found"));
        if (!exam.getUser().getEmail().equals(email)) {
            throw new RuntimeException("Access denied: You do not own this exam session.");
        }
        return exam;
    }

    public ExamStateDTO startExamByEmail(String email, Long assessmentId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return startExam(user.getId(), assessmentId);
    }

    public ExamStateDTO startExam(Long userId, Long assessmentId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Assessment assessment = assessmentRepository.findById(assessmentId)
                .orElseThrow(() -> new RuntimeException("Assessment not found"));

        // 1. Enrollment Validation
        boolean enrolled = classroomRepository.findByStudentsId(userId).stream()
                .anyMatch(c -> c.getId().equals(assessment.getClassroom().getId()));
        if (!enrolled) {
            throw new RuntimeException("Student is not enrolled in the classroom for this assessment.");
        }

        // 2. Availability Window
        LocalDateTime now = LocalDateTime.now();
        if (assessment.getAvailableFrom() != null && now.isBefore(assessment.getAvailableFrom())) {
            throw new RuntimeException("Assessment is not yet available.");
        }
        if (assessment.getAvailableUntil() != null && now.isAfter(assessment.getAvailableUntil())) {
            throw new RuntimeException("Assessment availability has ended.");
        }

        // 3. Attempt Tracking & Limit
        List<Exam> attempts = examRepository.findAllByUserIdAndAssessmentId(userId, assessmentId);

        // Check if there's an in-progress attempt to resume
        Optional<Exam> inProgress = attempts.stream()
                .filter(e -> "IN_PROGRESS".equals(e.getStatus()))
                .findFirst();
        if (inProgress.isPresent()) {
            return getNextQuestionState(inProgress.get());
        }

        long completedCount = attempts.stream()
                .filter(e -> "COMPLETED".equals(e.getStatus()) || "TERMINATED".equals(e.getStatus()))
                .count();

        if (completedCount >= assessment.getMaxAttempts()) {
            throw new RuntimeException("Maximum attempts reached (" + assessment.getMaxAttempts() + ")");
        }

        // Create new exam
        Exam exam = new Exam();
        exam.setUser(user);
        exam.setAssessment(assessment);
        exam.setSubject(assessment.getSubject());
        exam.setStartTime(LocalDateTime.now());
        exam.setStatus("IN_PROGRESS");
        exam.setCurrentDifficulty("Medium");
        exam.setCurrentTopic("General");
        exam.setCurrentBloomLevel("Remember");
        exam.setViolationCount(0);

        // Initial history
        exam.getDifficultyHistory().add(exam.getCurrentDifficulty());
        exam.getBloomHistory().add(exam.getCurrentBloomLevel());
        exam.getTopicHistory().add(exam.getCurrentTopic());

        examRepository.save(exam);

        return getNextQuestionState(exam);
    }

    /**
     * Main answer submission — entry point for adaptive adjustments.
     * Records the response, updates all tracking maps, runs
     * multi-parameter intelligence, then returns the next question.
     * Cache eviction here (public method) ensures Spring AOP fires correctly;
     * evicting on a private helper like completeExam() would be silently ignored.
     */
    @Caching(evict = {
            @CacheEvict(value = "studentReports", allEntries = true),
            @CacheEvict(value = "classSummaries", allEntries = true),
            @CacheEvict(value = "adminAnalytics", allEntries = true),
            @CacheEvict(value = "institutionalBenchmarks", allEntries = true),
            @CacheEvict(value = "learningPaths", allEntries = true)
    })
    public ExamStateDTO submitAnswer(Long examId, Long questionId,
            String selectedOption, Long timeTakenSeconds, String email) {
        Exam exam = getAndValidateExam(examId, email);

        if (!"IN_PROGRESS".equals(exam.getStatus())) {
            return new ExamStateDTO(exam.getId(), null, true, exam.getScore(),
                    exam.getAnsweredQuestionIds().size(), exam.getStatus(),
                    exam.getAssessment() != null ? exam.getAssessment().getDurationMinutes() : 0,
                    exam.getAssessment() != null ? exam.getAssessment().getQuestionCount() : 20,
                    exam.getCurrentDifficulty(), exam.getCurrentBloomLevel(), exam.getCurrentTopic(),
                    exam.getDifficultyHistory(), exam.getBloomHistory(), exam.getTopicHistory(),
                    exam.getIntegrityEvents());
        }

        // ── 0. Check for Timeout ──────────────────────────────────────────
        if (exam.getAssessment() != null && exam.getAssessment().getDurationMinutes() > 0) {
            java.time.LocalDateTime now = java.time.LocalDateTime.now();
            long minutesPassed = java.time.Duration.between(exam.getStartTime(), now).toMinutes();
            if (minutesPassed >= exam.getAssessment().getDurationMinutes()) {
                System.out.println("[ADAPTIVE] Exam session timed out. Auto-finishing.");
                return completeExam(exam);
            }
        }

        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new RuntimeException("Question not found"));

        long timeMs = timeTakenSeconds != null ? timeTakenSeconds : 0L;
        boolean isCorrect = question.getCorrectOption().equalsIgnoreCase(selectedOption);

        // ── 1. Persist student response ────────────────────────────────────
        StudentResponse response = new StudentResponse();
        response.setExam(exam);
        response.setQuestion(question);
        response.setSelectedOption(selectedOption);
        response.setIsCorrect(isCorrect);
        response.setTimeTakenSeconds(timeMs);
        studentResponseRepository.save(response);

        // ── 2. Update score and answered set ──────────────────────────────
        if (isCorrect)
            exam.setScore(exam.getScore() + 1);
        exam.getAnsweredQuestionIds().add(questionId);

        // ── 3. Update all tracking maps ───────────────────────────────────
        String topic = question.getTopic() != null ? question.getTopic() : "General";
        String bloom = question.getBloomLevel() != null ? question.getBloomLevel() : "Remember";
        String diff = question.getDifficulty();

        // Topic accuracy tracking
        exam.getTopicTotal().merge(topic, 1, Integer::sum);
        if (isCorrect)
            exam.getTopicCorrect().merge(topic, 1, Integer::sum);

        // Bloom accuracy tracking
        exam.getBloomTotal().merge(bloom, 1, Integer::sum);
        if (isCorrect)
            exam.getBloomCorrect().merge(bloom, 1, Integer::sum);

        // Per-question time tracking
        exam.getQuestionTimeTracking().put(questionId, timeMs);

        // Rolling average seconds per difficulty
        updateDifficultyTimeTracking(exam, diff, timeMs);

        // ── 4. Run multi-parameter adaptive engine ────────────────────────
        AdaptiveDecision decision = computeAdaptiveDecision(exam, question, isCorrect, timeMs);
        applyDecision(exam, decision, topic, bloom);

        // Log history of transitions
        exam.getDifficultyHistory().add(exam.getCurrentDifficulty());
        exam.getBloomHistory().add(exam.getCurrentBloomLevel());
        exam.getTopicHistory().add(exam.getCurrentTopic());

        // ── 4. Save and return next state ──────────────────────────────────
        // Debug log (goes to Spring Boot console — visible during development)
        logAdaptiveDecision(exam, question, isCorrect, timeMs, decision);

        examRepository.save(exam);
        return getNextQuestionState(exam);
    }

    public void logViolation(Long examId, String details) {
        Exam exam = examRepository.findById(examId).orElseThrow();
        if ("IN_PROGRESS".equals(exam.getStatus())) {
            exam.setViolationCount(exam.getViolationCount() + 1);
            if (exam.getViolationCount() >= 3) {
                exam.setStatus("TERMINATED");
                exam.setEndTime(LocalDateTime.now());
                exam.setIntegrityScore(integrityService.computeIntegrityScore(exam));
                generateProgressCard(exam);
            }
            examRepository.save(exam);
        }
    }

    @org.springframework.cache.annotation.CacheEvict(value = { "studentIntelligence", "classAnalytics",
            "studentTranscripts" }, allEntries = true)
    public ExamStateDTO finishExam(Long examId, String email) {
        Exam exam = getAndValidateExam(examId, email);
        if (!"COMPLETED".equals(exam.getStatus()) && !"TERMINATED".equals(exam.getStatus())) {
            return completeExam(exam);
        }
        return new ExamStateDTO(exam.getId(), null, true, exam.getScore(),
                exam.getAnsweredQuestionIds().size(), exam.getStatus(),
                exam.getAssessment() != null ? exam.getAssessment().getDurationMinutes() : 0,
                exam.getAssessment() != null ? exam.getAssessment().getQuestionCount() : 20,
                exam.getCurrentDifficulty(), exam.getCurrentBloomLevel(), exam.getCurrentTopic(),
                exam.getDifficultyHistory(), exam.getBloomHistory(), exam.getTopicHistory(), exam.getIntegrityEvents());
    }

    public void forceTerminate(Long examId, String reason) {
        Exam exam = examRepository.findById(examId).orElseThrow();
        if ("IN_PROGRESS".equals(exam.getStatus())) {
            exam.setStatus("TERMINATED");
            exam.setEndTime(LocalDateTime.now());
            exam.setIntegrityScore(integrityService.computeIntegrityScore(exam));
            generateProgressCard(exam);
            examRepository.save(exam);
            System.out.println("[ADAPTIVE] Exam " + examId + " terminated. Reason: " + reason);
        }
    }

    // =========================================================================
    // MULTI-PARAMETER ADAPTIVE ENGINE
    // =========================================================================

    /**
     * Classifies this answer into one of four adaptive states.
     * Returns an AdaptiveDecision record capturing all four signals.
     */
    private AdaptiveDecision computeAdaptiveDecision(Exam exam, Question question,
            boolean isCorrect, long timeTaken) {
        String diff = question.getDifficulty();
        String topic = question.getTopic() != null ? question.getTopic() : "General";
        String bloom = question.getBloomLevel() != null ? question.getBloomLevel() : "Remember";

        // ── Signal 1: Speed (relative to difficulty baseline) ─────────────
        long baseline = getDifficultyBaseline(exam, diff);
        boolean isFast = timeTaken > 0 && timeTaken <= baseline;
        boolean isSlow = timeTaken > baseline;

        // ── Signal 2: Topic Mastery ────────────────────────────────────────
        int topicTotal = exam.getTopicTotal().getOrDefault(topic, 0);
        int topicCorrect = exam.getTopicCorrect().getOrDefault(topic, 0);
        double topicAccuracy = topicTotal >= MIN_TOPIC_SAMPLE
                ? (double) topicCorrect / topicTotal
                : 0.5; // neutral before enough data

        boolean topicStrong = topicAccuracy >= MASTERY_THRESHOLD;
        boolean topicWeak = topicAccuracy <= WEAK_THRESHOLD && topicTotal >= MIN_TOPIC_SAMPLE;

        // ── Signal 3: Bloom Success Rate ──────────────────────────────────
        int bloomTotal = exam.getBloomTotal().getOrDefault(bloom, 0);
        int bloomCorrect = exam.getBloomCorrect().getOrDefault(bloom, 0);
        double bloomAccuracy = bloomTotal >= 2
                ? (double) bloomCorrect / bloomTotal
                : 0.5;
        boolean bloomStrong = bloomAccuracy >= MASTERY_THRESHOLD;

        return new AdaptiveDecision(isCorrect, isFast, isSlow,
                topicStrong, topicWeak, bloomStrong, topicAccuracy, bloomAccuracy);
    }

    /**
     * Applies the decision to update currentDifficulty, currentBloomLevel,
     * currentTopic, and topicExposureCount.
     *
     * Priority rules (evaluated top-to-bottom, first match wins):
     * Rule A: Fast + Correct + TopicStrong → raise diff + advance Bloom
     * Rule B: Fast + Correct (not strong) → raise diff only
     * Rule C: Slow + Correct → maintain diff (consolidation)
     * Rule D: Correct + TopicStrong alone → advance Bloom only
     * Rule E: Fast + Wrong → lower diff (careless) + drop Bloom
     * Rule F: Slow + Wrong + TopicWeak → lower diff + drop Bloom + switch topic
     * Rule G: Wrong (else) → lower diff
     */
    private void applyDecision(Exam exam, AdaptiveDecision d, String topic, String bloom) {
        if (d.isCorrect()) {
            if (d.isFast() && d.isTopicStrong()) {
                // Rule A — Fast + Correct + Strong → full advance
                raiseDifficulty(exam);
                advanceBloom(exam);
            } else if (d.isFast()) {
                // Rule B — Fast + Correct → raise difficulty
                raiseDifficulty(exam);
            } else if (d.isSlow()) {
                // Rule C — Slow + Correct → consolidate (no change)
                // Topic exposure still increments; no difficulty or bloom change
            } else if (d.isTopicStrong()) {
                // Rule D — Correct + Strong (moderate speed) → advance Bloom
                advanceBloom(exam);
            }
            // Otherwise (correct, medium speed, not yet mastered) → no change
        } else {
            if (d.isFast()) {
                // Rule E — Fast + Wrong → careless; lower difficulty + drop Bloom
                lowerDifficulty(exam);
                dropBloom(exam);
            } else if (d.isTopicWeak()) {
                // Rule F — Slow + Wrong + Weak → needs remediation; lower + revisit
                lowerDifficulty(exam);
                dropBloom(exam);
                selectWeakestTopic(exam); // force focus on worst topic
            } else {
                // Rule G — Wrong (general) → lower difficulty
                lowerDifficulty(exam);
            }
        }

        // ── Topic rotation control ─────────────────────────────────────────
        // Increment exposure for the topic just answered
        exam.getTopicExposureCount().merge(topic, 1, Integer::sum);

        // If this topic is over-exposed and student is strong → rotate away
        int exposure = exam.getTopicExposureCount().getOrDefault(topic, 0);
        if (exposure >= MAX_TOPIC_EXPOSURE && d.isTopicStrong()) {
            selectNextBestTopic(exam);
        } else if (!d.isTopicWeak()) {
            // Stay on topic if still developing, otherwise let selectWeakestTopic handle it
            // If no weak topic was set above and topic is neutral, prefer weakest available
            if (!"General".equals(exam.getCurrentTopic())) {
                // Keep on the explicitly set topic; don't override
            } else {
                String weakest = findWeakestTopic(exam);
                if (weakest != null)
                    exam.setCurrentTopic(weakest);
            }
        }
    }

    // ── Difficulty helpers ────────────────────────────────────────────────────

    private void raiseDifficulty(Exam exam) {
        int idx = DIFFICULTIES.indexOf(exam.getCurrentDifficulty());
        if (idx < DIFFICULTIES.size() - 1)
            exam.setCurrentDifficulty(DIFFICULTIES.get(idx + 1));
    }

    private void lowerDifficulty(Exam exam) {
        int idx = DIFFICULTIES.indexOf(exam.getCurrentDifficulty());
        if (idx > 0)
            exam.setCurrentDifficulty(DIFFICULTIES.get(idx - 1));
    }

    // ── Bloom helpers ─────────────────────────────────────────────────────────

    private void advanceBloom(Exam exam) {
        int idx = BLOOM_LEVELS.indexOf(exam.getCurrentBloomLevel());
        if (idx < BLOOM_LEVELS.size() - 1)
            exam.setCurrentBloomLevel(BLOOM_LEVELS.get(idx + 1));
    }

    private void dropBloom(Exam exam) {
        int idx = BLOOM_LEVELS.indexOf(exam.getCurrentBloomLevel());
        if (idx > 0)
            exam.setCurrentBloomLevel(BLOOM_LEVELS.get(idx - 1));
    }

    // ── Topic helpers ─────────────────────────────────────────────────────────

    /** Select the topic with the lowest accuracy (min 2 attempts) */
    private String findWeakestTopic(Exam exam) {
        return exam.getTopicTotal().entrySet().stream()
                .filter(e -> e.getValue() >= MIN_TOPIC_SAMPLE)
                .min(Comparator.comparingDouble(e -> {
                    int c = exam.getTopicCorrect().getOrDefault(e.getKey(), 0);
                    return (double) c / e.getValue();
                }))
                .map(Map.Entry::getKey)
                .orElse(null);
    }

    /** Force-focus the weakest topic that is not over-exposed */
    private void selectWeakestTopic(Exam exam) {
        exam.getTopicTotal().entrySet().stream()
                .filter(e -> e.getValue() >= MIN_TOPIC_SAMPLE)
                .filter(e -> exam.getTopicExposureCount().getOrDefault(e.getKey(), 0) < MAX_TOPIC_EXPOSURE)
                .min(Comparator.comparingDouble(e -> {
                    int c = exam.getTopicCorrect().getOrDefault(e.getKey(), 0);
                    return (double) c / e.getValue();
                }))
                .map(Map.Entry::getKey)
                .ifPresent(exam::setCurrentTopic);
    }

    /**
     * Select the topic that is: (a) not over-exposed, and (b) not already mastered.
     * Falls back to "General" if all topics are either mastered or over-exposed.
     */
    private void selectNextBestTopic(Exam exam) {
        Optional<String> next = exam.getTopicTotal().entrySet().stream()
                .filter(e -> exam.getTopicExposureCount().getOrDefault(e.getKey(), 0) < MAX_TOPIC_EXPOSURE)
                .filter(e -> {
                    int c = exam.getTopicCorrect().getOrDefault(e.getKey(), 0);
                    double acc = e.getValue() > 0 ? (double) c / e.getValue() : 0;
                    return acc < MASTERY_THRESHOLD; // only pick un-mastered topics
                })
                .min(Comparator.comparingDouble(e -> {
                    int c = exam.getTopicCorrect().getOrDefault(e.getKey(), 0);
                    return (double) c / e.getValue();
                }))
                .map(Map.Entry::getKey);
        exam.setCurrentTopic(next.orElse("General"));
    }

    // ── Speed helpers ─────────────────────────────────────────────────────────

    /**
     * Returns the effective baseline for a difficulty level.
     * If we have recorded avg time for this difficulty, use it;
     * otherwise fall back to the static constant.
     */
    private long getDifficultyBaseline(Exam exam, String difficulty) {
        Long recorded = exam.getDifficultyTimeTracking().get(difficulty);
        return recorded != null && recorded > 0
                ? (long) (recorded * 1.2) // 20% above rolling avg = "slow"
                : SPEED_BASELINE.getOrDefault(difficulty, 45L);
    }

    /**
     * Updates the rolling average time for the given difficulty.
     * Uses simple cumulative average: newAvg = (oldAvg * (n-1) + newVal) / n
     */
    private void updateDifficultyTimeTracking(Exam exam, String difficulty, long timeTakenSeconds) {
        if (timeTakenSeconds <= 0)
            return;
        Map<String, Long> tracking = exam.getDifficultyTimeTracking();

        // Count how many questions have recorded time (used for rolling average)
        long count = exam.getQuestionTimeTracking().values().stream()
                .filter(t -> t > 0).count();
        long oldAvg = tracking.getOrDefault(difficulty, timeTakenSeconds);
        long newAvg = count > 1
                ? (oldAvg * (count - 1) + timeTakenSeconds) / count
                : timeTakenSeconds;
        tracking.put(difficulty, newAvg);
    }

    // ── Debug logging ─────────────────────────────────────────────────────────

    private void logAdaptiveDecision(Exam exam, Question q, boolean correct,
            long timeTaken, AdaptiveDecision d) {
        // Determine which rule fired for clarity
        String ruleFired;
        if (correct) {
            if (d.isFast() && d.isTopicStrong())
                ruleFired = "Rule-A (Fast+Correct+Strong → ↑Diff ↑Bloom)";
            else if (d.isFast())
                ruleFired = "Rule-B (Fast+Correct → ↑Diff)";
            else if (d.isSlow())
                ruleFired = "Rule-C (Slow+Correct → Consolidate)";
            else if (d.isTopicStrong())
                ruleFired = "Rule-D (Correct+Strong → ↑Bloom)";
            else
                ruleFired = "Rule-0 (Correct, no change)";
        } else {
            if (d.isFast())
                ruleFired = "Rule-E (Fast+Wrong → ↓Diff ↓Bloom)";
            else if (d.isTopicWeak())
                ruleFired = "Rule-F (Slow+Wrong+Weak → ↓Diff ↓Bloom +TopicSwitch)";
            else
                ruleFired = "Rule-G (Wrong → ↓Diff)";
        }
        System.out.printf(
                "[ADAPTIVE] ExamId=%d | Q#%d (topic=%s diff=%s bloom=%s) | %s | time=%ds | " +
                        "topicAcc=%.0f%% | bloomAcc=%.0f%% | speed=%s | %s | " +
                        "→ nextDiff=%-6s nextBloom=%-10s nextTopic=%s%n",
                exam.getId(), q.getId(),
                q.getTopic(), q.getDifficulty(), q.getBloomLevel(),
                correct ? "✅ CORRECT" : "❌ WRONG",
                timeTaken,
                d.topicAccuracy() * 100,
                d.bloomAccuracy() * 100,
                d.isFast() ? "FAST" : d.isSlow() ? "SLOW" : "NORM",
                ruleFired,
                exam.getCurrentDifficulty(),
                exam.getCurrentBloomLevel(),
                exam.getCurrentTopic());
    }

    // =========================================================================
    // QUESTION SELECTION ENGINE — Weighted Candidate Scoring
    // =========================================================================

    /**
     * Selects the next question using a priority/scoring model.
     *
     * Candidate scoring (higher = more preferred):
     * +40 if topic matches currentTopic
     * +30 if bloom matches currentBloomLevel (or close ±1)
     * +30 if difficulty matches currentDifficulty
     * −10 if topic is over-exposed (>= MAX_TOPIC_EXPOSURE)
     *
     * The top-scored candidate is returned (with random tie-breaking).
     * Falls back through 4 levels if no candidates found.
     */
    private ExamStateDTO getNextQuestionState(Exam exam) {
        if (!"IN_PROGRESS".equals(exam.getStatus())) {
            return new ExamStateDTO(exam.getId(), null, true, exam.getScore(),
                    exam.getAnsweredQuestionIds().size(), exam.getStatus(),
                    exam.getAssessment() != null ? exam.getAssessment().getDurationMinutes() : 0,
                    exam.getAssessment() != null ? exam.getAssessment().getQuestionCount() : 20,
                    exam.getCurrentDifficulty(), exam.getCurrentBloomLevel(), exam.getCurrentTopic(),
                    exam.getDifficultyHistory(), exam.getBloomHistory(), exam.getTopicHistory(),
                    exam.getIntegrityEvents());
        }

        int maxQuestions = exam.getAssessment() != null
                ? exam.getAssessment().getQuestionCount()
                : 10;
        if (exam.getAnsweredQuestionIds().size() >= maxQuestions) {
            return completeExam(exam);
        }

        // Fetch all unanswered questions for this subject
        List<Question> pool = questionRepository.findBySubject(exam.getSubject())
                .stream()
                .filter(q -> !exam.getAnsweredQuestionIds().contains(q.getId()))
                .collect(Collectors.toList());

        if (pool.isEmpty())
            return completeExam(exam);

        // Score each candidate
        Question next = selectBestCandidate(exam, pool);

        // Safety-mask the correct answer before sending to frontend
        return new ExamStateDTO(exam.getId(), maskAnswer(next), false,
                exam.getScore(), exam.getAnsweredQuestionIds().size(), exam.getStatus(),
                exam.getAssessment() != null ? exam.getAssessment().getDurationMinutes() : 0,
                exam.getAssessment() != null ? exam.getAssessment().getQuestionCount() : 20,
                exam.getCurrentDifficulty(), exam.getCurrentBloomLevel(), exam.getCurrentTopic(),
                exam.getDifficultyHistory(), exam.getBloomHistory(), exam.getTopicHistory(), exam.getIntegrityEvents());
    }

    /**
     * Scores every candidate in the pool and returns the best match.
     * Random choice among candidates within 5 points of the top score.
     */
    private Question selectBestCandidate(Exam exam, List<Question> pool) {
        String targetTopic = exam.getCurrentTopic();
        String targetBloom = exam.getCurrentBloomLevel();
        String targetDiff = exam.getCurrentDifficulty();
        int bloomIdx = BLOOM_LEVELS.indexOf(targetBloom);

        // Score and sort
        List<ScoredQuestion> scored = pool.stream().map(q -> {
            int score = 0;

            // ── Difficulty match (30 pts) ──────────────────────────────
            if (targetDiff.equals(q.getDifficulty()))
                score += 30;
            else {
                int diffIdx = DIFFICULTIES.indexOf(q.getDifficulty());
                int tIdx = DIFFICULTIES.indexOf(targetDiff);
                if (Math.abs(diffIdx - tIdx) == 1)
                    score += 10; // adjacent difficulty
            }

            // ── Topic weight (40 pts) ───────────────────────────────────
            String qTopic = q.getTopic() != null ? q.getTopic() : "General";
            if (!"General".equals(targetTopic) && targetTopic.equals(qTopic)) {
                score += 40;
            } else if ("General".equals(targetTopic)) {
                score += 10; // neutral
            }
            // Penalise over-exposed topics
            int exposure = exam.getTopicExposureCount().getOrDefault(qTopic, 0);
            if (exposure >= MAX_TOPIC_EXPOSURE)
                score -= 20;

            // ── Bloom match (30 pts) ────────────────────────────────────
            String qBloom = q.getBloomLevel() != null ? q.getBloomLevel() : "Remember";
            int qBloomIdx = BLOOM_LEVELS.indexOf(qBloom);
            int bloomDist = Math.abs(bloomIdx - qBloomIdx);
            if (bloomDist == 0)
                score += 30;
            else if (bloomDist == 1)
                score += 15;
            // else 0 pts for distant bloom

            return new ScoredQuestion(q, score);
        }).sorted(Comparator.comparingInt(ScoredQuestion::score).reversed())
                .collect(Collectors.toList());

        // Pick randomly from top-tier (within 5 pts of max score)
        int maxScore = scored.get(0).score();
        List<Question> topTier = scored.stream()
                .filter(sq -> sq.score() >= maxScore - 5)
                .map(ScoredQuestion::question)
                .collect(Collectors.toList());

        return topTier.get(new Random().nextInt(topTier.size()));
    }

    /** Marks exam COMPLETED, saves, and generates the progress card. */
    private ExamStateDTO completeExam(Exam exam) {
        exam.setStatus("COMPLETED");
        exam.setEndTime(LocalDateTime.now());
        exam.setIntegrityScore(integrityService.computeIntegrityScore(exam));
        examRepository.save(exam);
        generateProgressCard(exam);

        // Trigger learning path regeneration
        try {
            learningPathService.generateLearningPath(exam.getUser().getId());
        } catch (Exception e) {
            System.err.println("Failed to regenerate learning path: " + e.getMessage());
        }

        System.out.printf("[ADAPTIVE] ExamId=%d COMPLETED | Score=%d/%d | FinalDiff=%s | FinalBloom=%s%n",
                exam.getId(), exam.getScore(), exam.getAnsweredQuestionIds().size(),
                exam.getCurrentDifficulty(), exam.getCurrentBloomLevel());
        return new ExamStateDTO(exam.getId(), null, true, exam.getScore(),
                exam.getAnsweredQuestionIds().size(), exam.getStatus(),
                exam.getAssessment() != null ? exam.getAssessment().getDurationMinutes() : 0,
                exam.getAssessment() != null ? exam.getAssessment().getQuestionCount() : 20,
                exam.getCurrentDifficulty(), exam.getCurrentBloomLevel(), exam.getCurrentTopic(),
                exam.getDifficultyHistory(), exam.getBloomHistory(), exam.getTopicHistory(), exam.getIntegrityEvents());
    }

    /** Returns a copy of the question with the correct answer removed */
    private Question maskAnswer(Question src) {
        Question safe = new Question();
        safe.setId(src.getId());
        safe.setContent(src.getContent());
        safe.setOptionA(src.getOptionA());
        safe.setOptionB(src.getOptionB());
        safe.setOptionC(src.getOptionC());
        safe.setOptionD(src.getOptionD());
        safe.setSubject(src.getSubject());
        safe.setDifficulty(src.getDifficulty());
        safe.setTopic(src.getTopic());
        safe.setBloomLevel(src.getBloomLevel());
        safe.setCompetencyCode(src.getCompetencyCode());
        safe.setLearningOutcomeTag(src.getLearningOutcomeTag());
        // correctOption intentionally NOT set
        return safe;
    }

    // =========================================================================
    // PROGRESS CARD GENERATION
    // =========================================================================

    public void generateProgressCard(Exam exam) {
        if (progressCardRepository.findByExamId(exam.getId()).isPresent())
            return;
        int totalQ = exam.getAnsweredQuestionIds().size();
        if (totalQ == 0)
            return;

        int maxQ = exam.getAssessment() != null
                ? exam.getAssessment().getQuestionCount()
                : totalQ;
        double academicScore = maxQ > 0 ? ((double) exam.getScore() / maxQ) * 100 : 0;
        double competencyIndex = computeCompetencyIndex(exam);
        double growthScore = computeGrowthScore(exam);
        double confidenceScore = computeConfidenceScore(exam);
        double consistency = computeConsistency(exam);
        double riskScore = computeRiskScore(academicScore, growthScore, consistency);
        String riskIndicator = riskScore >= 60 ? "HIGH" : riskScore >= 35 ? "MEDIUM" : "LOW";

        String topicJson = buildTopicMasteryJson(exam);
        String bloomJson = buildBloomDistributionJson(exam);
        String explanation = generateExplanation(riskIndicator, academicScore,
                competencyIndex, topicJson, bloomJson);

        ProgressCard card = new ProgressCard();
        card.setExam(exam);
        card.setStudent(exam.getUser());
        card.setAcademicScore(round(academicScore));
        card.setCompetencyIndex(round(competencyIndex));
        card.setGrowthScore(round(growthScore));
        card.setConfidenceScore(round(confidenceScore));
        card.setRiskScore(round(riskScore));
        card.setLearningConsistency(round(consistency));
        card.setRiskIndicator(riskIndicator);
        card.setAiExplanation(explanation);
        card.setTopicMasteryJson(topicJson);
        card.setBloomDistributionJson(bloomJson);
        progressCardRepository.save(card);
    }

    // ── Progress Card helpers ─────────────────────────────────────────────────

    private double computeCompetencyIndex(Exam exam) {
        Map<String, Integer> weights = Map.of(
                "Remember", 1, "Understand", 2, "Apply", 3, "Analyze", 4);
        double wCorrect = 0, wTotal = 0;
        for (Map.Entry<String, Integer> e : exam.getBloomTotal().entrySet()) {
            int w = weights.getOrDefault(e.getKey(), 1);
            wCorrect += exam.getBloomCorrect().getOrDefault(e.getKey(), 0) * w;
            wTotal += e.getValue() * w;
        }
        return wTotal > 0 ? (wCorrect / wTotal) * 100 : 0;
    }

    private double computeGrowthScore(Exam exam) {
        List<ProgressCard> history = progressCardRepository
                .findByStudentIdOrderByGeneratedAtDesc(exam.getUser().getId());
        if (history.isEmpty())
            return 50.0;
        double prev = history.get(0).getAcademicScore();
        int maxQ = exam.getAssessment() != null
                ? exam.getAssessment().getQuestionCount()
                : exam.getAnsweredQuestionIds().size();
        double current = maxQ > 0 ? ((double) exam.getScore() / maxQ) * 100 : 0;
        return Math.max(0, Math.min(100, 50 + (current - prev) * 0.5));
    }

    private double computeConfidenceScore(Exam exam) {
        List<StudentResponse> responses = studentResponseRepository.findByExamId(exam.getId());
        long hardTotal = responses.stream()
                .filter(r -> "Hard".equals(r.getQuestion().getDifficulty())).count();
        long hardCorrect = responses.stream()
                .filter(r -> "Hard".equals(r.getQuestion().getDifficulty())
                        && Boolean.TRUE.equals(r.getIsCorrect()))
                .count();
        return hardTotal > 0 ? ((double) hardCorrect / hardTotal) * 100 : 50.0;
    }

    private double computeConsistency(Exam exam) {
        List<StudentResponse> responses = studentResponseRepository.findByExamId(exam.getId());
        if (responses.size() < 3)
            return 50.0;
        int streaks = 0, correct = 0;
        for (StudentResponse r : responses) {
            if (Boolean.TRUE.equals(r.getIsCorrect())) {
                correct++;
                streaks++;
            } else if (correct > 0) {
                streaks--;
            }
        }
        return Math.max(0, Math.min(100, 50 + streaks * 10));
    }

    private double computeRiskScore(double acad, double growth, double consistency) {
        return Math.max(0, Math.min(100,
                100 - (acad * 0.5 + growth * 0.3 + consistency * 0.2)));
    }

    private String buildTopicMasteryJson(Exam exam) {
        StringBuilder sb = new StringBuilder("{");
        boolean first = true;
        for (Map.Entry<String, Integer> e : exam.getTopicTotal().entrySet()) {
            if (!first)
                sb.append(",");
            int c = exam.getTopicCorrect().getOrDefault(e.getKey(), 0);
            sb.append("\"").append(e.getKey()).append("\":")
                    .append(e.getValue() > 0 ? Math.round((double) c / e.getValue() * 100) : 0);
            first = false;
        }
        return sb.append("}").toString();
    }

    private String buildBloomDistributionJson(Exam exam) {
        StringBuilder sb = new StringBuilder("{");
        boolean first = true;
        for (Map.Entry<String, Integer> e : exam.getBloomTotal().entrySet()) {
            if (!first)
                sb.append(",");
            int c = exam.getBloomCorrect().getOrDefault(e.getKey(), 0);
            sb.append("\"").append(e.getKey()).append("\":")
                    .append(e.getValue() > 0 ? Math.round((double) c / e.getValue() * 100) : 0);
            first = false;
        }
        return sb.append("}").toString();
    }

    private String generateExplanation(String risk, double acad, double comp,
            String topicJson, String bloomJson) {
        String riskText = switch (risk) {
            case "HIGH" ->
                "Student is at HIGH RISK. Immediate intervention recommended. Focus on foundational concepts.";
            case "MEDIUM" -> "Student shows MODERATE risk. Targeted practice in weak topics advised.";
            default ->
                "Student is performing well with LOW risk profile. Continue to challenge with higher-order thinking.";
        };
        return String.format(
                "Overall Performance: %.1f%% academic score, %.1f%% competency index. %s",
                acad, comp, riskText);
    }

    private double round(double v) {
        return Math.round(v * 10.0) / 10.0;
    }

    // =========================================================================
    // INNER TYPES
    // =========================================================================

    /**
     * Immutable snapshot of the four adaptive signals for one answer event.
     */
    private record AdaptiveDecision(
            boolean isCorrect,
            boolean isFast,
            boolean isSlow,
            boolean isTopicStrong,
            boolean isTopicWeak,
            boolean isBloomStrong,
            double topicAccuracy,
            double bloomAccuracy) {
    }

    /** Candidate question paired with its selection score */
    private record ScoredQuestion(Question question, int score) {
    }
}
