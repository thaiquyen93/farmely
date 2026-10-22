package com.smartagrirent.knowledge.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
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
public class CreateProcessTemplateRequest {

    @NotNull(message = "Mã giống cây (varietyId) không được để trống")
    private Integer varietyId;

    private Integer ptCreatedBy;

    @Builder.Default
    private String version = "1.0";

    @Builder.Default
    @Valid
    private List<CreateTemplateStepRequest> steps = new ArrayList<>();
}
