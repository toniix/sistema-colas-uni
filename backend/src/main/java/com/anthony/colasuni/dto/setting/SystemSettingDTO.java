package com.anthony.colasuni.dto.setting;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SystemSettingDTO {
    private String universityName;
    private String systemName;
    private String logoBase64;
    private String coverBase64;
    private boolean configured;
}
