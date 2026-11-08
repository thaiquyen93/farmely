package com.farmely.cultivation.dto.response;

import lombok.*;

import java.time.OffsetDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FarmDiaryResponse {

    private Integer diaryId;
    private Integer rentalId;
    private Integer taskId;
    private String content;
    private String imageUrl;
    private OffsetDateTime createdAt;

    // UI contextual details
    private String plotCode;
    private String plotName;
    private String cropName;
    private String taskTitle;
    private String authorName;
}
