package com.parakh.backend.service;

import com.parakh.backend.model.AuditLog;
import com.parakh.backend.repository.AuditRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.GrantedAuthority;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AuditService {
    @Autowired
    private AuditRepository auditRepository;

    public void logAction(String action, String targetEntity, String targetId, String details) {
        logAction(action, targetEntity, targetId, details, null);
    }

    public void logActionWithActor(String action, String targetEntity, String targetId, String details,
            String actorEmail,
            String role) {
        AuditLog log = new AuditLog();
        log.setAction(action);
        log.setActorEmail(actorEmail);
        log.setPerformerRole(role);
        log.setTargetEntity(targetEntity);
        log.setTargetId(targetId);
        log.setDetails(details);
        populateRequestDetails(log);
        auditRepository.save(log);
    }

    private void populateRequestDetails(AuditLog log) {
        try {
            org.springframework.web.context.request.ServletRequestAttributes attributes = (org.springframework.web.context.request.ServletRequestAttributes) org.springframework.web.context.request.RequestContextHolder
                    .getRequestAttributes();
            if (attributes != null) {
                jakarta.servlet.http.HttpServletRequest request = attributes.getRequest();
                String ip = request.getHeader("X-Forwarded-For");
                if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
                    ip = request.getRemoteAddr();
                } else {
                    ip = ip.split(",")[0].trim();
                }
                log.setIpAddress(ip);
                log.setUserAgent(request.getHeader("User-Agent"));
            }
        } catch (Exception e) {
        }
    }

    public void logAction(String action, String targetEntity, String targetId, String details, String metadata) {
        AuditLog log = new AuditLog();
        log.setAction(action);

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String actor = (auth != null) ? auth.getName() : "SYSTEM";
        log.setActorEmail(actor);

        if (auth != null) {
            String role = auth.getAuthorities().stream()
                    .map(GrantedAuthority::getAuthority)
                    .collect(Collectors.joining(","));
            log.setPerformerRole(role);
        }

        log.setTargetEntity(targetEntity);
        log.setTargetId(targetId);
        log.setDetails(details);
        log.setMetadata(metadata);

        populateRequestDetails(log);

        auditRepository.save(log);
    }

    public Page<AuditLog> getLogs(String action, Pageable pageable) {
        if (action != null && !action.isEmpty()) {
            return auditRepository.findByAction(action, pageable);
        }
        return auditRepository.findAll(pageable);
    }

    public List<AuditLog> getAllLogs() {
        return auditRepository.findAllByOrderByTimestampDesc();
    }
}
