package com.farmely.farm.geo;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class PolygonGeometryTest {

    /** Hình vuông ~111 m × 111 m quanh (106.35, 10.68) — ring mở [lng, lat] */
    private static List<List<Double>> square(double lng, double lat, double size) {
        return List.of(
                List.of(lng, lat),
                List.of(lng + size, lat),
                List.of(lng + size, lat + size),
                List.of(lng, lat + size));
    }

    private static final double D = 0.001; // ≈ 109 m kinh độ ở vĩ độ 10.68, 111 m vĩ độ

    @Test
    void areaMatchesSphericalFormula() {
        double area = PolygonGeometry.areaM2(PolygonGeometry.normalize(square(106.35, 10.68, D)));
        // 0.001° × 0.001° tại vĩ độ 10.68 ≈ 109.4 m × 110.6 m ≈ 12 100 m²
        assertThat(area).isBetween(12_000.0, 12_250.0);
    }

    @Test
    void normalizeAcceptsClosedRingAndDropsDuplicates() {
        List<List<Double>> closed = List.of(
                List.of(106.35, 10.68), List.of(106.35, 10.68), // trùng liên tiếp
                List.of(106.351, 10.68), List.of(106.351, 10.681), List.of(106.35, 10.681),
                List.of(106.35, 10.68)); // điểm đóng
        assertThat(PolygonGeometry.normalize(closed)).hasSize(4);
    }

    @Test
    void rejectsTooFewPointsBadCoordinatesAndSelfIntersection() {
        assertThatThrownBy(() -> PolygonGeometry.normalize(List.of(List.of(1.0, 1.0), List.of(2.0, 2.0))))
                .hasMessageContaining("ít nhất 3 đỉnh");
        assertThatThrownBy(() -> PolygonGeometry.normalize(List.of(List.of(200.0, 1.0), List.of(2.0, 2.0), List.of(3.0, 1.0))))
                .hasMessageContaining("Toạ độ không hợp lệ");
        // hình nơ (bowtie) tự cắt
        List<List<Double>> bowtie = List.of(
                List.of(106.35, 10.68), List.of(106.351, 10.681),
                List.of(106.351, 10.68), List.of(106.35, 10.681));
        assertThatThrownBy(() -> PolygonGeometry.normalize(bowtie)).hasMessageContaining("tự cắt");
    }

    @Test
    void plotInsideLandIsContainedEvenWhenTouchingTheFence() {
        var land = PolygonGeometry.normalize(square(106.35, 10.68, D * 4));
        var inner = PolygonGeometry.normalize(square(106.351, 10.681, D));
        var onFence = PolygonGeometry.normalize(square(106.35, 10.68, D)); // chung 2 cạnh với hàng rào
        var sticksOut = PolygonGeometry.normalize(square(106.3535, 10.681, D));
        assertThat(PolygonGeometry.contains(land, inner)).isTrue();
        assertThat(PolygonGeometry.contains(land, onFence)).isTrue();
        assertThat(PolygonGeometry.contains(land, sticksOut)).isFalse();
    }

    @Test
    void neighboursSharingAnEdgeDoNotOverlap() {
        var a = PolygonGeometry.normalize(square(106.35, 10.68, D));
        var right = PolygonGeometry.normalize(square(106.35 + D, 10.68, D)); // chung cạnh phải
        var corner = PolygonGeometry.normalize(square(106.35 + D, 10.68 + D, D)); // chung 1 đỉnh
        assertThat(PolygonGeometry.overlaps(a, right)).isFalse();
        assertThat(PolygonGeometry.overlaps(a, corner)).isFalse();
    }

    @Test
    void detectsPartialFullAndIdenticalOverlap() {
        var a = PolygonGeometry.normalize(square(106.35, 10.68, D));
        var shifted = PolygonGeometry.normalize(square(106.3505, 10.6805, D));
        var insideA = PolygonGeometry.normalize(square(106.3502, 10.6802, D / 4));
        var same = PolygonGeometry.normalize(square(106.35, 10.68, D));
        assertThat(PolygonGeometry.overlaps(a, shifted)).isTrue();
        assertThat(PolygonGeometry.overlaps(a, insideA)).isTrue();
        assertThat(PolygonGeometry.overlaps(insideA, a)).isTrue();
        assertThat(PolygonGeometry.overlaps(a, same)).isTrue();
    }

    @Test
    void concavePolygonInteriorPointIsInside() {
        // hình chữ U: trọng tâm rơi vào khoảng trống giữa hai càng
        var u = PolygonGeometry.normalize(List.of(
                List.of(0.0, 0.0), List.of(0.003, 0.0), List.of(0.003, 0.003), List.of(0.002, 0.003),
                List.of(0.002, 0.001), List.of(0.001, 0.001), List.of(0.001, 0.003), List.of(0.0, 0.003)));
        var inGap = PolygonGeometry.normalize(square(0.0012, 0.0015, 0.0005));
        assertThat(PolygonGeometry.overlaps(u, inGap)).isFalse();
        double[] p = PolygonGeometry.interiorPoint(u);
        assertThat(p[1]).isBetween(0.0, 0.003);
    }

    @Test
    void geoJsonRoundTrip() {
        var ring = PolygonGeometry.normalize(square(106.35, 10.68, D));
        String json = BoundaryCodec.toGeoJson(ring);
        assertThat(json).startsWith("{\"type\":\"Polygon\",\"coordinates\":[[[");
        assertThat(BoundaryCodec.toApi(json)).hasSize(4);
        assertThat(BoundaryCodec.areaOf(json)).isBetween(12_000.0, 12_250.0);
        assertThat(BoundaryCodec.toApi(null)).isNull();
        assertThat(BoundaryCodec.toApi("not json")).isNull();
    }
}
