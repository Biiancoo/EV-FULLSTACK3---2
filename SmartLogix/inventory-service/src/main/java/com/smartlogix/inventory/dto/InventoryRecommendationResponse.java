package com.smartlogix.inventory.dto;

import java.time.OffsetDateTime;

public record InventoryRecommendationResponse(
        String sku,
        String productName,
        String warehouseCode,
        int currentStock,
        int reservedStock,
        int reorderLevel,
        int recommendedQuantity,
        String urgency,
        String reason,
        OffsetDateTime generatedAt,
        String source
) {
}
