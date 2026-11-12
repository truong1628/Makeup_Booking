package com.bookingmakeup.service;

import com.bookingmakeup.common.exception.BadRequestException;
import com.bookingmakeup.common.exception.ResourceNotFoundException;
import com.bookingmakeup.dto.request.ComboItemRequest;
import com.bookingmakeup.dto.request.ServiceCreateRequest;
import com.bookingmakeup.dto.response.ComboItemResponse;
import com.bookingmakeup.dto.response.MakeupServiceResponse;
import com.bookingmakeup.entity.MakeupService;
import com.bookingmakeup.entity.ServiceCategory;
import com.bookingmakeup.entity.ServiceComboItem;
import com.bookingmakeup.repository.MakeupServiceRepository;
import com.bookingmakeup.repository.ServiceCategoryRepository;
import com.bookingmakeup.repository.ServiceComboItemRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service xử lý toàn bộ logic nghiệp vụ dịch vụ trang điểm đơn lẻ và gói combo (Makeup Service & Combo)
 * Xử lý tính toán thời lượng combo, định giá, sắp xếp ưu tiên Combo và giá từ thấp đến cao, cập nhật và xóa mềm dịch vụ.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MakeupServiceService {

    private final MakeupServiceRepository makeupServiceRepository;
    private final ServiceComboItemRepository serviceComboItemRepository;
    private final ServiceCategoryRepository serviceCategoryRepository;

    /**
     * Bộ sắp xếp chuẩn cho dịch vụ:
     * 1. Gói Combo (isCombo = true) hiển thị trước dịch vụ đơn lẻ (isCombo = false)
     * 2. Trong cùng nhóm (Combo hoặc Đơn lẻ), sắp xếp theo giá từ thấp đến cao (giá thấp hiện trước)
     * 3. Nếu bằng giá, sắp xếp theo ID tăng dần
     */
    private static final Comparator<MakeupService> COMBO_FIRST_PRICE_ASC_COMPARATOR = (a, b) -> {
        boolean comboA = Boolean.TRUE.equals(a.getIsCombo());
        boolean comboB = Boolean.TRUE.equals(b.getIsCombo());
        if (comboA != comboB) {
            return comboA ? -1 : 1;
        }
        BigDecimal priceA = a.getPrice() != null ? a.getPrice() : BigDecimal.ZERO;
        BigDecimal priceB = b.getPrice() != null ? b.getPrice() : BigDecimal.ZERO;
        int priceCmp = priceA.compareTo(priceB);
        if (priceCmp != 0) {
            return priceCmp;
        }
        Long idA = a.getId() != null ? a.getId() : 0L;
        Long idB = b.getId() != null ? b.getId() : 0L;
        return idA.compareTo(idB);
    };

    /**
     * Lấy danh sách các dịch vụ đang hoạt động phục vụ khách hàng đặt lịch
     * @param isCombo Tùy chọn lọc: true (chỉ combo), false (chỉ dịch vụ lẻ), null (lấy cả hai)
     */
    @Transactional(readOnly = true)
    public List<MakeupServiceResponse> getActiveServices(Boolean isCombo) {
        List<MakeupService> services;
        if (isCombo == null) {
            services = makeupServiceRepository.findByActiveTrue();
        } else if (isCombo) {
            services = makeupServiceRepository.findByActiveTrueAndIsComboTrue();
        } else {
            services = makeupServiceRepository.findByActiveTrueAndIsComboFalse();
        }

        return services.stream()
                .sorted(COMBO_FIRST_PRICE_ASC_COMPARATOR)
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Lấy danh sách toàn bộ các gói combo trang điểm đang hoạt động
     */
    @Transactional(readOnly = true)
    public List<MakeupServiceResponse> getActiveCombos() {
        List<MakeupService> combos = makeupServiceRepository.findByActiveTrueAndIsComboTrue();
        return combos.stream()
                .sorted(COMBO_FIRST_PRICE_ASC_COMPARATOR)
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Lấy thông tin chi tiết một dịch vụ hoặc gói combo theo ID (kèm danh sách dịch vụ con nếu là combo)
     */
    @Transactional(readOnly = true)
    public MakeupServiceResponse getServiceById(Long id) {
        MakeupService service = makeupServiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("MakeupService", "id", id));
        return mapToResponse(service);
    }

    /**
     * Tạo mới một dịch vụ trang điểm hoặc gói combo
     * Kiểm tra ràng buộc combo phải có ít nhất 1 dịch vụ con, không được lồng combo trong combo và tự động tính tổng thời lượng.
     */
    @Transactional
    public MakeupServiceResponse createService(ServiceCreateRequest request) {
        boolean isCombo = Boolean.TRUE.equals(request.getIsCombo());

        if (isCombo) {
            if (request.getComboItems() == null || request.getComboItems().isEmpty()) {
                throw new BadRequestException("Gói Combo bắt buộc phải có ít nhất 1 dịch vụ thành phần");
            }
        }

        int calculatedDuration = request.getDuration() != null ? request.getDuration() : 60;

        ServiceCategory category = null;
        if (request.getCategoryId() != null) {
            category = serviceCategoryRepository.findById(request.getCategoryId()).orElse(null);
        } else if (isCombo) {
            category = serviceCategoryRepository.findByCode("COMBO").orElse(null);
        }

        MakeupService service = MakeupService.builder()
                .serviceName(request.getServiceName().trim())
                .price(request.getPrice())
                .duration(calculatedDuration)
                .description(request.getDescription())
                .image(request.getImage())
                .isCombo(isCombo)
                .category(category)
                .active(true)
                .build();

        MakeupService savedService = makeupServiceRepository.save(service);

        List<ComboItemResponse> comboItemResponses = new ArrayList<>();

        if (isCombo) {
            int totalDuration = 0;
            for (ComboItemRequest itemReq : request.getComboItems()) {
                MakeupService childService = makeupServiceRepository.findById(itemReq.getServiceId())
                        .orElseThrow(() -> new ResourceNotFoundException("Dịch vụ thành phần", "id", itemReq.getServiceId()));

                if (!Boolean.TRUE.equals(childService.getActive())) {
                    throw new BadRequestException("Dịch vụ thành phần '" + childService.getServiceName() + "' hiện không hoạt động");
                }

                if (Boolean.TRUE.equals(childService.getIsCombo())) {
                    throw new BadRequestException("Không thể lồng gói combo bên trong một combo khác");
                }

                int quantity = itemReq.getQuantity() != null && itemReq.getQuantity() > 0 ? itemReq.getQuantity() : 1;
                totalDuration += childService.getDuration() * quantity;

                ServiceComboItem comboItem = ServiceComboItem.builder()
                        .comboService(savedService)
                        .itemService(childService)
                        .quantity(quantity)
                        .build();

                ServiceComboItem savedItem = serviceComboItemRepository.save(comboItem);

                BigDecimal subTotal = childService.getPrice().multiply(BigDecimal.valueOf(quantity));
                comboItemResponses.add(ComboItemResponse.builder()
                        .id(savedItem.getId())
                        .itemServiceId(childService.getId())
                        .itemServiceName(childService.getServiceName())
                        .unitPrice(childService.getPrice())
                        .duration(childService.getDuration())
                        .quantity(quantity)
                        .subTotal(subTotal)
                        .build());
            }

            if (request.getDuration() == null) {
                savedService.setDuration(totalDuration);
                savedService = makeupServiceRepository.save(savedService);
            }
        }

        log.info("Tạo thành công dịch vụ: {} [isCombo={}]", savedService.getServiceName(), isCombo);

        MakeupServiceResponse response = mapToResponse(savedService);
        if (isCombo) {
            response.setComboItems(comboItemResponses);
        }
        return response;
    }

    /**
     * Lấy toàn bộ danh sách dịch vụ trong hệ thống phục vụ trang quản trị Admin (bao gồm cả các dịch vụ đang tạm ẩn)
     */
    @Transactional(readOnly = true)
    public List<MakeupServiceResponse> getAllServicesForAdmin() {
        return makeupServiceRepository.findAll().stream()
                .sorted(COMBO_FIRST_PRICE_ASC_COMPARATOR)
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Bật hoặc tắt trạng thái hoạt động (Active/Inactive) của dịch vụ
     */
    @Transactional
    public MakeupServiceResponse toggleStatus(Long id) {
        MakeupService service = makeupServiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("MakeupService", "id", id));

        service.setActive(!Boolean.TRUE.equals(service.getActive()));
        MakeupService updated = makeupServiceRepository.save(service);
        log.info("Đổi trạng thái dịch vụ id {}: active={}", id, updated.getActive());
        return mapToResponse(updated);
    }

    /**
     * Cập nhật thông tin dịch vụ hoặc gói combo
     * Nếu là combo: xóa và cập nhật lại danh sách dịch vụ thành phần và tính toán lại thời lượng nếu cần.
     */
    @Transactional
    public MakeupServiceResponse updateService(Long id, ServiceCreateRequest request) {
        MakeupService service = makeupServiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("MakeupService", "id", id));

        service.setServiceName(request.getServiceName().trim());
        service.setPrice(request.getPrice());
        if (request.getDuration() != null) {
            service.setDuration(request.getDuration());
        }
        service.setDescription(request.getDescription());
        if (request.getImage() != null) {
            service.setImage(request.getImage());
        }
        if (request.getActive() != null) {
            service.setActive(request.getActive());
        }
        if (request.getCategoryId() != null) {
            ServiceCategory cat = serviceCategoryRepository.findById(request.getCategoryId()).orElse(null);
            service.setCategory(cat);
        }

        // Nếu là combo và có cập nhật danh sách món con
        if (Boolean.TRUE.equals(service.getIsCombo()) && request.getComboItems() != null) {
            serviceComboItemRepository.deleteByComboServiceId(id);

            int totalDuration = 0;
            for (ComboItemRequest itemReq : request.getComboItems()) {
                MakeupService childService = makeupServiceRepository.findById(itemReq.getServiceId())
                        .orElseThrow(() -> new ResourceNotFoundException("Dịch vụ thành phần", "id", itemReq.getServiceId()));

                int quantity = itemReq.getQuantity() != null && itemReq.getQuantity() > 0 ? itemReq.getQuantity() : 1;
                totalDuration += childService.getDuration() * quantity;

                ServiceComboItem comboItem = ServiceComboItem.builder()
                        .comboService(service)
                        .itemService(childService)
                        .quantity(quantity)
                        .build();

                serviceComboItemRepository.save(comboItem);
            }

            if (request.getDuration() == null) {
                service.setDuration(totalDuration);
            }
        }

        MakeupService updated = makeupServiceRepository.save(service);
        return mapToResponse(updated);
    }

    /**
     * Xóa mềm (Soft Delete) dịch vụ bằng cách chuyển trạng thái active = false để đảm bảo an toàn lịch sử đơn đặt lịch
     */
    @Transactional
    public void deleteService(Long id) {
        MakeupService service = makeupServiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("MakeupService", "id", id));

        service.setActive(false);
        makeupServiceRepository.save(service);
        log.info("Xóa mềm dịch vụ id: {}", id);
    }

    private MakeupServiceResponse mapToResponse(MakeupService service) {
        List<ComboItemResponse> comboItems = null;

        if (Boolean.TRUE.equals(service.getIsCombo())) {
            List<ServiceComboItem> items = serviceComboItemRepository.findByComboServiceId(service.getId());
            comboItems = items.stream().map(item -> {
                MakeupService child = item.getItemService();
                BigDecimal subTotal = child.getPrice().multiply(BigDecimal.valueOf(item.getQuantity()));
                return ComboItemResponse.builder()
                        .id(item.getId())
                        .itemServiceId(child.getId())
                        .itemServiceName(child.getServiceName())
                        .unitPrice(child.getPrice())
                        .duration(child.getDuration())
                        .quantity(item.getQuantity())
                        .subTotal(subTotal)
                        .build();
            }).collect(Collectors.toList());
        }

        return MakeupServiceResponse.builder()
                .id(service.getId())
                .serviceName(service.getServiceName())
                .price(service.getPrice())
                .duration(service.getDuration())
                .description(service.getDescription())
                .image(service.getImage())
                .isCombo(service.getIsCombo())
                .categoryId(service.getCategory() != null ? service.getCategory().getId() : null)
                .categoryName(service.getCategory() != null ? service.getCategory().getName() : null)
                .categoryCode(service.getCategory() != null ? service.getCategory().getCode() : null)
                .active(service.getActive())
                .createdAt(service.getCreatedAt())
                .updatedAt(service.getUpdatedAt())
                .comboItems(comboItems)
                .build();
    }
}
