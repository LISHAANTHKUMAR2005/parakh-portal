package com.parakh.backend.service;

import com.parakh.backend.model.AiCache;
import com.parakh.backend.repository.AiCacheRepository;
import com.parakh.backend.repository.SystemConfigRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.Map;
import java.util.Optional;

@Service
public class AIService {

    @Autowired
    private AiCacheRepository aiCacheRepository;
    @Autowired
    private SystemConfigRepository systemConfigRepository;

    private boolean isAiEnabled() {
        return systemConfigRepository.findByConfigKey("AI_ENABLED")
                .map(c -> "true".equalsIgnoreCase(c.getConfigValue()))
                .orElse(true); // Default to true for this phase demo
    }

    private String getHash(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = md.digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hashBytes);
        } catch (NoSuchAlgorithmException e) {
            return String.valueOf(input.hashCode());
        }
    }

    private String callExternalAiApi(String prompt, String category) {
        // Mocking AI Response for now. In a real scenario, this would call OpenAI or
        // Gemini via RestTemplate.
        if (category.equals("EXPLANATION")) {
            return "Based on the question's focus on logic and concepts, the correct answer is justified because it follows from the core principles of the subject. A deeper understanding of this topic helps in solving similar complex problems efficiently.";
        } else if (category.equals("SUMMARY")) {
            return "The student shows consistent performance in foundational topics but displays cognitive load exhaustion in higher Bloom level questions (Analyze/Apply). Recommend shifting focus to procedural fluency before tackling more abstract reasoning tasks.";
        } else if (category.equals("QUESTION")) {
            return "{\"content\": \"New AI-generated question content based on the topic?\", \"optionA\": \"Option A\", \"optionB\": \"Option B\", \"optionC\": \"Option C\", \"optionD\": \"Option D\", \"correctOption\": \"A\"}";
        } else if (category.equals("REMEDIATION")) {
            return "Enhance the plan by adding interleaved practice sessions. Research suggests that mixing different types of problems improves long-term retention compared to blocked practice of a single topic.";
        } else if (category.equals("LEARNING_PATH")) {
            return "Your personalized learning roadmap is designed to transform your current challenges into core competencies. By focusing on foundational mastery in the first two weeks, we build the cognitive stamina required for the advanced analytical tasks in the final phase. Stay consistent, as your predictive data suggests high potential for growth in higher-order thinking.";
        }
        return "AI response dummy text.";
    }

    private String getCachedOrGenerate(String prompt, String category) {
        if (!isAiEnabled()) {
            return "AI is currently disabled in system settings.";
        }

        String hash = getHash(prompt);
        Optional<AiCache> cached = aiCacheRepository.findByPromptHash(hash);
        if (cached.isPresent()) {
            return cached.get().getResponse();
        }

        String response = callExternalAiApi(prompt, category);
        aiCacheRepository.save(new AiCache(hash, response, category));
        return response;
    }

    public String generateExplanation(String question, String correctAnswer) {
        String prompt = "Explain why this question: '" + question + "' has the correct answer: '" + correctAnswer + "'";
        return getCachedOrGenerate(prompt, "EXPLANATION");
    }

    public String generateProgressSummary(Map<String, Object> intelligenceReport) {
        String prompt = "Generate a student progress narrative summary based on this intelligence data: "
                + intelligenceReport.toString();
        return getCachedOrGenerate(prompt, "SUMMARY");
    }

    public String generateQuestion(String topic, String difficulty, String bloomLevel) {
        String prompt = "Generate a " + difficulty + " question for topic " + topic + " at Bloom level " + bloomLevel
                + " in JSON format.";
        return getCachedOrGenerate(prompt, "QUESTION");
    }

    public String enhanceRemediationPlan(Map<String, Object> remediationData) {
        String prompt = "Enhance this remediation planning with AI research-backed study tips: "
                + remediationData.toString();
        return getCachedOrGenerate(prompt, "REMEDIATION");
    }

    public String generateLearningPathNarrative(Object learningPathDto) {
        String prompt = "Create a motivational and strategic learning roadmap summary for a student based on this plan: "
                + learningPathDto.toString();
        return getCachedOrGenerate(prompt, "LEARNING_PATH");
    }
}
