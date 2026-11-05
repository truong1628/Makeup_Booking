package com.bookingmakeup.service;

import com.bookingmakeup.common.exception.BadRequestException;
import com.bookingmakeup.common.exception.ResourceNotFoundException;
import com.bookingmakeup.dto.request.MakeupLayoutRequest;
import com.bookingmakeup.dto.response.MakeupLayoutResponse;
import com.bookingmakeup.entity.MakeupLayout;
import com.bookingmakeup.repository.MakeupLayoutRepository;
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
public class MakeupLayoutService {

    private final MakeupLayoutRepository makeupLayoutRepository;

    @Transactional(readOnly = true)
    public List<MakeupLayoutResponse> getActiveLayouts() {
        return makeupLayoutRepository.findByActiveTrueOrderByDisplayOrderAsc()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<MakeupLayoutResponse> getAllLayoutsForAdmin() {
        return makeupLayoutRepository.findAllByOrderByDisplayOrderAsc()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public MakeupLayoutResponse getLayoutById(Long id) {
        MakeupLayout layout = makeupLayoutRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phong cách makeup với ID: " + id));
        return mapToResponse(layout);
    }

    @Transactional
    public MakeupLayoutResponse createLayout(MakeupLayoutRequest request) {
        String code = request.getCode() != null && !request.getCode().isBlank()
                ? request.getCode().trim().toUpperCase(Locale.ROOT)
                : generateSlug(request.getName());

        if (makeupLayoutRepository.existsByCode(code)) {
            throw new BadRequestException("Mã phong cách (code) đã tồn tại: " + code);
        }

        MakeupLayout layout = MakeupLayout.builder()
                .name(request.getName().trim())
                .code(code)
                .description(request.getDescription())
                .suitableFor(request.getSuitableFor())
                .tag(request.getTag() != null ? request.getTag().trim() : "Mới")
                .gradient(request.getGradient() != null ? request.getGradient() : "from-pink-500/10 via-rose-500/5 to-white")
                .borderActive(request.getBorderActive() != null ? request.getBorderActive() : "border-pink-500 ring-2 ring-pink-500/20 bg-pink-50/40")
                .badgeClass(request.getBadgeClass() != null ? request.getBadgeClass() : "bg-pink-100 text-pink-700 border-pink-200")
                .category(request.getCategory() != null ? request.getCategory() : "Dự Tiệc")
                .searchKeyword(request.getSearchKeyword() != null ? request.getSearchKeyword() : "")
                .thumbnailUrl(request.getThumbnailUrl())
                .active(request.getActive() != null ? request.getActive() : true)
                .displayOrder(request.getDisplayOrder() != null ? request.getDisplayOrder() : 0)
                .build();

        MakeupLayout saved = makeupLayoutRepository.save(layout);
        log.info("Đã tạo mới phong cách makeup: {} ({})", saved.getName(), saved.getCode());
        return mapToResponse(saved);
    }

    @Transactional
    public MakeupLayoutResponse updateLayout(Long id, MakeupLayoutRequest request) {
        MakeupLayout layout = makeupLayoutRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phong cách makeup với ID: " + id));

        if (request.getCode() != null && !request.getCode().isBlank()) {
            String code = request.getCode().trim().toUpperCase(Locale.ROOT);
            if (makeupLayoutRepository.existsByCodeAndIdNot(code, id)) {
                throw new BadRequestException("Mã phong cách (code) đã tồn tại: " + code);
            }
            layout.setCode(code);
        }

        layout.setName(request.getName().trim());
        if (request.getDescription() != null) layout.setDescription(request.getDescription());
        if (request.getSuitableFor() != null) layout.setSuitableFor(request.getSuitableFor());
        if (request.getTag() != null) layout.setTag(request.getTag().trim());
        if (request.getGradient() != null) layout.setGradient(request.getGradient());
        if (request.getBorderActive() != null) layout.setBorderActive(request.getBorderActive());
        if (request.getBadgeClass() != null) layout.setBadgeClass(request.getBadgeClass());
        if (request.getCategory() != null) layout.setCategory(request.getCategory());
        if (request.getSearchKeyword() != null) layout.setSearchKeyword(request.getSearchKeyword());
        if (request.getThumbnailUrl() != null) layout.setThumbnailUrl(request.getThumbnailUrl());
        if (request.getActive() != null) layout.setActive(request.getActive());
        if (request.getDisplayOrder() != null) layout.setDisplayOrder(request.getDisplayOrder());

        MakeupLayout updated = makeupLayoutRepository.save(layout);
        log.info("Đã cập nhật phong cách makeup ID: {}", id);
        return mapToResponse(updated);
    }

    @Transactional
    public MakeupLayoutResponse toggleStatus(Long id) {
        MakeupLayout layout = makeupLayoutRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phong cách makeup với ID: " + id));

        layout.setActive(layout.getActive() == null || !layout.getActive());
        MakeupLayout saved = makeupLayoutRepository.save(layout);
        log.info("Đã đổi trạng thái phong cách makeup ID: {} sang {}", id, saved.getActive());
        return mapToResponse(saved);
    }

    @Transactional
    public void deleteLayout(Long id) {
        MakeupLayout layout = makeupLayoutRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phong cách makeup với ID: " + id));

        // Soft delete / hoặc xóa nếu chưa có liên kết
        makeupLayoutRepository.delete(layout);
        log.info("Đã xóa phong cách makeup ID: {}", id);
    }

    public MakeupLayoutResponse mapToResponse(MakeupLayout entity) {
        if (entity == null) return null;
        return MakeupLayoutResponse.builder()
                .id(entity.getId())
                .name(entity.getName())
                .code(entity.getCode())
                .description(entity.getDescription())
                .suitableFor(entity.getSuitableFor())
                .tag(entity.getTag())
                .gradient(entity.getGradient())
                .borderActive(entity.getBorderActive())
                .badgeClass(entity.getBadgeClass())
                .category(entity.getCategory())
                .searchKeyword(entity.getSearchKeyword())
                .thumbnailUrl(entity.getThumbnailUrl())
                .active(entity.getActive())
                .displayOrder(entity.getDisplayOrder())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    private String generateSlug(String input) {
        if (input == null || input.isBlank()) return "LAYOUT_" + System.currentTimeMillis();
        String nowhitespace = input.trim().replaceAll("\\s+", "_");
        String normalized = Normalizer.normalize(nowhitespace, Normalizer.Form.NFD);
        Pattern pattern = Pattern.compile("\\p{InCombiningDiacriticalMarks}+");
        return pattern.matcher(normalized).replaceAll("")
                .replaceAll("[^a-zA-Z0-9_]", "")
                .toUpperCase(Locale.ROOT);
    }
}
