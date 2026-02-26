package com.parakh.backend.config;

import com.parakh.backend.model.SystemConfig;
import com.parakh.backend.repository.SystemConfigRepository;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DemoDataConfig {

    private static final Logger logger = LoggerFactory.getLogger(DemoDataConfig.class);

    @Autowired
    private SystemConfigRepository systemConfigRepository;

    @PostConstruct
    public void init() {
        logger.info("DEMO_MODE_CHECK: Initializing production-ready configurations...");

        ensureConfig("AI_ENABLED", "true", "Global toggle for AI features");
        ensureConfig("REGISTRATION_ALLOWED", "true", "Whether new users can register");
        ensureConfig("DEMO_MODE", "false", "If true, demo data is pre-populated on UI");

        logger.info("SYSTEM_CONFIG_INITIALIZED: Ready for operations.");
    }

    private void ensureConfig(String key, String defaultValue, String description) {
        if (systemConfigRepository.findByConfigKey(key).isEmpty()) {
            systemConfigRepository.save(new SystemConfig(key, defaultValue, description));
            logger.info("CONFIG_CREATED: {} set to {}", key, defaultValue);
        }
    }
}
