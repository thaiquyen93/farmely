package com.smartagrirent.payment.repository;

import com.smartagrirent.payment.entity.PaymentTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentTransactionRepository extends JpaRepository<PaymentTransaction, Integer> {
    List<PaymentTransaction> findByContractId(Integer contractId);
    Optional<PaymentTransaction> findByGatewayRef(String gatewayRef);
    List<PaymentTransaction> findAllByOrderByCreatedAtDesc();
}
