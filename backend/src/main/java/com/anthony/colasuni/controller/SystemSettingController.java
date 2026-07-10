package com.anthony.colasuni.controller;

import com.anthony.colasuni.dto.setting.SystemSettingDTO;
import com.anthony.colasuni.service.SystemSettingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/settings")
@RequiredArgsConstructor
public class SystemSettingController {

    private final SystemSettingService settingService;

    @GetMapping
    public ResponseEntity<SystemSettingDTO> getSettings() {
        return ResponseEntity.ok(settingService.getSettings());
    }

    @PutMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SystemSettingDTO> updateSettings(@RequestBody SystemSettingDTO dto) {
        return ResponseEntity.ok(settingService.updateSettings(dto));
    }
}
