package com.smartagrirent.knowledge.service.impl;

import com.smartagrirent.knowledge.dto.request.CreateKnowledgeDocumentRequest;
import com.smartagrirent.knowledge.dto.request.UpdateKnowledgeDocumentRequest;
import com.smartagrirent.knowledge.dto.response.KnowledgeDocumentResponse;
import com.smartagrirent.knowledge.entity.KnowledgeDocument;
import com.smartagrirent.knowledge.entity.Variety;
import com.smartagrirent.knowledge.exception.ResourceNotFoundException;
import com.smartagrirent.knowledge.repository.KnowledgeDocumentRepository;
import com.smartagrirent.knowledge.repository.VarietyRepository;
import com.smartagrirent.knowledge.service.KnowledgeDocumentService;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class KnowledgeDocumentServiceImpl implements KnowledgeDocumentService {

    private final KnowledgeDocumentRepository documentRepository;
    private final VarietyRepository varietyRepository;

    @Value("${storage.upload-dir:uploads/documents}")
    private String uploadDir;

    @PostConstruct
    public void init() {
        try {
            seedSampleDocumentsIfEmpty();
        } catch (Exception e) {
            log.warn("Auto-seeding knowledge documents skipped or failed: {}", e.getMessage());
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<KnowledgeDocumentResponse> getAllDocuments() {
        return documentRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<KnowledgeDocumentResponse> searchDocuments(String keyword, String documentType, Integer varietyId) {
        String cleanKeyword = (keyword != null && !keyword.trim().isEmpty()) ? keyword.trim() : null;
        String cleanType = (documentType != null && !documentType.trim().isEmpty()) ? documentType.trim() : null;

        return documentRepository.searchDocuments(cleanKeyword, cleanType, varietyId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public KnowledgeDocumentResponse getDocumentById(Integer id) {
        KnowledgeDocument doc = documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tài liệu tri thức không tồn tại với ID: " + id));
        return mapToResponse(doc);
    }

    @Override
    @Transactional
    public KnowledgeDocumentResponse createDocument(CreateKnowledgeDocumentRequest request) {
        KnowledgeDocument doc = KnowledgeDocument.builder()
                .kdCreatedBy(request.getCreatedBy() != null ? request.getCreatedBy() : 5)
                .title(request.getTitle())
                .content(request.getContent())
                .fileUrl(request.getFileUrl())
                .varietyId(request.getVarietyId())
                .documentType(request.getDocumentType() != null ? request.getDocumentType() : "CULTIVATION_GUIDE")
                .version(request.getVersion() != null ? request.getVersion() : "v1.0")
                .fileSize(request.getFileSize() != null ? request.getFileSize() : "3.0 MB (PDF)")
                .isIndexedForRAG(request.getIsIndexedForRAG() != null ? request.getIsIndexedForRAG() : true)
                .sectionsCount(request.getSectionsCount() != null ? request.getSectionsCount() : 1)
                .status("PUBLISHED")
                .authorName(request.getAuthorName() != null ? request.getAuthorName() : "Hội đồng Kỹ thuật Farmely")
                .build();

        KnowledgeDocument saved = documentRepository.save(doc);
        log.info("Đã tạo mới tài liệu tri thức ID: {}", saved.getDocumentId());
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public KnowledgeDocumentResponse updateDocument(Integer id, UpdateKnowledgeDocumentRequest request) {
        KnowledgeDocument doc = documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tài liệu tri thức không tồn tại với ID: " + id));

        if (request.getTitle() != null && !request.getTitle().isBlank()) {
            doc.setTitle(request.getTitle());
        }
        if (request.getContent() != null) {
            doc.setContent(request.getContent());
        }
        if (request.getFileUrl() != null) {
            doc.setFileUrl(request.getFileUrl());
        }
        if (request.getVarietyId() != null) {
            doc.setVarietyId(request.getVarietyId());
        }
        if (request.getDocumentType() != null) {
            doc.setDocumentType(request.getDocumentType());
        }
        if (request.getVersion() != null) {
            doc.setVersion(request.getVersion());
        }
        if (request.getFileSize() != null) {
            doc.setFileSize(request.getFileSize());
        }
        if (request.getIsIndexedForRAG() != null) {
            doc.setIsIndexedForRAG(request.getIsIndexedForRAG());
        }
        if (request.getSectionsCount() != null) {
            doc.setSectionsCount(request.getSectionsCount());
        }
        if (request.getStatus() != null) {
            doc.setStatus(request.getStatus());
        }
        if (request.getAuthorName() != null) {
            doc.setAuthorName(request.getAuthorName());
        }

        KnowledgeDocument updated = documentRepository.save(doc);
        return mapToResponse(updated);
    }

    @Override
    @Transactional
    public void deleteDocument(Integer id) {
        if (!documentRepository.existsById(id)) {
            throw new ResourceNotFoundException("Tài liệu tri thức không tồn tại với ID: " + id);
        }
        documentRepository.deleteById(id);
        log.info("Đã xóa tài liệu tri thức ID: {}", id);
    }

    @Override
    @Transactional
    public KnowledgeDocumentResponse toggleRagStatus(Integer id) {
        KnowledgeDocument doc = documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tài liệu tri thức không tồn tại với ID: " + id));
        boolean current = Boolean.TRUE.equals(doc.getIsIndexedForRAG());
        doc.setIsIndexedForRAG(!current);
        KnowledgeDocument updated = documentRepository.save(doc);
        log.info("Chuyển trạng thái RAG Index tài liệu ID {}: {}", id, !current);
        return mapToResponse(updated);
    }

    @Value("${storage.docs-dir:d:/S5/Farmely/docs}")
    private String docsDir;

    @Value("${storage.frontend-docs-dir:d:/S5/Farmely/frontend/public/docs}")
    private String frontendDocsDir;

    @Override
    public String uploadFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Tệp tải lên không được để trống");
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null) {
            originalFilename = "document.pdf";
        }

        String cleanFilename = Paths.get(originalFilename).getFileName().toString()
                .replaceAll("[^a-zA-Z0-9._-]", "_");
        String finalFilename = System.currentTimeMillis() + "_" + cleanFilename;

        try {
            // 1. Lưu vào thư mục docs của backend
            Path docsPath = Paths.get(docsDir);
            if (!Files.exists(docsPath)) {
                Files.createDirectories(docsPath);
            }
            Files.copy(file.getInputStream(), docsPath.resolve(finalFilename), StandardCopyOption.REPLACE_EXISTING);

            // 2. Đồng bộ sang thư mục public/docs của frontend để phục vụ tải trực tiếp
            try {
                Path frontendPath = Paths.get(frontendDocsDir);
                if (!Files.exists(frontendPath)) {
                    Files.createDirectories(frontendPath);
                }
                Files.copy(docsPath.resolve(finalFilename), frontendPath.resolve(finalFilename), StandardCopyOption.REPLACE_EXISTING);
            } catch (Exception ex) {
                log.warn("Không thể sao chép sang frontend/public/docs: {}", ex.getMessage());
            }

            return "/docs/" + finalFilename;
        } catch (IOException e) {
            log.error("Lỗi khi lưu tệp tải lên vào docs: {}", e.getMessage(), e);
            throw new RuntimeException("Không thể lưu trữ tệp tài liệu: " + e.getMessage());
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<KnowledgeDocumentResponse> getRagDocuments() {
        return documentRepository.findByIsIndexedForRAGTrue().stream()
                .filter(d -> !"ARCHIVED".equalsIgnoreCase(d.getStatus()))
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void seedSampleDocumentsIfEmpty() {
        if (documentRepository.count() > 0) {
            return;
        }

        log.info("Kho tài liệu trống, đang khởi tạo 5 tài liệu chuẩn nông nghiệp Farmely...");
        List<KnowledgeDocument> initialList = List.of(
                KnowledgeDocument.builder()
                        .documentId(1)
                        .kdCreatedBy(5)
                        .title("Sách Hướng Dẫn Đào Tạo Sản Xuất Rau An Toàn Theo VietGAP")
                        .content("Tài liệu hướng dẫn chuẩn quốc gia 200 trang gồm 12 module: Đánh giá vùng đất, giá thể, nguồn nước, phân bón hữu cơ, bảo vệ thực vật sinh học, cách ly PHI và truy xuất nguồn gốc.")
                        .fileUrl("/docs/rau_an_toan_vietgap_huyen.pdf")
                        .varietyId(1)
                        .documentType("CULTIVATION_GUIDE")
                        .version("v2.1")
                        .fileSize("3.7 MB (PDF)")
                        .isIndexedForRAG(true)
                        .sectionsCount(12)
                        .status("PUBLISHED")
                        .authorName("ThS. Nguyễn Hoàng Nam")
                        .build(),

                KnowledgeDocument.builder()
                        .documentId(2)
                        .kdCreatedBy(5)
                        .title("Quy Trình Sử Dụng Nguyên Liệu Hữu Cơ, Phân Bón Hữu Cơ Phối Hợp Phân Vô Cơ Cho Sản Xuất Rau An Toàn (TBKT 01-104: 2021/BVTV)")
                        .content("Tiến bộ kỹ thuật ban hành bởi Cục BVTV - Bộ NN&PTNT hướng dẫn định mức N-P-K quy đổi, ủ hoai phân chuồng thay thế 50% vô cơ và phác đồ dinh dưỡng cho từng nhóm rau.")
                        .fileUrl("/docs/210219_pl_qt_tbkt_rau_an_toanpdf.pdf")
                        .varietyId(1)
                        .documentType("SAFETY_GUIDE")
                        .version("v1.4")
                        .fileSize("774 KB (PDF)")
                        .isIndexedForRAG(true)
                        .sectionsCount(8)
                        .status("PUBLISHED")
                        .authorName("TS. Đặng Thu Thảo")
                        .build(),

                KnowledgeDocument.builder()
                        .documentId(3)
                        .kdCreatedBy(5)
                        .title("Quyết Định 288/QĐ-BVTV-KH Công Nhận Tiến Bộ Kỹ Thuật Sản Xuất Rau Hữu Cơ Tiêu Chuẩn Quốc Gia")
                        .content("Quyết định pháp lý công nhận quy trình kỹ thuật sản xuất rau hữu cơ, kiểm soát vùng đệm cách ly môi trường, cấm hóa chất độc hại và kim loại nặng.")
                        .fileUrl("/docs/21.03,01_QD288 TBKT rau huu cơ.pdf")
                        .varietyId(2)
                        .documentType("CULTIVATION_GUIDE")
                        .version("v3.0")
                        .fileSize("3.9 MB (PDF)")
                        .isIndexedForRAG(true)
                        .sectionsCount(6)
                        .status("PUBLISHED")
                        .authorName("ThS. Nguyễn Hoàng Nam")
                        .build(),

                KnowledgeDocument.builder()
                        .documentId(4)
                        .kdCreatedBy(6)
                        .title("Quy Trình Quản Lý Dịch Hại Tổng Hợp (IPM) Trên Cây Trồng Nông Nghiệp")
                        .content("Quy trình kỹ thuật IPM cập nhật ban hành 2025 quy định cơ chế bẫy dính vàng, bẫy pheromone, bảo vệ sinh thái thiên địch và ngưỡng phòng trừ sinh học an toàn.")
                        .fileUrl("/docs/quy_trinh_ipm_na_712025pdf.pdf")
                        .varietyId(3)
                        .documentType("TECHNICAL_MANUAL")
                        .version("v1.2")
                        .fileSize("14.5 MB (PDF)")
                        .isIndexedForRAG(true)
                        .sectionsCount(10)
                        .status("PUBLISHED")
                        .authorName("Kỹ sư Trần Quốc Huy")
                        .build(),

                KnowledgeDocument.builder()
                        .documentId(5)
                        .kdCreatedBy(6)
                        .title("Quy Trình Quản Lý Tổng Hợp Sâu Bệnh Hại & Nấm Đối Kháng Sinh Học (TBKT 01-114: 2021/BVTV)")
                        .content("Quy trình phòng trừ nấm bệnh thối rễ, xì mủ, héo xanh bằng nấm đối kháng Trichoderma sinh học và chế phẩm sinh học thân thiện môi trường.")
                        .fileUrl("/docs/211225__quy_trinh_qlsb_sau_riengrevised_3pdf.pdf")
                        .varietyId(null)
                        .documentType("SAFETY_GUIDE")
                        .version("v2.0")
                        .fileSize("1.2 MB (PDF)")
                        .isIndexedForRAG(true)
                        .sectionsCount(5)
                        .status("PUBLISHED")
                        .authorName("Hội đồng Kỹ thuật Farmely")
                        .build()
        );

        documentRepository.saveAll(initialList);
        log.info("Đã khởi tạo thành công 5 tài liệu tri thức chuẩn!");
    }

    private KnowledgeDocumentResponse mapToResponse(KnowledgeDocument doc) {
        String varietyName = "Áp dụng chung";
        String cropName = "Nông nghiệp tổng quát";

        if (doc.getVarietyId() != null) {
            var varietyOpt = varietyRepository.findById(doc.getVarietyId());
            if (varietyOpt.isPresent()) {
                Variety v = varietyOpt.get();
                varietyName = v.getVarietyName();
                if (v.getCrop() != null) {
                    cropName = v.getCrop().getCropName();
                }
            }
        }

        String formattedDate = doc.getCreatedAt() != null
                ? doc.getCreatedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd"))
                : "";

        return KnowledgeDocumentResponse.builder()
                .id("DOC-" + String.format("%03d", doc.getDocumentId()))
                .documentId(doc.getDocumentId())
                .createdBy(doc.getKdCreatedBy())
                .title(doc.getTitle())
                .content(doc.getContent())
                .description(doc.getContent())
                .fileUrl(doc.getFileUrl())
                .varietyId(doc.getVarietyId())
                .varietyName(varietyName)
                .cropName(cropName)
                .documentType(doc.getDocumentType() != null ? doc.getDocumentType() : "CULTIVATION_GUIDE")
                .version(doc.getVersion() != null ? doc.getVersion() : "v1.0")
                .fileSize(doc.getFileSize() != null ? doc.getFileSize() : "3.0 MB (PDF)")
                .isIndexedForRAG(doc.getIsIndexedForRAG() != null ? doc.getIsIndexedForRAG() : true)
                .sectionsCount(doc.getSectionsCount() != null ? doc.getSectionsCount() : 1)
                .status(doc.getStatus() != null ? doc.getStatus() : "PUBLISHED")
                .author(doc.getAuthorName() != null ? doc.getAuthorName() : "Hội đồng Kỹ thuật Farmely")
                .uploadedDate(formattedDate)
                .createdAt(doc.getCreatedAt())
                .build();
    }
}
