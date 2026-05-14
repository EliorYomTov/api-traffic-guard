package com.trafficguard.repository;

import com.trafficguard.domain.ApiKey;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ApiKeyRepository extends JpaRepository<ApiKey, Long> {

    @Query("SELECT ak FROM ApiKey ak JOIN FETCH ak.tenant WHERE ak.keyHash = :hash AND ak.revokedAt IS NULL")
    Optional<ApiKey> findByKeyHashAndRevokedAtIsNull(@Param("hash") String keyHash);

    List<ApiKey> findAllByTenantIdOrderByCreatedAtDesc(Long tenantId);
}