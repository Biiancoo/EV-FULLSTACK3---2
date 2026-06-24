package com.smartlogix.inventory.service;

import com.smartlogix.inventory.domain.InventoryItem;
import com.smartlogix.inventory.dto.CreateInventoryItemRequest;
import com.smartlogix.inventory.dto.InventoryAvailabilityResponse;
import com.smartlogix.inventory.dto.InventoryItemResponse;
import com.smartlogix.inventory.dto.InventoryRecommendationResponse;
import com.smartlogix.inventory.exception.InventoryNotFoundException;
import com.smartlogix.inventory.exception.InventoryOperationException;
import com.smartlogix.inventory.repository.InventoryItemRepository;
import java.util.Comparator;
import java.util.List;
import java.time.OffsetDateTime;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class InventoryService {

    private final InventoryItemRepository repository;

    public InventoryService(InventoryItemRepository repository) {
        this.repository = repository;
    }

    public InventoryItemResponse createItem(CreateInventoryItemRequest request) {
        if (repository.existsBySku(request.sku())) {
            throw new InventoryOperationException("El SKU ya existe: " + request.sku());
        }

        InventoryItem item = new InventoryItem();
        item.setSku(request.sku().trim().toUpperCase());
        item.setProductName(request.productName().trim());
        item.setWarehouseCode(request.warehouseCode().trim().toUpperCase());
        item.setAvailableQuantity(request.initialQuantity());
        item.setReservedQuantity(0);
        item.setReorderLevel(request.reorderLevel());

        return toResponse(repository.save(item));
    }

    @Transactional(readOnly = true)
    public List<InventoryItemResponse> findAll() {
        return repository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public InventoryItemResponse findBySku(String sku) {
        InventoryItem item = loadBySku(sku);
        return toResponse(item);
    }

    @Transactional(readOnly = true)
    public InventoryAvailabilityResponse checkAvailability(String sku, int quantity) {
        InventoryItem item = loadBySku(sku);
        boolean available = item.getAvailableQuantity() >= quantity;
        return new InventoryAvailabilityResponse(
                item.getSku(),
                quantity,
                item.getAvailableQuantity(),
                available
        );
    }

    public InventoryItemResponse reserve(String sku, int quantity) {
        InventoryItem item = loadBySku(sku);
        if (quantity <= 0) {
            throw new InventoryOperationException("La cantidad debe ser mayor a 0.");
        }
        if (item.getAvailableQuantity() < quantity) {
            throw new InventoryOperationException(
                    "Stock insuficiente para SKU " + sku + ". Disponible: " + item.getAvailableQuantity());
        }

        item.setAvailableQuantity(item.getAvailableQuantity() - quantity);
        item.setReservedQuantity(item.getReservedQuantity() + quantity);

        return toResponse(repository.save(item));
    }

    public InventoryItemResponse release(String sku, int quantity) {
        InventoryItem item = loadBySku(sku);
        if (quantity <= 0) {
            throw new InventoryOperationException("La cantidad debe ser mayor a 0.");
        }
        if (item.getReservedQuantity() < quantity) {
            throw new InventoryOperationException(
                    "No hay suficiente stock reservado para liberar en SKU " + sku);
        }

        item.setReservedQuantity(item.getReservedQuantity() - quantity);
        item.setAvailableQuantity(item.getAvailableQuantity() + quantity);

        return toResponse(repository.save(item));
    }

    public InventoryItemResponse dispatch(String sku, int quantity) {
        InventoryItem item = loadBySku(sku);
        if (quantity <= 0) {
            throw new InventoryOperationException("La cantidad debe ser mayor a 0.");
        }
        if (item.getReservedQuantity() < quantity) {
            throw new InventoryOperationException(
                    "No hay stock reservado suficiente para despachar SKU " + sku);
        }

        item.setReservedQuantity(item.getReservedQuantity() - quantity);
        return toResponse(repository.save(item));
    }

    private InventoryItem loadBySku(String sku) {
        return repository.findBySku(sku.trim().toUpperCase())
                .orElseThrow(() -> new InventoryNotFoundException("No existe inventario para SKU: " + sku));
    }

    private InventoryItemResponse toResponse(InventoryItem item) {
        return new InventoryItemResponse(
                item.getSku(),
                item.getProductName(),
                item.getWarehouseCode(),
                item.getAvailableQuantity(),
                item.getReservedQuantity(),
                item.getReorderLevel(),
                item.getUpdatedAt()
        );
    }

    @Transactional(readOnly = true)
    public List<InventoryRecommendationResponse> getRecommendations() {
        return repository.findAll().stream()
                .map(this::toRecommendation)
                .sorted(Comparator.comparing(InventoryRecommendationResponse::urgency,
                        Comparator.comparingInt(this::urgencyPriority)))
                .toList();
    }

    private int urgencyPriority(String urgency) {
        return switch (urgency) {
            case "CRITICAL" -> 0;
            case "HIGH" -> 1;
            case "MEDIUM" -> 2;
            case "LOW" -> 3;
            default -> 4;
        };
    }

    private InventoryRecommendationResponse toRecommendation(InventoryItem item) {
        int available = item.getAvailableQuantity();
        int reserved = item.getReservedQuantity();
        int reorder = item.getReorderLevel();
        int effectiveStock = available - reserved;

        String urgency;
        int recommended;
        String reason;

        if (available <= reorder) {
            urgency = "CRITICAL";
            recommended = Math.max(reorder * 3 - available, reorder);
            reason = "Stock disponible (" + available + ") es igual o menor al nivel de reorden (" + reorder + "). Reorden urgente requerida.";
        } else if (available <= reorder * 2) {
            urgency = "HIGH";
            recommended = Math.max(reorder * 2 - available, reorder);
            reason = "Stock disponible (" + available + ") está por debajo del doble del nivel de reorden (" + (reorder * 2) + "). Se recomienda reabastecer pronto.";
        } else if (reserved > available * 0.5) {
            urgency = "MEDIUM";
            recommended = reorder;
            reason = "Más del 50% del stock disponible (" + available + ") está reservado (" + reserved + "). Reabastecimiento preventivo sugerido.";
        } else {
            urgency = "LOW";
            recommended = Math.max(reorder / 2, 1);
            reason = "Niveles de stock saludables. Reorden preventivo menor para mantener buffer óptimo.";
        }

        return new InventoryRecommendationResponse(
                item.getSku(),
                item.getProductName(),
                item.getWarehouseCode(),
                available,
                reserved,
                reorder,
                recommended,
                urgency,
                reason,
                OffsetDateTime.now(),
                "RULES"
        );
    }
}
