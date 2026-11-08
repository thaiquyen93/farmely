package com.smartagrirent.monitoring.service;

import com.smartagrirent.monitoring.dto.response.FileUploadResponse;
import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

public interface FileUploadService {

    /**
     * Upload an evidence image or document file (SRS Non-Screen #22)
     * Validates MIME type (JPEG/PNG/WEBP) and file size (<= 5MB)
     */
    FileUploadResponse uploadFile(MultipartFile file);

    /**
     * Load a file as a Resource for streaming/viewing or downloading
     */
    Resource loadFileAsResource(String fileName);
}
