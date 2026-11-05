package com.bookingmakeup.service;

import com.bookingmakeup.common.exception.BadRequestException;
import com.bookingmakeup.common.exception.ResourceNotFoundException;
import com.bookingmakeup.dto.request.ServiceCategoryRequest;
import com.bookingmakeup.dto.response.ServiceCategoryResponse;
import com.bookingmakeup.entity.ServiceCategory;
import com.bookingmakeup.repository.ServiceCategoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ServiceCategoryService {

    private final ServiceCategoryRepository serviceCategoryRepository;

    @Transactional(readOnly = true)
    public List<ServiceCategoryResponse> getActiveCategories() {
        return serviceCategoryRepository.findByActiveTrueOrderByDisplayOrderAsc()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ServiceCategoryResponse> getAllCategoriesForAdmin() {
        return serviceCategoryRepository.findAllByOrderByDisplayOrderAsc()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ServiceCategoryResponse getCategoryById(Long id) {
        ServiceCategory category = serviceCategoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy danh mục dịch vụ với ID: " + id));
        return mapToResponse(category);
    }

    @Transactional
    public ServiceCategoryResponse createCategory(ServiceCategoryRequest request) {
        String code = request.getCode() != null && !request.getCode().isBlank()
                ? request.getCode().trim().toUpperCase(Locale.ROOT)
                : generateSlug(request.getName());

        if (serviceCategoryRepository.existsByCode(code)) {
            throw new BadRequestException("Mã danh mục (code) đã tồn tại: " + code);
        }

        ServiceCategory category = ServiceCategory.builder()
                .name(request.getName().trim())
                .code(code)
                .icon(request.getIcon() != null ? request.getIcon().trim() : "Sparkles")
                .description(request.getDescription())
                .displayOrder(request.getDisplayOrder() != null ? request.getDisplayOrder() : 0)
                .active(request.getActive() != null ? request.getActive() : true)
                .build();

        ServiceCategory saved = serviceCategoryRepository.save(category);
        log.info("Đã tạo mới danh mục dịch vụ: {} ({})", saved.getName(), saved.getCode());
        return mapToResponse(saved);
    }

    @Transactional
    public ServiceCategoryResponse updateCategory(Long id, ServiceCategoryRequest request) {
        ServiceCategory category = serviceCategoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy danh mục dịch vụ với ID: " + id));

        if (request.getCode() != null && !request.getCode().isBlank()) {
            String code = request.getCode().trim().toUpperCase(Locale.ROOT);
            if (serviceCategoryRepository.existsByCodeAndIdNot(code, id)) {
                throw new BadRequestException("Mã danh mục (code) đã tồn tại: " + code);
            }
            category.setCode(code);
        }

        category.setName(request.getName().trim());
        if (request.getIcon() != null) category.setIcon(request.getIcon().trim());
        if (request.getDescription() != null) category.setDescription(request.getDescription());
        if (request.getDisplayOrder() != null) category.setDisplayOrder(request.getDisplayOrder());
        if (request.getActive() != null) category.setActive(request.getActive());

        ServiceCategory updated = serviceCategoryRepository.save(category);
        log.info("Đã cập nhật danh mục dịch vụ ID: {}", id);
        return mapToResponse(updated);
    }

    @Transactional
    public ServiceCategoryResponse toggleStatus(Long id) {
        ServiceCategory category = serviceCategoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy danh mục dịch vụ với ID: " + id));

        category.setActive(category.getActive() == null || !category.getActive());
        ServiceCategory saved = serviceCategoryRepository.save(category);
        log.info("Đã đổi trạng thái danh mục ID: {} sang {}", id, saved.getActive());
        return mapToResponse(saved);
    }

    @Transactional
    public void deleteCategory(Long id) {
        ServiceCategory category = serviceCategoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy danh mục dịch vụ với ID: " + id));

        if (category.getServices() != null && !category.getServices().isEmpty()) {
            throw new BadRequestException("Danh mục này đang có dịch vụ liên kết. Hãy chuyển các dịch vụ sang danh mục khác trước khi xóa!");
        }

        serviceCategoryRepository.delete(category);
        log.info("Đã xóa danh mục dịch vụ ID: {}", id);
    }

    public ServiceCategoryResponse mapToResponse(ServiceCategory entity) {
        if (entity == null) return null;
        int count = entity.getServices() != null ? entity.getServices().size() : 0;
        return ServiceCategoryResponse.builder()
                .id(entity.getId())
                .name(entity.getName())
                .code(entity.getCode())
                .icon(entity.getIcon())
                .description(entity.getDescription())
                .displayOrder(entity.getDisplayOrder())
                .active(entity.getActive())
                .serviceCount(count)
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    private String generateSlug(String input) {
        if (input == null || input.isBlank()) return "CAT_" + System.currentTimeMillis();
        String nowhitespace = input.trim().replaceAll("\\s+", "_");
        String normalized = Normalizer.normalize(nowhitespace, Normalizer.Form.NFD);
        Pattern pattern = Pattern.compile("\\p{InCombiningDiacriticalMarks}+");
        return pattern.matcher(normalized).replaceAll("")
                .replaceAll("[^a-zA-Z0-9_]", "")
                .toUpperCase(Locale.ROOT);
    }
}
