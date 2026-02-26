package com.parakh.backend.controller;

import com.parakh.backend.model.SystemConfig;
import com.parakh.backend.service.SystemConfigService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/config")
@CrossOrigin(origins = { "http://localhost:5173", "http://localhost:5174" })
public class SystemConfigController {

    @Autowired
    private SystemConfigService configService;

    @Autowired
    private com.parakh.backend.service.AuditService auditService;

    @GetMapping
    public List<SystemConfig> getAllConfigs() {
        return configService.getAllConfigs();
    }

    @GetMapping("/api/public/config")
    public List<SystemConfig> getPublicConfigs() {
        return configService.getAllConfigs();
    }

    @PutMapping("/{key}")
    public ResponseEntity<SystemConfig> updateConfig(@PathVariable String key,
            @RequestBody Map<String, String> payload) {
        String value = payload.get("value");
        String description = payload.get("description");
        SystemConfig updated = configService.updateConfig(key, value, description);
        auditService.logAction("SYSTEM_CONFIG_CHANGE", "SYSTEM_CONFIG", key,
                "Updated " + key + " to " + value);
        return ResponseEntity.ok(updated);
    }
}
