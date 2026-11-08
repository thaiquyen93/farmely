package com.farmely.cultivation.dto.request;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateDiaryRequest {

    private String content;

    private String imageUrl;
}
