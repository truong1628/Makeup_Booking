package com.bookingmakeup.service;

import com.bookingmakeup.common.exception.BadRequestException;
import com.bookingmakeup.common.exception.ResourceNotFoundException;
import com.bookingmakeup.dto.request.ComboItemRequest;
import com.bookingmakeup.dto.request.ServiceCreateRequest;
import com.bookingmakeup.dto.response.ComboItemResponse;
import com.bookingmakeup.dto.response.MakeupServiceResponse;
import com.bookingmakeup.entity.MakeupService;
import com.bookingmakeup.entity.ServiceComboItem;
import com.bookingmakeup.repository.MakeupServiceRepository;
import com.bookingmakeup.repository.ServiceComboItemRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class MakeupServiceService {

    private final MakeupServiceRepository makeupServiceRepository;
    private final ServiceComboItemRepository serviceComboItemRepository;

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
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<MakeupServiceResponse> getActiveCombos() {
        List<MakeupService> combos = makeupServiceRepository.findByActiveTrueAndIsComboTrue();
        return combos.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public MakeupServiceResponse getServiceById(Long id) {
        MakeupService service = makeupServiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("MakeupService", "id", id));
        return mapToResponse(service);
    }

    @Transactional
    public MakeupServiceResponse createService(ServiceCreateRequest request) {
        boolean isCombo = Boolean.TRUE.equals(request.getIsCombo());

        if (isCombo) {
            if (request.getComboItems() == null || request.getComboItems().isEmpty()) {
                throw new BadRequestException("Gói Combo bắt buộc phải có ít nhất 1 dịch vụ thành phần");
            }
        }

        int calculatedDuration = request.getDuration() != null ? request.getDuration() : 60;

        MakeupService service = MakeupService.builder()
                .serviceName(request.getServiceName().trim())
                .price(request.getPrice())
                .duration(calculatedDuration)
                .description(request.getDescription())
                .image(request.getImage())
                .isCombo(isCombo)
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

    @Transactional(readOnly = true)
    public List<MakeupServiceResponse> getAllServicesForAdmin() {
        return makeupServiceRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public MakeupServiceResponse toggleStatus(Long id) {
        MakeupService service = makeupServiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("MakeupService", "id", id));

        service.setActive(!Boolean.TRUE.equals(service.getActive()));
        MakeupService updated = makeupServiceRepository.save(service);
        log.info("Đổi trạng thái dịch vụ id {}: active={}", id, updated.getActive());
        return mapToResponse(updated);
    }

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
                .active(service.getActive())
                .createdAt(service.getCreatedAt())
                .updatedAt(service.getUpdatedAt())
                .comboItems(comboItems)
                .build();
    }
}
