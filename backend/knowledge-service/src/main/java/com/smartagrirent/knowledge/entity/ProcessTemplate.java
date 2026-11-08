package com.smartagrirent.knowledge.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "process_templates")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProcessTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "template_id")
    private Integer templateId;

    @Column(name = "variety_id", nullable = false)
    private Integer varietyId;

    @Column(name = "pt_created_by", nullable = false)
    private Integer ptCreatedBy;

    @Builder.Default
    @Column(name = "version", nullable = false, length = 20)
    private String version = "1.0";

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "variety_id", insertable = false, updatable = false)
    private Variety variety;

    @Builder.Default
    @OneToMany(mappedBy = "template", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("stepOrder ASC")
    private List<TemplateStep> steps = new ArrayList<>();
}
