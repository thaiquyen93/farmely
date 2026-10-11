package com.smartagrirent.knowledge.repository;

import com.smartagrirent.knowledge.entity.KnowledgeDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface KnowledgeDocumentRepository extends JpaRepository<KnowledgeDocument, Integer> {

    List<KnowledgeDocument> findByIsIndexedForRAGTrue();

    List<KnowledgeDocument> findByVarietyId(Integer varietyId);

    List<KnowledgeDocument> findByDocumentType(String documentType);

    @Query("SELECT k FROM KnowledgeDocument k WHERE " +
           "(:keyword IS NULL OR LOWER(k.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(k.content) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(k.authorName) LIKE LOWER(CONCAT('%', :keyword, '%'))) AND " +
           "(:documentType IS NULL OR k.documentType = :documentType) AND " +
           "(:varietyId IS NULL OR k.varietyId = :varietyId) " +
           "ORDER BY k.documentId ASC")
    List<KnowledgeDocument> searchDocuments(@Param("keyword") String keyword,
                                            @Param("documentType") String documentType,
                                            @Param("varietyId") Integer varietyId);
}
