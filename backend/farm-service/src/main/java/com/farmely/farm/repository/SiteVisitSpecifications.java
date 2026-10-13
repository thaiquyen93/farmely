package com.farmely.farm.repository;

import com.farmely.farm.constant.VisitStatus;
import com.farmely.farm.entity.SiteVisitEntity;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public class SiteVisitSpecifications {

    public static Specification<SiteVisitEntity> withFilters(Integer plotId, LocalDate visitDate, VisitStatus status, String phone) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (plotId != null) {
                predicates.add(cb.equal(root.get("plotId"), plotId));
            }

            if (visitDate != null) {
                predicates.add(cb.equal(root.get("visitDate"), visitDate));
            }

            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }

            if (phone != null && !phone.trim().isEmpty()) {
                predicates.add(cb.like(root.get("visitorPhone"), "%" + phone.trim() + "%"));
            }

            if (query != null) {
                query.orderBy(cb.asc(root.get("visitDate")), cb.desc(root.get("createdAt")));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
