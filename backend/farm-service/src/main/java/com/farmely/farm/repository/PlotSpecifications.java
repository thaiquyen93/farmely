package com.farmely.farm.repository;

import com.farmely.farm.constant.PlotStatus;
import com.farmely.farm.dto.PlotFilterCriteria;
import com.farmely.farm.entity.PlotEntity;
import com.farmely.farm.entity.PlotVarietyCompatibilityEntity;
import com.farmely.farm.entity.VarietyReferenceEntity;
import jakarta.persistence.criteria.*;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

public class PlotSpecifications {

    public static Specification<PlotEntity> withCriteria(PlotFilterCriteria criteria) {
        return (root, query, cb) -> {
            if (query != null) {
                query.distinct(true);
            }
            List<Predicate> predicates = new ArrayList<>();

            if (criteria.getLandId() != null) {
                predicates.add(cb.equal(root.get("landId"), criteria.getLandId()));
            }

            if (criteria.getStatus() != null) {
                predicates.add(cb.equal(root.get("status"), criteria.getStatus()));
            }

            if (criteria.getIsPublished() != null) {
                predicates.add(cb.equal(root.get("isPublished"), criteria.getIsPublished()));
            }

            if (criteria.getMinArea() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("area"), criteria.getMinArea()));
            }

            if (criteria.getMaxArea() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("area"), criteria.getMaxArea()));
            }

            if (criteria.getMaxPrice() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("pricePerPeriod"), criteria.getMaxPrice()));
            }

            if (criteria.getSearch() != null && !criteria.getSearch().trim().isEmpty()) {
                String pattern = "%" + criteria.getSearch().trim().toLowerCase() + "%";
                predicates.add(cb.like(cb.lower(root.get("plotCode")), pattern));
            }

            if (criteria.getCropId() != null || criteria.getVarietyId() != null) {
                Root<PlotVarietyCompatibilityEntity> compatRoot = query.from(PlotVarietyCompatibilityEntity.class);
                predicates.add(cb.equal(root.get("plotId"), compatRoot.get("id").get("plotId")));

                if (criteria.getVarietyId() != null) {
                    predicates.add(cb.equal(compatRoot.get("id").get("varietyId"), criteria.getVarietyId()));
                }

                if (criteria.getCropId() != null) {
                    Root<VarietyReferenceEntity> varietyRoot = query.from(VarietyReferenceEntity.class);
                    predicates.add(cb.equal(compatRoot.get("id").get("varietyId"), varietyRoot.get("varietyId")));
                    predicates.add(cb.equal(varietyRoot.get("cropId"), criteria.getCropId()));
                }
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    public static Specification<PlotEntity> marketplace(Integer landId, Integer cropId, BigDecimal minArea, BigDecimal maxArea, BigDecimal maxPrice) {
        return (root, query, cb) -> {
            if (query != null) {
                query.distinct(true);
            }
            List<Predicate> predicates = new ArrayList<>();

            predicates.add(cb.equal(root.get("status"), PlotStatus.AVAIL));
            predicates.add(cb.isTrue(root.get("isPublished")));

            if (landId != null) {
                predicates.add(cb.equal(root.get("landId"), landId));
            }

            if (minArea != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("area"), minArea));
            }

            if (maxArea != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("area"), maxArea));
            }

            if (maxPrice != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("pricePerPeriod"), maxPrice));
            }

            if (cropId != null) {
                Root<PlotVarietyCompatibilityEntity> compatRoot = query.from(PlotVarietyCompatibilityEntity.class);
                Root<VarietyReferenceEntity> varietyRoot = query.from(VarietyReferenceEntity.class);
                predicates.add(cb.equal(root.get("plotId"), compatRoot.get("id").get("plotId")));
                predicates.add(cb.equal(compatRoot.get("id").get("varietyId"), varietyRoot.get("varietyId")));
                predicates.add(cb.equal(varietyRoot.get("cropId"), cropId));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
