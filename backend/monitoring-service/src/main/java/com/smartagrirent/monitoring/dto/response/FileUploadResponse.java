package com.smartagrirent.monitoring.dto.response;

import lombok.*;

import java.time.OffsetDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FileUploadResponse {
    private String fileName;
    private String originalFileName;
    private String fileUrl;
    private String contentType;
    private Long size;
    private OffsetDateTime uploadedAt;
}
