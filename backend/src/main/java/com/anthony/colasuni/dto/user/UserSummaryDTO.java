package com.anthony.colasuni.dto.user;

import com.anthony.colasuni.enums.RoleEnum;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserSummaryDTO {
    private Long id;
    private String username;
    private String email;
    private String fullName;
    private RoleEnum role;
}
