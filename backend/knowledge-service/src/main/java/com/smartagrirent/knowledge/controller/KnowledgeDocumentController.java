package com.smartagrirent.knowledge.controller;

import com.smartagrirent.knowledge.dto.request.CreateKnowledgeDocumentRequest;
import com.smartagrirent.knowledge.dto.request.UpdateKnowledgeDocumentRequest;
import com.smartagrirent.knowledge.dto.response.ApiResponse;
import com.smartagrirent.knowledge.dto.response.KnowledgeDocumentResponse;
import com.smartagrirent.knowledge.service.KnowledgeDocumentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({"/api/v1/knowledge-documents", "/api/knowledge-documents"})
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Tag(name = "Knowledge Documents", description = "Quản lý kho tài liệu tri thức nông nghiệp và RAG AI Chatbot")
public class KnowledgeDocumentController {

    private final KnowledgeDocumentService documentService;

    @GetMapping
    @Operation(summary = "Lấy danh sách hoặc tìm kiếm tài liệu tri thức")
    public ResponseEntity<ApiResponse<List<KnowledgeDocumentResponse>>> getAll(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String documentType,
            @RequestParam(required = false) Integer varietyId
    ) {
        List<KnowledgeDocumentResponse> result = (keyword != null || documentType != null || varietyId != null)
                ? documentService.searchDocuments(keyword, documentType, varietyId)
                : documentService.getAllDocuments();
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Xem chi tiết một tài liệu tri thức")
    public ResponseEntity<ApiResponse<KnowledgeDocumentResponse>> getById(@PathVariable Integer id) {
        KnowledgeDocumentResponse doc = documentService.getDocumentById(id);
        return ResponseEntity.ok(ApiResponse.ok(doc));
    }

    @PostMapping
    @Operation(summary = "Tạo mới tài liệu tri thức")
    public ResponseEntity<ApiResponse<KnowledgeDocumentResponse>> create(
            @Valid @RequestBody CreateKnowledgeDocumentRequest request
    ) {
        KnowledgeDocumentResponse created = documentService.createDocument(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Tạo tài liệu thành công", created));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Cập nhật tài liệu tri thức")
    public ResponseEntity<ApiResponse<KnowledgeDocumentResponse>> update(
            @PathVariable Integer id,
            @Valid @RequestBody UpdateKnowledgeDocumentRequest request
    ) {
        KnowledgeDocumentResponse updated = documentService.updateDocument(id, request);
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật tài liệu thành công", updated));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Xóa tài liệu tri thức")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Integer id) {
        documentService.deleteDocument(id);
        return ResponseEntity.ok(ApiResponse.ok("Xóa tài liệu thành công", null));
    }

    @PostMapping("/{id}/toggle-rag")
    @Operation(summary = "Bật/Tắt trạng thái nhúng vector tri thức RAG cho AI Chatbot")
    public ResponseEntity<ApiResponse<KnowledgeDocumentResponse>> toggleRag(@PathVariable Integer id) {
        KnowledgeDocumentResponse updated = documentService.toggleRagStatus(id);
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật trạng thái RAG thành công", updated));
    }

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Tải lên tệp tài liệu kỹ thuật (PDF, DOCX)")
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadFile(
            @RequestParam("file") MultipartFile file
    ) {
        String fileUrl = documentService.uploadFile(file);
        return ResponseEntity.ok(ApiResponse.ok("Tải tệp thành công", Map.of(
                "fileUrl", fileUrl,
                "originalName", file.getOriginalFilename() != null ? file.getOriginalFilename() : "document.pdf",
                "size", String.format("%.1f MB (PDF)", (double) file.getSize() / (1024 * 1024))
        )));
    }

    @GetMapping("/rag-context")
    @Operation(summary = "Truy xuất danh sách tài liệu phục vụ ngữ cảnh tìm kiếm RAG cho AI Chatbot (US4.6)")
    public ResponseEntity<ApiResponse<List<KnowledgeDocumentResponse>>> getRagDocuments() {
        List<KnowledgeDocumentResponse> ragDocs = documentService.getRagDocuments();
        return ResponseEntity.ok(ApiResponse.ok(ragDocs));
    }
}
