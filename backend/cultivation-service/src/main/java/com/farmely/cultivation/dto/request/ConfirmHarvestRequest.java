package com.farmely.cultivation.dto.request;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConfirmHarvestRequest {

    @Builder.Default
    private Boolean confirmed = true;

    private String customerFeedback;
}
