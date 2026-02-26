package com.parakh.backend.service;

import com.parakh.backend.model.*;
import com.parakh.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * RemedialEngineService — Phase 5: Intervention & Remedial Intelligence Layer
 *
 * Rule-based logic, no ML. Derives a personalised remedial practice plan from:
 * - Weakest topic (lowest mastery %)
 * - Risk score (HIGH / MEDIUM / LOW)
 * - Bloom regression signals
 * - Difficulty success rates
 *
 * Outputs:
 * - recommendedTopic
 * - recommendedDifficultyMix (e.g. {Easy:50%,Medium:40%,Hard:10%})
 * - recommendedBloomMix (e.g. {Remember:40%,Understand:40%,Apply:20%})
 * - recommendedPracticeCount (5 / 8 / 10 depending on severity)
 * - estimatedRemediationTime (minutes)
 * - practiceQuestions (actual Question objects, answer-masked)
 */
@Service
public class RemedialEngineService {

    @Autowired
    private UserRepository userRepository;
    @Autowired
    private ExamRepository examRepository;
    @Autowired
    private QuestionRepository questionRepository;
    @Autowired
    private ProgressCardRepository progressCardRepository;

    // Bloom progression order
    private static final List<String> BLOOM_LEVELS = Arrays.asList("Remember", "Understand", "Apply", "Analyze");

    // ── Public API ────────────────────────────────────────────────────────────

    /**
     * Computes a full remediation plan for the student.
     * Called by GET /api/student/my/remediation-plan (preview) and
     * POST /api/student/start-remedial (creates a live remedial exam).
     */
    public Map<String, Object> computeRemedialPlan(Long studentId) {
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        List<Exam> completedExams = examRepository.findByUserId(studentId).stream()
                .filter(e -> "COMPLETED".equals(e.getStatus()) || "TERMINATED".equals(e.getStatus()))
                .collect(Collectors.toList());

        List<ProgressCard> cards = progressCardRepository.findByStudentIdOrderByGeneratedAtDesc(studentId);

        // ── 1. Determine severity from latest progress card / risk signals ──
        String riskLevel = "LOW";
        double riskScore = 0;
        if (!cards.isEmpty()) {
            riskLevel = cards.get(0).getRiskIndicator();
            riskScore = cards.get(0).getRiskScore();
        }

        // ── 2. Find weakest topic across all completed exams ───────────────
        Map<String, Integer> topicCorrect = new HashMap<>();
        Map<String, Integer> topicTotal = new HashMap<>();
        for (Exam exam : completedExams) {
            exam.getTopicTotal().forEach((t, n) -> topicTotal.merge(t, n, Integer::sum));
            exam.getTopicCorrect().forEach((t, n) -> topicCorrect.merge(t, n, Integer::sum));
        }

        String weakestTopic = topicTotal.entrySet().stream()
                .filter(e -> e.getValue() >= 2)
                .min(Comparator.comparingDouble(e -> {
                    int c = topicCorrect.getOrDefault(e.getKey(), 0);
                    return (double) c / e.getValue();
                }))
                .map(Map.Entry::getKey)
                .orElse(null);

        double weakestTopicMastery = 0;
        if (weakestTopic != null) {
            int tot = topicTotal.get(weakestTopic);
            int cor = topicCorrect.getOrDefault(weakestTopic, 0);
            weakestTopicMastery = tot > 0 ? (double) cor / tot * 100 : 0;
        }

        // ── 3. Identify starting Bloom level (regressed or current) ────────
        // Use lowest bloom level with < 50% accuracy as entry point
        Map<String, Integer> bloomCorrect = new HashMap<>();
        Map<String, Integer> bloomTotal = new HashMap<>();
        for (Exam exam : completedExams) {
            exam.getBloomTotal().forEach((b, n) -> bloomTotal.merge(b, n, Integer::sum));
            exam.getBloomCorrect().forEach((b, n) -> bloomCorrect.merge(b, n, Integer::sum));
        }

        String startBloom = BLOOM_LEVELS.stream()
                .filter(b -> {
                    int tot = bloomTotal.getOrDefault(b, 0);
                    if (tot < 2)
                        return false;
                    int cor = bloomCorrect.getOrDefault(b, 0);
                    return (double) cor / tot < 0.50;
                })
                .findFirst()
                .orElse("Remember");

        // ── 4. Determine difficulty mix from risk level ─────────────────────
        Map<String, Object> diffMix = computeDifficultyMix(riskLevel, weakestTopicMastery);

        // ── 5. Determine bloom mix ────────────────────────────────────────
        Map<String, Object> bloomMix = computeBloomMix(startBloom, riskLevel);

        // ── 6. Practice count and time estimate ───────────────────────────
        int practiceCount = switch (riskLevel) {
            case "HIGH" -> 10;
            case "MEDIUM" -> 7;
            default -> 5;
        };
        // avg 2 min per Easy, 3 min per Medium, 4 min per Hard (weighted by mix)
        int estimatedMinutes = estimateTime(diffMix, practiceCount);

        // ── 7. Identify subject (from most recent exam) ───────────────────
        String subject = completedExams.isEmpty() ? "General"
                : completedExams.get(completedExams.size() - 1).getSubject();

        // ── 8. Select practice questions ──────────────────────────────────
        List<Map<String, Object>> practiceQuestions = selectPracticeQuestions(subject, weakestTopic, startBloom,
                diffMix, practiceCount, completedExams);

        // ── 9. Generate intervention type label ───────────────────────────
        String interventionType = deriveInterventionType(riskLevel, weakestTopicMastery, startBloom);

        // ── 10. Build plan ────────────────────────────────────────────────
        Map<String, Object> plan = new LinkedHashMap<>();
        plan.put("studentName", student.getName());
        plan.put("riskLevel", riskLevel);
        plan.put("riskScore", Math.round(riskScore * 10.0) / 10.0);
        plan.put("recommendedTopic", weakestTopic != null ? weakestTopic : "General");
        plan.put("topicMastery", Math.round(weakestTopicMastery * 10.0) / 10.0);
        plan.put("recommendedDifficultyMix", diffMix);
        plan.put("recommendedBloomMix", bloomMix);
        plan.put("startingBloomLevel", startBloom);
        plan.put("recommendedPracticeCount", practiceCount);
        plan.put("estimatedRemediationTime", estimatedMinutes);
        plan.put("interventionType", interventionType);
        plan.put("practiceQuestions", practiceQuestions);
        plan.put("generatedAt", LocalDateTime.now().toString());

        return plan;
    }

    /**
     * Creates a live remedial exam session for the student using adaptive engine.
     * Bootstraps a new Exam entity pre-seeded with weakest-topic adaptive state.
     */
    public Map<String, Object> startRemedialSession(Long studentId) {
        Map<String, Object> plan = computeRemedialPlan(studentId);

        User student = userRepository.findById(studentId).orElseThrow();
        String weakestTopic = (String) plan.get("recommendedTopic");
        String startBloom = (String) plan.get("startingBloomLevel");
        String subject = determineSubject(studentId);

        // Determine starting difficulty from risk
        String riskLevel = (String) plan.get("riskLevel");
        String startDiff = switch (riskLevel) {
            case "HIGH" -> "Easy";
            case "MEDIUM" -> "Easy";
            default -> "Medium";
        };

        // Create a short remedial exam (10 questions max, adaptive)
        Exam remedialExam = new Exam();
        remedialExam.setUser(student);
        remedialExam.setAssessment(null); // standalone remedial session
        remedialExam.setSubject(subject);
        remedialExam.setStartTime(LocalDateTime.now());
        remedialExam.setStatus("IN_PROGRESS");
        remedialExam.setCurrentDifficulty(startDiff);
        remedialExam.setCurrentTopic(weakestTopic != null ? weakestTopic : "General");
        remedialExam.setCurrentBloomLevel(startBloom);
        remedialExam.setViolationCount(0);
        examRepository.save(remedialExam);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("examId", remedialExam.getId());
        result.put("topic", weakestTopic);
        result.put("startDifficulty", startDiff);
        result.put("startBloom", startBloom);
        result.put("maxQuestions", plan.get("recommendedPracticeCount"));
        result.put("message", "Remedial session created. Use ExamInterface with examId to begin.");
        result.putAll(plan); // include full plan for reference
        return result;
    }

    // ── Class-level intervention ───────────────────────────────────────────────

    /**
     * Generates class-level intervention plan for teacher analytics.
     * Returns interventionNeededStudents, suggestedInterventionType,
     * classRemediationPlan.
     */
    public Map<String, Object> computeClassInterventionPlan(Long classId,
            List<Map<String, Object>> riskStudents,
            Map<String, Double> topicHeatmap) {
        // Intervention needed = HIGH risk students + MEDIUM risk students
        List<Map<String, Object>> interventionStudents = riskStudents.stream()
                .filter(s -> "HIGH".equals(s.get("riskIndicator"))
                        || "MEDIUM".equals(s.get("riskIndicator")))
                .collect(Collectors.toList());

        int highRiskCount = (int) riskStudents.stream()
                .filter(s -> "HIGH".equals(s.get("riskIndicator"))).count();
        int mediumRiskCount = (int) riskStudents.stream()
                .filter(s -> "MEDIUM".equals(s.get("riskIndicator"))).count();

        // Determine class-level intervention type
        String classIntervention;
        if (highRiskCount >= 3) {
            classIntervention = "IMMEDIATE_GROUP_REVIEW";
        } else if (highRiskCount >= 1 || mediumRiskCount >= 3) {
            classIntervention = "TARGETED_REMEDIATION";
        } else if (mediumRiskCount >= 1) {
            classIntervention = "SUPPLEMENTAL_PRACTICE";
        } else {
            classIntervention = "ENRICHMENT";
        }

        // Weakest class topic
        String classWeakestTopic = topicHeatmap.entrySet().stream()
                .min(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey).orElse("N/A");
        double classWeakestMastery = topicHeatmap.getOrDefault(classWeakestTopic, 0.0);

        // Build class remediation plan
        Map<String, Object> classRemediationPlan = new LinkedHashMap<>();
        classRemediationPlan.put("weakestTopic", classWeakestTopic);
        classRemediationPlan.put("topicMastery", classWeakestMastery);
        classRemediationPlan.put("highRiskStudents", highRiskCount);
        classRemediationPlan.put("mediumRiskStudents", mediumRiskCount);
        classRemediationPlan.put("recommendedSessions", computeRecommendedSessions(highRiskCount, mediumRiskCount));
        classRemediationPlan.put("sessionDurationMins", highRiskCount >= 3 ? 60 : 45);
        classRemediationPlan.put("interventionActions", buildInterventionActions(classIntervention, classWeakestTopic));
        classRemediationPlan.put("timeline", buildTimeline(classIntervention));

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("interventionNeededStudents", interventionStudents);
        result.put("suggestedInterventionType", classIntervention);
        result.put("classRemediationPlan", classRemediationPlan);
        return result;
    }

    // ── Private Helpers ───────────────────────────────────────────────────────

    private Map<String, Object> computeDifficultyMix(String riskLevel, double topicMastery) {
        Map<String, Object> mix = new LinkedHashMap<>();
        if ("HIGH".equals(riskLevel) || topicMastery < 30) {
            // Heavy remediation: mostly easy
            mix.put("Easy", 60);
            mix.put("Medium", 35);
            mix.put("Hard", 5);
        } else if ("MEDIUM".equals(riskLevel) || topicMastery < 55) {
            // Mid remediation: balanced easy-medium
            mix.put("Easy", 35);
            mix.put("Medium", 50);
            mix.put("Hard", 15);
        } else {
            // Light remediation: challenge mode
            mix.put("Easy", 20);
            mix.put("Medium", 50);
            mix.put("Hard", 30);
        }
        return mix;
    }

    private Map<String, Object> computeBloomMix(String startBloom, String riskLevel) {
        int startIdx = Math.max(0, BLOOM_LEVELS.indexOf(startBloom));
        Map<String, Object> mix = new LinkedHashMap<>();
        // Concentrate weight on startBloom and one level up
        int[] weights = new int[BLOOM_LEVELS.size()];
        if ("HIGH".equals(riskLevel)) {
            // Focus on foundation
            weights[startIdx] = 60;
            if (startIdx + 1 < weights.length)
                weights[startIdx + 1] = 30;
            if (startIdx + 2 < weights.length)
                weights[startIdx + 2] = 10;
        } else if ("MEDIUM".equals(riskLevel)) {
            weights[startIdx] = 40;
            if (startIdx + 1 < weights.length)
                weights[startIdx + 1] = 40;
            if (startIdx + 2 < weights.length)
                weights[startIdx + 2] = 20;
        } else {
            weights[startIdx] = 25;
            if (startIdx + 1 < weights.length)
                weights[startIdx + 1] = 35;
            if (startIdx + 2 < weights.length)
                weights[startIdx + 2] = 30;
            if (startIdx + 3 < weights.length)
                weights[startIdx + 3] = 10;
        }
        for (int i = 0; i < BLOOM_LEVELS.size(); i++) {
            if (weights[i] > 0)
                mix.put(BLOOM_LEVELS.get(i), weights[i]);
        }
        return mix;
    }

    private int estimateTime(Map<String, Object> diffMix, int count) {
        Map<String, Integer> minutesPerQ = Map.of("Easy", 2, "Medium", 3, "Hard", 4);
        double total = 0;
        for (Map.Entry<String, Object> e : diffMix.entrySet()) {
            int pct = (int) e.getValue();
            total += minutesPerQ.getOrDefault(e.getKey(), 3) * (pct / 100.0) * count;
        }
        return (int) Math.ceil(total) + 5; // +5 min buffer
    }

    /**
     * Selects real questions from DB matching the remedial plan parameters.
     * Falls back progressively if strict match yields too few.
     */
    private List<Map<String, Object>> selectPracticeQuestions(String subject,
            String topic,
            String startBloom,
            Map<String, Object> diffMix,
            int count,
            List<Exam> completedExams) {
        // Collect already-answered question IDs to avoid repetition
        Set<Long> answered = completedExams.stream()
                .flatMap(e -> e.getAnsweredQuestionIds().stream())
                .collect(Collectors.toSet());

        // Build weighted question pool
        List<Question> byTopic = (topic != null && !"General".equals(topic))
                ? questionRepository.findBySubject(subject).stream()
                        .filter(q -> topic.equals(q.getTopic()))
                        .filter(q -> !answered.contains(q.getId()))
                        .collect(Collectors.toList())
                : questionRepository.findBySubject(subject).stream()
                        .filter(q -> !answered.contains(q.getId()))
                        .collect(Collectors.toList());

        // Fallback: if too few un-answered, include answered ones
        if (byTopic.size() < count) {
            byTopic = (topic != null && !"General".equals(topic))
                    ? questionRepository.findBySubject(subject).stream()
                            .filter(q -> topic.equals(q.getTopic()))
                            .collect(Collectors.toList())
                    : new ArrayList<>(questionRepository.findBySubject(subject));
        }

        // Score and select by difficulty mix
        List<Question> selected = new ArrayList<>();
        for (Map.Entry<String, Object> entry : diffMix.entrySet()) {
            String diff = entry.getKey();
            int pct = (int) entry.getValue();
            int qCount = Math.max(1, (int) Math.round(pct / 100.0 * count));

            List<Question> diffPool = byTopic.stream()
                    .filter(q -> diff.equals(q.getDifficulty()))
                    .collect(Collectors.toList());
            Collections.shuffle(diffPool);
            selected.addAll(diffPool.stream().limit(qCount).collect(Collectors.toList()));
        }

        // If still short, pad from full pool
        if (selected.size() < count) {
            List<Question> extra = byTopic.stream()
                    .filter(q -> !selected.contains(q))
                    .collect(Collectors.toList());
            Collections.shuffle(extra);
            selected.addAll(extra.stream().limit(count - selected.size()).collect(Collectors.toList()));
        }

        // Trim to exact count and mask correct answers
        return selected.stream().limit(count).map(q -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", q.getId());
            m.put("content", q.getContent());
            m.put("optionA", q.getOptionA());
            m.put("optionB", q.getOptionB());
            m.put("optionC", q.getOptionC());
            m.put("optionD", q.getOptionD());
            m.put("difficulty", q.getDifficulty());
            m.put("topic", q.getTopic());
            m.put("bloomLevel", q.getBloomLevel());
            // correctOption intentionally omitted
            return m;
        }).collect(Collectors.toList());
    }

    private String determineSubject(Long studentId) {
        return examRepository.findByUserId(studentId).stream()
                .filter(e -> e.getSubject() != null)
                .max(Comparator.comparing(Exam::getStartTime))
                .map(Exam::getSubject)
                .orElse("General");
    }

    private String deriveInterventionType(String riskLevel, double topicMastery, String startBloom) {
        if ("HIGH".equals(riskLevel) && topicMastery < 30)
            return "INTENSIVE_REMEDIATION";
        if ("HIGH".equals(riskLevel))
            return "TARGETED_REMEDIATION";
        if ("MEDIUM".equals(riskLevel) && "Remember".equals(startBloom))
            return "FOUNDATIONAL_REVIEW";
        if ("MEDIUM".equals(riskLevel))
            return "SUPPLEMENTAL_PRACTICE";
        return "ENRICHMENT_CHALLENGE";
    }

    private int computeRecommendedSessions(int high, int medium) {
        if (high >= 3)
            return 5;
        if (high >= 1)
            return 3;
        if (medium >= 3)
            return 2;
        return 1;
    }

    private List<String> buildInterventionActions(String type, String weakTopic) {
        return switch (type) {
            case "IMMEDIATE_GROUP_REVIEW" -> Arrays.asList(
                    "Schedule emergency group revision session on " + weakTopic,
                    "Assign individual remedial practice sets immediately",
                    "Notify parents or guardians of at-risk students",
                    "Request additional support from school mentor");
            case "TARGETED_REMEDIATION" -> Arrays.asList(
                    "Create focused remedial assessment on " + weakTopic,
                    "Assign Easy → Medium difficulty practice questions",
                    "Schedule 1-on-1 or small group review session",
                    "Monitor progress weekly with follow-up assessment");
            case "SUPPLEMENTAL_PRACTICE" -> Arrays.asList(
                    "Assign extra practice on " + weakTopic + " as homework",
                    "Recommend video resources or reading material for this topic",
                    "Include targeted questions in next assessment",
                    "Track improvement over next 2 assessment cycles");
            default -> Arrays.asList(
                    "Post enrichment challenges on advanced topics",
                    "Encourage peer tutoring to reinforce understanding",
                    "Introduce higher-order thinking (Bloom: Analyze) questions");
        };
    }

    private Map<String, String> buildTimeline(String type) {
        Map<String, String> timeline = new LinkedHashMap<>();
        switch (type) {
            case "IMMEDIATE_GROUP_REVIEW" -> {
                timeline.put("Week 1", "Emergency group revision session");
                timeline.put("Week 2", "Individual remedial assessments");
                timeline.put("Week 3", "Re-assessment and progress check");
                timeline.put("Week 4", "Parent/mentor follow-up");
            }
            case "TARGETED_REMEDIATION" -> {
                timeline.put("Week 1", "Assign remedial practice sets");
                timeline.put("Week 2", "Small group review session");
                timeline.put("Week 3", "Re-assessment on weak topics");
            }
            case "SUPPLEMENTAL_PRACTICE" -> {
                timeline.put("Week 1", "Assign supplementary practice");
                timeline.put("Week 2", "Check completion and monitor");
            }
            default -> {
                timeline.put("Ongoing", "Enrichment challenges and self-paced advancement");
            }
        }
        return timeline;
    }
}
