package com.anthony.colasuni.service;

import com.anthony.colasuni.dto.setting.SystemSettingDTO;

public interface SystemSettingService {
    SystemSettingDTO getSettings();
    SystemSettingDTO updateSettings(SystemSettingDTO dto);
}
