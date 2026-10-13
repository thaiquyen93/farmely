package com.farmely.cultivation.dto.request;

import com.farmely.cultivation.entity.DeliveryType;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConfirmHarvestRequest {

    @Builder.Default
    private Boolean confirmed = true;

    private DeliveryType deliveryType;

    private String customerFeedback;
}
