package com.smartagrirent.knowledge.service;

import com.smartagrirent.knowledge.dto.request.CreateKnowledgeDocumentRequest;
import com.smartagrirent.knowledge.dto.request.UpdateKnowledgeDocumentRequest;
import com.smartagrirent.knowledge.dto.response.KnowledgeDocumentResponse;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface KnowledgeDocumentService {
    List<KnowledgeDocumentResponse> getAllDocuments();
    List<KnowledgeDocumentResponse> searchDocuments(String keyword, String documentType, Integer varietyId);
    KnowledgeDocumentResponse getDocumentById(Integer id);
    KnowledgeDocumentResponse createDocument(CreateKnowledgeDocumentRequest request);
    KnowledgeDocumentResponse updateDocument(Integer id, UpdateKnowledgeDocumentRequest request);
    void deleteDocument(Integer id);
    KnowledgeDocumentResponse toggleRagStatus(Integer id);
    String uploadFile(MultipartFile file);
    List<KnowledgeDocumentResponse> getRagDocuments();
    void seedSampleDocumentsIfEmpty();
}
