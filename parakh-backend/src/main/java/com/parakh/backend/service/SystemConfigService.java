package com.parakh.backend.service;

import com.parakh.backend.model.SystemConfig;
import com.parakh.backend.repository.SystemConfigRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class SystemConfigService {

    @Autowired
    private SystemConfigRepository configRepository;

    @Autowired
    private AuditService auditService;

    public List<SystemConfig> getAllConfigs() {
        return configRepository.findAll();
    }

    public Optional<SystemConfig> getConfig(String key) {
        return configRepository.findByConfigKey(key);
    }

    public SystemConfig updateConfig(String key, String value, String description) {
        SystemConfig config = configRepository.findByConfigKey(key)
                .orElse(new SystemConfig(key, value, description));
        config.setConfigValue(value);
        if (description != null) {
            config.setDescription(description);
        }
        SystemConfig saved = configRepository.save(config);
        auditService.logAction("UPDATE_CONFIG", "SYSTEM_CONFIG", key, "Updated config " + key + " to " + value);
        return saved;
    }

    public boolean isDemoMode() {
        return configRepository.findByConfigKey("demo.mode.enabled")
                .map(c -> "true".equalsIgnoreCase(c.getConfigValue()))
                .orElse(false);
    }
}
