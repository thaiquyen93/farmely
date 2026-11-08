package com.farmely.farm.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LandRequest {

    @NotBlank(message = "Tên nông trại không được để trống")
    @Size(max = 150, message = "Tên nông trại tối đa 150 ký tự")
    private String landName;

    @NotBlank(message = "Địa chỉ nông trại không được để trống")
    private String address;

    @Size(max = 5000, message = "Mô tả tối đa 5000 ký tự")
    private String description;

    /**
     * Ranh giới khu đất do Admin vẽ trên bản đồ: danh sách đỉnh {@code [lng, lat]} (WGS84).
     * Ring mở hoặc đóng đều được. Bỏ trống = giữ nguyên / chưa khoanh vùng.
     * Gửi mảng rỗng {@code []} để xoá ranh giới.
     */
    private List<List<Double>> boundary;
}
