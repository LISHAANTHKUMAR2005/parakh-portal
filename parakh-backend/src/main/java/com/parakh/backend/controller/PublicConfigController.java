package com.parakh.backend.controller;

import com.parakh.backend.model.SystemConfig;
import com.parakh.backend.service.SystemConfigService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/public/config")
@CrossOrigin(origins = { "http://localhost:5173", "http://localhost:5174" })
public class PublicConfigController {

    @Autowired
    private SystemConfigService configService;

    @GetMapping("/notice")
    public Map<String, Object> getSystemNotice() {
        Map<String, Object> notice = new HashMap<>();

        boolean enabled = "true".equals(configService.getConfig("SYSTEM_NOTICE_ENABLED")
                .map(SystemConfig::getConfigValue).orElse("false"));

        notice.put("enabled", enabled);
        if (enabled) {
            notice.put("title", configService.getConfig("SYSTEM_NOTICE_TITLE")
                    .map(SystemConfig::getConfigValue).orElse("System Update"));
            notice.put("message", configService.getConfig("SYSTEM_NOTICE_MESSAGE")
                    .map(SystemConfig::getConfigValue).orElse(""));
            notice.put("priority", configService.getConfig("SYSTEM_NOTICE_PRIORITY")
                    .map(SystemConfig::getConfigValue).orElse("LOW"));
        }

        return notice;
    }
}
