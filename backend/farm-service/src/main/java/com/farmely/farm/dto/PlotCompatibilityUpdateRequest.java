package com.farmely.farm.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlotCompatibilityUpdateRequest {

    @NotEmpty(message = "Danh sách giống cây tương thích không được rỗng")
    private List<Integer> varietyIds;
}
