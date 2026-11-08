package com.farmely.farm.geo;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;

import java.util.ArrayList;
import java.util.List;

/**
 * Chuyển đổi ranh giới giữa API ({@code List<List<Double>>}, ring mở [lng, lat])
 * và cột TEXT trong DB (chuỗi GeoJSON Polygon chuẩn, ring đóng).
 *
 * <p>Lưu GeoJSON chuẩn để sau này có thể chuyển sang PostGIS bằng
 * {@code ST_GeomFromGeoJSON(boundary_geojson)} mà không phải đổi dữ liệu.</p>
 */
public final class BoundaryCodec {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    private BoundaryCodec() {
    }

    /** ring đã chuẩn hoá -> chuỗi GeoJSON Polygon */
    public static String toGeoJson(List<double[]> ring) {
        ObjectNode geometry = MAPPER.createObjectNode();
        geometry.put("type", "Polygon");
        ArrayNode rings = geometry.putArray("coordinates");
        ArrayNode outer = rings.addArray();
        for (List<Double> p : PolygonGeometry.toClosedCoordinates(ring)) {
            outer.addArray().add(p.get(0)).add(p.get(1));
        }
        try {
            return MAPPER.writeValueAsString(geometry);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Không thể ghi ranh giới GeoJSON", e);
        }
    }

    /**
     * chuỗi GeoJSON Polygon -> ring mở. Trả về {@code null} nếu chuỗi rỗng hoặc hỏng
     * (dữ liệu cũ không được làm sập API).
     */
    public static List<double[]> fromGeoJson(String json) {
        if (json == null || json.isBlank()) {
            return null;
        }
        try {
            JsonNode outer = MAPPER.readTree(json).path("coordinates").path(0);
            if (!outer.isArray() || outer.size() < 4) {
                return null;
            }
            List<double[]> ring = new ArrayList<>();
            for (JsonNode p : outer) {
                ring.add(new double[]{p.path(0).asDouble(), p.path(1).asDouble()});
            }
            ring.remove(ring.size() - 1); // bỏ điểm đóng
            return ring;
        } catch (JsonProcessingException e) {
            return null;
        }
    }

    /** chuỗi GeoJSON -> dạng trả về cho client (ring mở), null-safe */
    public static List<List<Double>> toApi(String json) {
        List<double[]> ring = fromGeoJson(json);
        return ring == null ? null : PolygonGeometry.toOpenCoordinates(ring);
    }

    /** diện tích (m², 2 chữ số thập phân) của chuỗi GeoJSON, null-safe */
    public static Double areaOf(String json) {
        List<double[]> ring = fromGeoJson(json);
        return ring == null ? null : Math.round(PolygonGeometry.areaM2(ring) * 100.0) / 100.0;
    }
}
