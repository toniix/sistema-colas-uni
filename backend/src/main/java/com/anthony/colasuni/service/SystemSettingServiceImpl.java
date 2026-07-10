package com.anthony.colasuni.service;

import com.anthony.colasuni.dto.setting.SystemSettingDTO;
import com.anthony.colasuni.entity.SystemSetting;
import com.anthony.colasuni.repository.SystemSettingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class SystemSettingServiceImpl implements SystemSettingService {

    private final SystemSettingRepository repository;

    @Override
    @Transactional(readOnly = true)
    public SystemSettingDTO getSettings() {
        SystemSetting setting = repository.findById(1L)
                .orElseGet(() -> SystemSetting.builder()
                        .id(1L)
                        .universityName("Universidad Nacional")
                        .systemName("Sistema de Colas")
                        .logoBase64(null)
                        .coverBase64(null)
                        .configured(false)
                        .build());
        return mapToDTO(setting);
    }

    @Override
    @Transactional
    public SystemSettingDTO updateSettings(SystemSettingDTO dto) {
        SystemSetting setting = repository.findById(1L)
                .orElseGet(() -> SystemSetting.builder().id(1L).build());

        setting.setUniversityName(dto.getUniversityName());
        setting.setSystemName(dto.getSystemName());
        setting.setLogoBase64(dto.getLogoBase64());
        setting.setCoverBase64(dto.getCoverBase64());
        setting.setConfigured(true);

        SystemSetting saved = repository.save(setting);
        return mapToDTO(saved);
    }

    private SystemSettingDTO mapToDTO(SystemSetting setting) {
        return SystemSettingDTO.builder()
                .universityName(setting.getUniversityName())
                .systemName(setting.getSystemName())
                .logoBase64(setting.getLogoBase64())
                .coverBase64(setting.getCoverBase64())
                .configured(setting.isConfigured())
                .build();
    }
}
