package com.smartagrirent.monitoring.service.impl;

import com.smartagrirent.monitoring.dto.response.FileUploadResponse;
import com.smartagrirent.monitoring.service.FileUploadService;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.OffsetDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
public class FileUploadServiceImpl implements FileUploadService {

    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB limit according to SRS Non-Screen #22
    private static final List<String> ALLOWED_CONTENT_TYPES = Arrays.asList(
            "image/jpeg",
            "image/png",
            "image/webp"
    );

    @Value("${file.upload-dir:uploads/monitoring}")
    private String uploadDir;

    private Path fileStorageLocation;

    @PostConstruct
    public void init() {
        this.fileStorageLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.fileStorageLocation);
            log.info("Initialized file upload directory at: {}", this.fileStorageLocation);
        } catch (IOException ex) {
            log.error("Could not create the directory where the uploaded files will be stored.", ex);
        }
    }

    @Override
    public FileUploadResponse uploadFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Tệp tin tải lên không được để trống.");
        }

        // Validate max file size (5MB)
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("Kích thước tệp tin vượt quá giới hạn cho phép (Tối đa 5MB theo quy định SRS). Dung lượng thực tế: " + (file.getSize() / 1024 / 1024) + "MB");
        }

        // Validate MIME type
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
            throw new IllegalArgumentException("Định dạng tệp không được hỗ trợ. Chỉ chấp nhận các định dạng ảnh: JPEG, PNG, WEBP.");
        }

        String originalFileName = StringUtils.cleanPath(file.getOriginalFilename() != null ? file.getOriginalFilename() : "upload.jpg");
        String extension = "";
        int dotIndex = originalFileName.lastIndexOf(".");
        if (dotIndex >= 0) {
            extension = originalFileName.substring(dotIndex);
        } else {
            extension = ".jpg";
        }

        String storedFileName = System.currentTimeMillis() + "_" + UUID.randomUUID().toString().substring(0, 8) + extension;

        try {
            if (storedFileName.contains("..")) {
                throw new IllegalArgumentException("Tên tệp tin không hợp lệ: " + storedFileName);
            }

            Path targetLocation = this.fileStorageLocation.resolve(storedFileName);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            String fileUrl = "/api/files/" + storedFileName;

            log.info("Uploaded file successfully: {} (Size: {} bytes) -> {}", originalFileName, file.getSize(), fileUrl);

            return FileUploadResponse.builder()
                    .fileName(storedFileName)
                    .originalFileName(originalFileName)
                    .fileUrl(fileUrl)
                    .contentType(contentType)
                    .size(file.getSize())
                    .uploadedAt(OffsetDateTime.now())
                    .build();

        } catch (IOException ex) {
            log.error("Lỗi khi lưu trữ tệp tin: {}", ex.getMessage());
            throw new RuntimeException("Không thể lưu trữ tệp tin " + originalFileName + ". Vui lòng thử lại sau!", ex);
        }
    }

    @Override
    public Resource loadFileAsResource(String fileName) {
        try {
            Path filePath = this.fileStorageLocation.resolve(fileName).normalize();
            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists() && resource.isReadable()) {
                return resource;
            } else {
                throw new RuntimeException("Không tìm thấy tệp tin hoặc tệp không thể truy cập: " + fileName);
            }
        } catch (MalformedURLException ex) {
            throw new RuntimeException("Đường dẫn tệp tin không hợp lệ: " + fileName, ex);
        }
    }
}
