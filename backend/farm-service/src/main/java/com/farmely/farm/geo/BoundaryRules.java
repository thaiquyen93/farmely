package com.farmely.farm.geo;

import com.farmely.farm.entity.LandEntity;
import com.farmely.farm.entity.PlotEntity;
import com.farmely.farm.exception.BadRequestException;
import com.farmely.farm.exception.ConflictException;
import com.farmely.farm.repository.PlotRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

/**
 * Quy tắc nghiệp vụ cho ranh giới vẽ trên bản đồ:
 * <ul>
 *   <li>Ranh giới phải là đa giác hợp lệ (≥ 3 đỉnh, không tự cắt, diện tích ≥ 1 m²).</li>
 *   <li>Thửa đất phải nằm trọn trong ranh giới nông trại (nếu nông trại đã khoanh vùng).</li>
 *   <li>Hai thửa của cùng nông trại không được chồng lấn (chạm chung bờ thì được).</li>
 *   <li>Không được vẽ lại ranh giới nông trại làm lọt ra ngoài các thửa đã có.</li>
 * </ul>
 */
@Component
@RequiredArgsConstructor
public class BoundaryRules {

    private final PlotRepository plotRepository;

    /** Chuẩn hoá ranh giới từ request; ném BadRequest với thông điệp tiếng Việt nếu sai. */
    public List<double[]> parse(List<List<Double>> raw) {
        try {
            return PolygonGeometry.normalize(raw);
        } catch (IllegalArgumentException e) {
            throw new BadRequestException(e.getMessage());
        }
    }

    /** Ranh giới nông trại mới vẫn phải chứa mọi thửa đã khoanh vùng của nó. */
    public void checkLandStillContainsPlots(Integer landId, List<double[]> landRing) {
        if (landId == null) {
            return;
        }
        List<String> outside = new ArrayList<>();
        for (PlotEntity plot : plotRepository.findByLandId(landId)) {
            List<double[]> plotRing = BoundaryCodec.fromGeoJson(plot.getBoundaryGeojson());
            if (plotRing != null && !PolygonGeometry.contains(landRing, plotRing)) {
                outside.add(plot.getPlotCode());
            }
        }
        if (!outside.isEmpty()) {
            throw new BadRequestException("Ranh giới mới làm các thửa sau nằm ngoài nông trại: "
                    + String.join(", ", outside) + ". Hãy nới rộng ranh giới hoặc vẽ lại các thửa đó trước.");
        }
    }

    /** Thửa nằm trong nông trại và không chồng lấn thửa khác cùng nông trại. */
    public void checkPlotFits(LandEntity land, Integer selfPlotId, List<double[]> plotRing) {
        List<double[]> landRing = BoundaryCodec.fromGeoJson(land.getBoundaryGeojson());
        if (landRing != null && !PolygonGeometry.contains(landRing, plotRing)) {
            throw new BadRequestException("Thửa đất phải nằm trọn trong ranh giới của nông trại \""
                    + land.getLandName() + "\".");
        }
        List<String> clashes = new ArrayList<>();
        for (PlotEntity other : plotRepository.findByLandId(land.getLandId())) {
            if (Objects.equals(other.getPlotId(), selfPlotId)) {
                continue;
            }
            List<double[]> otherRing = BoundaryCodec.fromGeoJson(other.getBoundaryGeojson());
            if (otherRing != null && PolygonGeometry.overlaps(plotRing, otherRing)) {
                clashes.add(other.getPlotCode());
            }
        }
        if (!clashes.isEmpty()) {
            throw new ConflictException("Ranh giới đang chồng lấn lên thửa: " + String.join(", ", clashes)
                    + ". Hai thửa chỉ được chạm chung bờ, không được đè lên nhau.");
        }
    }
}
