package com.farmely.farm.geo;

import java.util.ArrayList;
import java.util.List;

/**
 * Hình học đa giác cho ranh giới nông trại / thửa đất.
 *
 * <p>Toạ độ theo chuẩn GeoJSON: mỗi điểm là {@code [lng, lat]} (WGS84).
 * Một "ring" là danh sách đỉnh MỞ (không lặp lại điểm đầu ở cuối) — {@link #normalize}
 * nhận cả ring đóng lẫn mở và luôn trả về ring mở.</p>
 *
 * <p>Diện tích tính theo công thức cầu (giống turf.js) nên chính xác cho mảnh đất vài
 * chục ha. Các phép kiểm tra giao/chứa làm trên mặt phẳng lng/lat — đủ chính xác ở quy
 * mô một nông trại. Điểm nằm ĐÚNG trên cạnh được coi là "chạm", không phải "chồng lấn",
 * để hai thửa liền kề dùng chung một bờ ruộng vẫn hợp lệ.</p>
 */
public final class PolygonGeometry {

    /** Bán kính Trái Đất WGS84 (m) — cùng hằng số với turf.js */
    public static final double EARTH_RADIUS_M = 6_378_137.0;
    public static final int MAX_VERTICES = 1000;
    /** Sai số so sánh toạ độ (độ) ≈ 1 cm ở xích đạo */
    private static final double EPS = 1e-7;

    private PolygonGeometry() {
    }

    /**
     * Chuẩn hoá & kiểm tra 1 ring.
     *
     * @return ring mở, đã bỏ các điểm trùng liên tiếp
     * @throws IllegalArgumentException kèm thông điệp tiếng Việt nếu ring không hợp lệ
     */
    public static List<double[]> normalize(List<List<Double>> raw) {
        if (raw == null) {
            throw new IllegalArgumentException("Ranh giới không được để trống.");
        }
        List<double[]> ring = new ArrayList<>();
        for (List<Double> p : raw) {
            if (p == null || p.size() < 2 || p.get(0) == null || p.get(1) == null) {
                throw new IllegalArgumentException("Mỗi đỉnh của ranh giới phải có dạng [kinh độ, vĩ độ].");
            }
            double lng = p.get(0);
            double lat = p.get(1);
            if (!Double.isFinite(lng) || !Double.isFinite(lat) || lng < -180 || lng > 180 || lat < -90 || lat > 90) {
                throw new IllegalArgumentException("Toạ độ không hợp lệ: [" + lng + ", " + lat + "].");
            }
            double[] pt = {lng, lat};
            if (ring.isEmpty() || !samePoint(ring.get(ring.size() - 1), pt)) {
                ring.add(pt);
            }
        }
        if (ring.size() > 1 && samePoint(ring.get(0), ring.get(ring.size() - 1))) {
            ring.remove(ring.size() - 1);
        }
        if (ring.size() < 3) {
            throw new IllegalArgumentException("Ranh giới cần ít nhất 3 đỉnh khác nhau.");
        }
        if (ring.size() > MAX_VERTICES) {
            throw new IllegalArgumentException("Ranh giới có quá nhiều đỉnh (tối đa " + MAX_VERTICES + ").");
        }
        if (!isSimple(ring)) {
            throw new IllegalArgumentException("Ranh giới tự cắt chính nó. Vui lòng vẽ lại sao cho các cạnh không cắt nhau.");
        }
        if (areaM2(ring) < 1.0) {
            throw new IllegalArgumentException("Diện tích vùng vẽ quá nhỏ (dưới 1 m²).");
        }
        return ring;
    }

    /** Diện tích (m²) theo công thức cầu, luôn dương. */
    public static double areaM2(List<double[]> ring) {
        int n = ring.size();
        if (n < 3) {
            return 0;
        }
        double total = 0;
        for (int i = 0; i < n; i++) {
            double[] p1 = ring.get(i);
            double[] p2 = ring.get((i + 1) % n);
            total += Math.toRadians(p2[0] - p1[0])
                    * (2 + Math.sin(Math.toRadians(p1[1])) + Math.sin(Math.toRadians(p2[1])));
        }
        return Math.abs(total * EARTH_RADIUS_M * EARTH_RADIUS_M / 2.0);
    }

    /** Không có hai cạnh không kề nhau nào cắt/chạm nhau. */
    public static boolean isSimple(List<double[]> ring) {
        int n = ring.size();
        for (int i = 0; i < n; i++) {
            double[] a1 = ring.get(i);
            double[] a2 = ring.get((i + 1) % n);
            for (int j = i + 1; j < n; j++) {
                // bỏ qua cạnh kề (chung 1 đỉnh)
                if (j == i + 1 || (i == 0 && j == n - 1)) {
                    continue;
                }
                double[] b1 = ring.get(j);
                double[] b2 = ring.get((j + 1) % n);
                if (segmentsTouch(a1, a2, b1, b2)) {
                    return false;
                }
            }
        }
        return true;
    }

    /**
     * {@code inner} nằm trọn trong {@code outer} (cho phép chạm cạnh — thửa sát hàng rào).
     */
    public static boolean contains(List<double[]> outer, List<double[]> inner) {
        if (anyProperCrossing(outer, inner)) {
            return false;
        }
        for (double[] p : inner) {
            if (!onBoundary(p, outer) && !pointInRing(p, outer)) {
                return false;
            }
        }
        double[] sample = interiorPoint(inner);
        return onBoundary(sample, outer) || pointInRing(sample, outer);
    }

    /**
     * Hai vùng có phần diện tích chung (chỉ chạm cạnh/đỉnh thì KHÔNG tính là chồng lấn).
     */
    public static boolean overlaps(List<double[]> a, List<double[]> b) {
        if (!bboxIntersects(a, b)) {
            return false;
        }
        if (anyProperCrossing(a, b)) {
            return true;
        }
        for (double[] p : a) {
            if (strictlyInside(p, b)) {
                return true;
            }
        }
        for (double[] p : b) {
            if (strictlyInside(p, a)) {
                return true;
            }
        }
        // Trường hợp hai vùng trùng khít (mọi đỉnh nằm trên biên của nhau)
        return strictlyInside(interiorPoint(a), b) || strictlyInside(interiorPoint(b), a);
    }

    /** Ring đóng theo GeoJSON (điểm đầu lặp lại ở cuối). */
    public static List<List<Double>> toClosedCoordinates(List<double[]> ring) {
        List<List<Double>> out = new ArrayList<>(ring.size() + 1);
        for (double[] p : ring) {
            out.add(List.of(p[0], p[1]));
        }
        out.add(List.of(ring.get(0)[0], ring.get(0)[1]));
        return out;
    }

    /** Ring mở dạng List<List<Double>> để trả về cho client. */
    public static List<List<Double>> toOpenCoordinates(List<double[]> ring) {
        List<List<Double>> out = new ArrayList<>(ring.size());
        for (double[] p : ring) {
            out.add(List.of(p[0], p[1]));
        }
        return out;
    }

    // ───────────────────────────── nội bộ ─────────────────────────────

    private static boolean samePoint(double[] a, double[] b) {
        return Math.abs(a[0] - b[0]) < EPS && Math.abs(a[1] - b[1]) < EPS;
    }

    private static double cross(double[] o, double[] a, double[] b) {
        return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    }

    private static int orient(double[] o, double[] a, double[] b) {
        double c = cross(o, a, b);
        // chuẩn hoá theo độ dài cạnh để EPS mang nghĩa khoảng cách
        double len = Math.hypot(a[0] - o[0], a[1] - o[1]);
        double d = len == 0 ? 0 : c / len;
        if (d > EPS) {
            return 1;
        }
        if (d < -EPS) {
            return -1;
        }
        return 0;
    }

    private static boolean onSegment(double[] p, double[] a, double[] b) {
        return Math.min(a[0], b[0]) - EPS <= p[0] && p[0] <= Math.max(a[0], b[0]) + EPS
                && Math.min(a[1], b[1]) - EPS <= p[1] && p[1] <= Math.max(a[1], b[1]) + EPS;
    }

    /** Cắt nhau hoặc chạm nhau (dùng cho kiểm tra tự cắt). */
    private static boolean segmentsTouch(double[] a1, double[] a2, double[] b1, double[] b2) {
        int o1 = orient(a1, a2, b1);
        int o2 = orient(a1, a2, b2);
        int o3 = orient(b1, b2, a1);
        int o4 = orient(b1, b2, a2);
        if (o1 != o2 && o3 != o4 && o1 != 0 && o2 != 0 && o3 != 0 && o4 != 0) {
            return true;
        }
        return (o1 == 0 && onSegment(b1, a1, a2)) || (o2 == 0 && onSegment(b2, a1, a2))
                || (o3 == 0 && onSegment(a1, b1, b2)) || (o4 == 0 && onSegment(a2, b1, b2));
    }

    /** Cắt ngang thực sự (không tính chạm đầu mút / trùng cạnh). */
    private static boolean properCross(double[] a1, double[] a2, double[] b1, double[] b2) {
        int o1 = orient(a1, a2, b1);
        int o2 = orient(a1, a2, b2);
        int o3 = orient(b1, b2, a1);
        int o4 = orient(b1, b2, a2);
        return o1 * o2 < 0 && o3 * o4 < 0;
    }

    private static boolean anyProperCrossing(List<double[]> a, List<double[]> b) {
        for (int i = 0; i < a.size(); i++) {
            double[] a1 = a.get(i);
            double[] a2 = a.get((i + 1) % a.size());
            for (int j = 0; j < b.size(); j++) {
                if (properCross(a1, a2, b.get(j), b.get((j + 1) % b.size()))) {
                    return true;
                }
            }
        }
        return false;
    }

    private static boolean onBoundary(double[] p, List<double[]> ring) {
        for (int i = 0; i < ring.size(); i++) {
            double[] a = ring.get(i);
            double[] b = ring.get((i + 1) % ring.size());
            if (orient(a, b, p) == 0 && onSegment(p, a, b)) {
                return true;
            }
        }
        return false;
    }

    /** Ray casting — kết quả không xác định nếu p nằm trên biên (hãy gọi onBoundary trước). */
    private static boolean pointInRing(double[] p, List<double[]> ring) {
        boolean inside = false;
        for (int i = 0, j = ring.size() - 1; i < ring.size(); j = i++) {
            double[] pi = ring.get(i);
            double[] pj = ring.get(j);
            if ((pi[1] > p[1]) != (pj[1] > p[1])
                    && p[0] < (pj[0] - pi[0]) * (p[1] - pi[1]) / (pj[1] - pi[1]) + pi[0]) {
                inside = !inside;
            }
        }
        return inside;
    }

    private static boolean strictlyInside(double[] p, List<double[]> ring) {
        return !onBoundary(p, ring) && pointInRing(p, ring);
    }

    /**
     * Một điểm chắc chắn nằm TRONG đa giác (trọng tâm nếu nằm trong, nếu không thì
     * dò theo đường ngang qua trọng tâm — đúng cả với đa giác lõm).
     */
    static double[] interiorPoint(List<double[]> ring) {
        double cx = 0;
        double cy = 0;
        for (double[] p : ring) {
            cx += p[0];
            cy += p[1];
        }
        double[] c = {cx / ring.size(), cy / ring.size()};
        if (strictlyInside(c, ring)) {
            return c;
        }
        List<Double> xs = new ArrayList<>();
        for (int i = 0, j = ring.size() - 1; i < ring.size(); j = i++) {
            double[] pi = ring.get(i);
            double[] pj = ring.get(j);
            if ((pi[1] > c[1]) != (pj[1] > c[1])) {
                xs.add((pj[0] - pi[0]) * (c[1] - pi[1]) / (pj[1] - pi[1]) + pi[0]);
            }
        }
        xs.sort(Double::compare);
        for (int k = 0; k + 1 < xs.size(); k += 2) {
            double[] m = {(xs.get(k) + xs.get(k + 1)) / 2.0, c[1]};
            if (strictlyInside(m, ring)) {
                return m;
            }
        }
        return ring.get(0);
    }

    private static boolean bboxIntersects(List<double[]> a, List<double[]> b) {
        double[] ba = bbox(a);
        double[] bb = bbox(b);
        return ba[0] <= bb[2] + EPS && bb[0] <= ba[2] + EPS && ba[1] <= bb[3] + EPS && bb[1] <= ba[3] + EPS;
    }

    private static double[] bbox(List<double[]> ring) {
        double[] r = {Double.MAX_VALUE, Double.MAX_VALUE, -Double.MAX_VALUE, -Double.MAX_VALUE};
        for (double[] p : ring) {
            r[0] = Math.min(r[0], p[0]);
            r[1] = Math.min(r[1], p[1]);
            r[2] = Math.max(r[2], p[0]);
            r[3] = Math.max(r[3], p[1]);
        }
        return r;
    }
}
