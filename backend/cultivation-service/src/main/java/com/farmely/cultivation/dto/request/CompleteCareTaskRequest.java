package com.farmely.cultivation.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CompleteCareTaskRequest {

    @NotBlank(message = "Ảnh minh chứng hiện trường là bắt buộc (Quy định BR16)")
    private String evidenceImageUrl;

    private String notes;

    @Builder.Default
    private Boolean syncToDiary = true;
}
