package com.smartagrirent.knowledge.dto.request;

import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateProcessTemplateRequest {

    private Integer varietyId;

    private String version;

    @Builder.Default
    @Valid
    private List<CreateTemplateStepRequest> steps = new ArrayList<>();
}
