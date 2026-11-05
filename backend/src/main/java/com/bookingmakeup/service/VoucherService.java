package com.bookingmakeup.service;

import com.bookingmakeup.common.exception.BadRequestException;
import com.bookingmakeup.common.exception.ResourceNotFoundException;
import com.bookingmakeup.dto.request.UserVoucherAssignRequest;
import com.bookingmakeup.dto.request.VoucherApplyRequest;
import com.bookingmakeup.dto.request.VoucherRequest;
import com.bookingmakeup.dto.response.CustomerTierInfo;
import com.bookingmakeup.dto.response.UserVoucherSummaryResponse;
import com.bookingmakeup.dto.response.VoucherApplyResponse;
import com.bookingmakeup.dto.response.VoucherResponse;
import com.bookingmakeup.entity.Booking;
import com.bookingmakeup.entity.User;
import com.bookingmakeup.entity.UserVoucher;
import com.bookingmakeup.entity.Voucher;
import com.bookingmakeup.enums.BookingStatus;
import com.bookingmakeup.enums.CustomerTier;
import com.bookingmakeup.enums.DiscountType;
import com.bookingmakeup.enums.VoucherScope;
import com.bookingmakeup.repository.BookingRepository;
import com.bookingmakeup.repository.UserRepository;
import com.bookingmakeup.repository.UserVoucherRepository;
import com.bookingmakeup.repository.VoucherRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class VoucherService {

    private final VoucherRepository voucherRepository;
    private final UserVoucherRepository userVoucherRepository;
    private final UserRepository userRepository;
    private final BookingRepository bookingRepository;

    @Transactional(readOnly = true)
    public List<VoucherResponse> getActiveVouchers() {
        return voucherRepository.findAvailablePublicVouchers(LocalDateTime.now())
                .stream()
                .map(VoucherResponse::fromEntity)
                .toList();
    }

    /**
     * Lấy tóm tắt ví voucher cá nhân + voucher công khai + hạng thành viên cho khách hàng đã đăng nhập
     */
    @Transactional(readOnly = true)
    public UserVoucherSummaryResponse getUserVoucherSummary(Long userId) {
        CustomerTierInfo tierInfo = determineCustomerTier(userId);

        // 1. Lấy danh sách voucher cá nhân trong ví riêng của user
        List<VoucherResponse> personalVouchers = new ArrayList<>();
        if (userId != null) {
            List<UserVoucher> uvList = userVoucherRepository.findByUserIdAndIsUsedFalse(userId);
            LocalDateTime now = LocalDateTime.now();
            for (UserVoucher uv : uvList) {
                Voucher v = uv.getVoucher();
                if (Boolean.TRUE.equals(v.getActive())) {
                    VoucherResponse resp = VoucherResponse.fromEntity(v);
                    resp.setIsPersonal(true);
                    resp.setNote(uv.getNote());
                    boolean dateValid = (v.getStartDate() == null || !now.isBefore(v.getStartDate())) &&
                                        (v.getEndDate() == null || !now.isAfter(v.getEndDate()));
                    resp.setCanApply(dateValid);
                    if (!dateValid) {
                        resp.setReasonIfNotApplicable("Voucher trong ví đã hết hạn sử dụng");
                    }
                    personalVouchers.add(resp);
                }
            }
        }

        // 2. Lấy danh sách voucher công khai và đánh giá điều kiện theo từng người dùng
        List<Voucher> publicEntities = voucherRepository.findAvailablePublicVouchers(LocalDateTime.now());
        List<VoucherResponse> publicVouchers = new ArrayList<>();

        for (Voucher v : publicEntities) {
            VoucherResponse resp = VoucherResponse.fromEntity(v);
            resp.setIsPersonal(false);

            if (userId != null) {
                // Kiểm tra số lần user đã sử dụng mã này
                long userUsed = bookingRepository.countByUserIdAndVoucherIdAndStatusNot(userId, v.getId(), BookingStatus.CANCELLED);
                resp.setUserUsedCount((int) userUsed);

                // Kiểm tra giới hạn lượt dùng mỗi tài khoản
                if (v.getUserUsageLimit() != null && userUsed >= v.getUserUsageLimit()) {
                    resp.setCanApply(false);
                    resp.setReasonIfNotApplicable("Bạn đã sử dụng hết " + v.getUserUsageLimit() + "/" + v.getUserUsageLimit() + " lượt cho phép");
                }
                // Kiểm tra điều kiện khách hàng mới (NEW)
                else if (v.getTargetTier() == CustomerTier.NEW && tierInfo.getCurrentTier() != CustomerTier.NEW) {
                    resp.setCanApply(false);
                    resp.setReasonIfNotApplicable("Chỉ áp dụng cho đơn đầu tiên của Khách Hàng Mới");
                }
                // Kiểm tra điều kiện hạng thành viên tối thiểu
                else if (v.getTargetTier() != CustomerTier.ALL && v.getTargetTier() != CustomerTier.NEW && !tierInfo.getCurrentTier().satisfies(v.getTargetTier())) {
                    resp.setCanApply(false);
                    resp.setReasonIfNotApplicable("Đặc quyền " + v.getTargetTier().getDisplayName() + " (Bạn hiện là " + tierInfo.getCurrentTier().getDisplayName() + ")");
                } else {
                    resp.setCanApply(true);
                }
            } else {
                resp.setCanApply(true);
            }
            publicVouchers.add(resp);
        }

        return UserVoucherSummaryResponse.builder()
                .tierInfo(tierInfo)
                .personalVouchers(personalVouchers)
                .publicVouchers(publicVouchers)
                .build();
    }

    /**
     * Tính toán phân hạng thành viên (Customer Tier) dựa trên lịch sử đặt lịch và chi tiêu
     */
    @Transactional(readOnly = true)
    public CustomerTierInfo determineCustomerTier(Long userId) {
        if (userId == null) {
            return CustomerTierInfo.builder()
                    .currentTier(CustomerTier.NEW)
                    .tierName("Khách Hàng Mới")
                    .completedBookings(0)
                    .totalSpent(BigDecimal.ZERO)
                    .nextTier(CustomerTier.BRONZE)
                    .nextTierName("Hạng Đồng (Bronze)")
                    .nextTierSpendRequired(BigDecimal.ZERO)
                    .progressPercent(0)
                    .description("Hãy đăng nhập và hoàn thành đơn đầu tiên để nâng cấp hạng thành viên!")
                    .build();
        }

        // Đếm tổng số đơn không bị hủy
        long nonCancelledCount = bookingRepository.countByUserIdAndStatusNot(userId, BookingStatus.CANCELLED);
        if (nonCancelledCount == 0) {
            return CustomerTierInfo.builder()
                    .currentTier(CustomerTier.NEW)
                    .tierName("Khách Hàng Mới")
                    .completedBookings(0)
                    .totalSpent(BigDecimal.ZERO)
                    .nextTier(CustomerTier.BRONZE)
                    .nextTierName("Hạng Đồng (Bronze)")
                    .nextTierSpendRequired(BigDecimal.ZERO)
                    .progressPercent(0)
                    .description("Bạn là khách hàng mới! Đặt ngay đơn đầu tiên để tích lũy ưu đãi hạng Đồng.")
                    .build();
        }

        // Lấy các đơn đã hoàn tất (COMPLETED) để tính tiền chi tiêu
        List<Booking> nonCancelledBookings = bookingRepository.findByUserIdAndStatusNot(userId, BookingStatus.CANCELLED);
        int totalValidOrders = nonCancelledBookings.size();
        BigDecimal totalSpent = nonCancelledBookings.stream()
                .filter(b -> b.getStatus() == BookingStatus.COMPLETED || b.getStatus() == BookingStatus.CONFIRMED || b.getStatus() == BookingStatus.IN_PROGRESS)
                .map(b -> b.getTotalPrice() != null ? b.getTotalPrice() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        CustomerTier tier;
        CustomerTier nextTier = null;
        String nextTierName = null;
        BigDecimal spendNeeded = BigDecimal.ZERO;
        int progress = 100;
        String desc;

        if (totalValidOrders >= 10 || totalSpent.compareTo(BigDecimal.valueOf(7000000)) >= 0) {
            tier = CustomerTier.VIP;
            desc = "🌟 Chúc mừng! Bạn là khách hàng VIP Kim Cương với đặc quyền tối cao.";
        } else if (totalValidOrders >= 5 || totalSpent.compareTo(BigDecimal.valueOf(3000000)) >= 0) {
            tier = CustomerTier.GOLD;
            nextTier = CustomerTier.VIP;
            nextTierName = CustomerTier.VIP.getDisplayName();
            spendNeeded = BigDecimal.valueOf(7000000).subtract(totalSpent).max(BigDecimal.ZERO);
            progress = Math.min(100, (int) (totalSpent.doubleValue() / 7000000.0 * 100));
            desc = "✨ Bạn đang là Khách Hàng Vàng. Tích lũy thêm để thăng hạng VIP.";
        } else if (totalValidOrders >= 3 || totalSpent.compareTo(BigDecimal.valueOf(1000000)) >= 0) {
            tier = CustomerTier.SILVER;
            nextTier = CustomerTier.GOLD;
            nextTierName = CustomerTier.GOLD.getDisplayName();
            spendNeeded = BigDecimal.valueOf(3000000).subtract(totalSpent).max(BigDecimal.ZERO);
            progress = Math.min(100, (int) (totalSpent.doubleValue() / 3000000.0 * 100));
            desc = "💍 Bạn đang là Khách Hàng Bạc. Tích lũy thêm để lên hạng Vàng.";
        } else {
            tier = CustomerTier.BRONZE;
            nextTier = CustomerTier.SILVER;
            nextTierName = CustomerTier.SILVER.getDisplayName();
            spendNeeded = BigDecimal.valueOf(1000000).subtract(totalSpent).max(BigDecimal.ZERO);
            progress = Math.min(100, (int) (totalSpent.doubleValue() / 1000000.0 * 100));
            desc = "🥉 Bạn đang là Khách Hàng Đồng. Tích lũy từ 1.000.000đ để lên hạng Bạc.";
        }

        return CustomerTierInfo.builder()
                .currentTier(tier)
                .tierName(tier.getDisplayName())
                .completedBookings(totalValidOrders)
                .totalSpent(totalSpent)
                .nextTier(nextTier)
                .nextTierName(nextTierName)
                .nextTierSpendRequired(spendNeeded)
                .progressPercent(progress)
                .description(desc)
                .build();
    }

    @Transactional(readOnly = true)
    public List<VoucherResponse> getAllVouchersForAdmin() {
        return voucherRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(VoucherResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public VoucherResponse getVoucherById(Long id) {
        Voucher voucher = voucherRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Voucher", "id", id));
        return VoucherResponse.fromEntity(voucher);
    }

    @Transactional
    public VoucherResponse createVoucher(VoucherRequest request) {
        String cleanCode = request.getCode().trim().toUpperCase();
        if (voucherRepository.existsByCodeIgnoreCase(cleanCode)) {
            throw new BadRequestException("Mã voucher '" + cleanCode + "' đã tồn tại trong hệ thống");
        }

        Voucher voucher = Voucher.builder()
                .code(cleanCode)
                .name(request.getName().trim())
                .description(request.getDescription())
                .discountType(request.getDiscountType() != null ? request.getDiscountType() : DiscountType.PERCENTAGE)
                .discountValue(request.getDiscountValue())
                .maxDiscountAmount(request.getMaxDiscountAmount())
                .minOrderAmount(request.getMinOrderAmount() != null ? request.getMinOrderAmount() : BigDecimal.ZERO)
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .usageLimit(request.getUsageLimit())
                .userUsageLimit(request.getUserUsageLimit() != null ? request.getUserUsageLimit() : 1)
                .targetTier(request.getTargetTier() != null ? request.getTargetTier() : CustomerTier.ALL)
                .voucherScope(request.getVoucherScope() != null ? request.getVoucherScope() : VoucherScope.PUBLIC)
                .usedCount(0)
                .active(request.getActive() != null ? request.getActive() : true)
                .build();

        Voucher saved = voucherRepository.save(voucher);
        log.info("Đã tạo mới voucher: {} - Scope: {} - Tier: {}", saved.getCode(), saved.getVoucherScope(), saved.getTargetTier());
        return VoucherResponse.fromEntity(saved);
    }

    @Transactional
    public VoucherResponse updateVoucher(Long id, VoucherRequest request) {
        Voucher voucher = voucherRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Voucher", "id", id));

        String cleanCode = request.getCode().trim().toUpperCase();
        if (voucherRepository.existsByCodeIgnoreCaseAndIdNot(cleanCode, id)) {
            throw new BadRequestException("Mã voucher '" + cleanCode + "' đã được sử dụng bởi chương trình khác");
        }

        voucher.setCode(cleanCode);
        voucher.setName(request.getName().trim());
        voucher.setDescription(request.getDescription());
        if (request.getDiscountType() != null) voucher.setDiscountType(request.getDiscountType());
        if (request.getDiscountValue() != null) voucher.setDiscountValue(request.getDiscountValue());
        voucher.setMaxDiscountAmount(request.getMaxDiscountAmount());
        if (request.getMinOrderAmount() != null) voucher.setMinOrderAmount(request.getMinOrderAmount());
        voucher.setStartDate(request.getStartDate());
        voucher.setEndDate(request.getEndDate());
        voucher.setUsageLimit(request.getUsageLimit());
        if (request.getUserUsageLimit() != null) voucher.setUserUsageLimit(request.getUserUsageLimit());
        if (request.getTargetTier() != null) voucher.setTargetTier(request.getTargetTier());
        if (request.getVoucherScope() != null) voucher.setVoucherScope(request.getVoucherScope());
        if (request.getActive() != null) voucher.setActive(request.getActive());

        Voucher updated = voucherRepository.save(voucher);
        log.info("Đã cập nhật voucher ID {}: {}", id, updated.getCode());
        return VoucherResponse.fromEntity(updated);
    }

    @Transactional
    public VoucherResponse toggleStatus(Long id) {
        Voucher voucher = voucherRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Voucher", "id", id));
        voucher.setActive(!Boolean.TRUE.equals(voucher.getActive()));
        Voucher saved = voucherRepository.save(voucher);
        return VoucherResponse.fromEntity(saved);
    }

    @Transactional
    public void deleteVoucher(Long id) {
        Voucher voucher = voucherRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Voucher", "id", id));
        voucherRepository.delete(voucher);
        log.info("Đã xóa voucher ID {}", id);
    }

    /**
     * Admin tặng voucher vào ví cá nhân của một khách hàng
     */
    @Transactional
    public void assignVoucherToUser(UserVoucherAssignRequest request) {
        Voucher voucher = voucherRepository.findById(request.getVoucherId())
                .orElseThrow(() -> new ResourceNotFoundException("Voucher", "id", request.getVoucherId()));

        User user;
        if (request.getUserId() != null) {
            user = userRepository.findById(request.getUserId())
                    .orElseThrow(() -> new ResourceNotFoundException("User", "id", request.getUserId()));
        } else if (request.getUserEmail() != null && !request.getUserEmail().isBlank()) {
            user = userRepository.findByEmail(request.getUserEmail().trim())
                    .orElseThrow(() -> new BadRequestException("Không tìm thấy người dùng với email: " + request.getUserEmail()));
        } else {
            throw new BadRequestException("Vui lòng cung cấp ID hoặc Email của khách hàng");
        }

        if (userVoucherRepository.existsByUserIdAndVoucherIdAndIsUsedFalse(user.getId(), voucher.getId())) {
            throw new BadRequestException("Khách hàng này hiện đã có mã voucher '" + voucher.getCode() + "' chưa sử dụng trong ví");
        }

        UserVoucher userVoucher = UserVoucher.builder()
                .user(user)
                .voucher(voucher)
                .isUsed(false)
                .assignedAt(LocalDateTime.now())
                .assignedBy("ADMIN")
                .note(request.getNote() != null ? request.getNote().trim() : "Quà tặng ưu đãi độc quyền từ Studio")
                .build();

        userVoucherRepository.save(userVoucher);
        log.info("Admin đã tặng voucher {} cho user {}", voucher.getCode(), user.getEmail());
    }

    /**
     * Kiểm tra và tính toán giảm giá cho mã voucher (có kiểm tra quyền sở hữu, số lần dùng và hạng thành viên)
     */
    @Transactional(readOnly = true)
    public VoucherApplyResponse calculateVoucherDiscount(VoucherApplyRequest request, Long userId) {
        String code = request.getCode() != null ? request.getCode().trim().toUpperCase() : "";
        BigDecimal orderAmount = request.getOrderAmount() != null ? request.getOrderAmount() : BigDecimal.ZERO;

        Voucher voucher = voucherRepository.findByCodeIgnoreCase(code)
                .orElseThrow(() -> new BadRequestException("Mã voucher '" + code + "' không tồn tại trong hệ thống"));

        if (!Boolean.TRUE.equals(voucher.getActive())) {
            throw new BadRequestException("Mã voucher '" + code + "' hiện đang tạm khóa");
        }

        LocalDateTime now = LocalDateTime.now();
        if (voucher.getStartDate() != null && now.isBefore(voucher.getStartDate())) {
            throw new BadRequestException("Mã voucher '" + code + "' chưa đến thời gian áp dụng");
        }
        if (voucher.getEndDate() != null && now.isAfter(voucher.getEndDate())) {
            throw new BadRequestException("Mã voucher '" + code + "' đã hết hạn sử dụng");
        }
        if (voucher.getUsageLimit() != null && voucher.getUsedCount() >= voucher.getUsageLimit()) {
            throw new BadRequestException("Mã voucher '" + code + "' đã hết số lượt sử dụng toàn hệ thống");
        }

        BigDecimal minOrder = voucher.getMinOrderAmount() != null ? voucher.getMinOrderAmount() : BigDecimal.ZERO;
        if (orderAmount.compareTo(minOrder) < 0) {
            throw new BadRequestException(String.format("Đơn hàng chưa đạt giá trị tối thiểu %,d VNĐ để áp dụng mã '%s'", minOrder.longValue(), code));
        }

        // 1. Kiểm tra nếu là voucher cá nhân (PERSONAL)
        boolean isPersonalVoucher = voucher.getVoucherScope() == VoucherScope.PERSONAL;
        if (isPersonalVoucher) {
            if (userId == null) {
                throw new BadRequestException("Đây là voucher cá nhân đặc quyền. Quý khách vui lòng đăng nhập để áp dụng");
            }
            boolean hasPersonal = userVoucherRepository.existsByUserIdAndVoucherIdAndIsUsedFalse(userId, voucher.getId());
            if (!hasPersonal) {
                throw new BadRequestException("Mã voucher '" + code + "' không có trong ví cá nhân của bạn hoặc đã được sử dụng");
            }
        }

        // 2. Kiểm tra giới hạn theo tài khoản và phân hạng khách hàng nếu user đã đăng nhập
        if (userId != null) {
            CustomerTierInfo tierInfo = determineCustomerTier(userId);

            // Kiểm tra mã chỉ dành cho Khách Hàng Mới (NEW)
            if (voucher.getTargetTier() == CustomerTier.NEW && tierInfo.getCurrentTier() != CustomerTier.NEW) {
                throw new BadRequestException("Mã voucher '" + code + "' chỉ áp dụng cho đơn đặt lịch đầu tiên của khách hàng mới");
            }

            // Kiểm tra phân hạng thành viên tối thiểu
            if (voucher.getTargetTier() != CustomerTier.ALL && voucher.getTargetTier() != CustomerTier.NEW && !tierInfo.getCurrentTier().satisfies(voucher.getTargetTier())) {
                throw new BadRequestException("Mã voucher yêu cầu phân hạng " + voucher.getTargetTier().getDisplayName() + " (Bạn hiện đang là " + tierInfo.getCurrentTier().getDisplayName() + ")");
            }

            // Kiểm tra số lần dùng trên mỗi tài khoản
            if (voucher.getUserUsageLimit() != null) {
                long userUsed = bookingRepository.countByUserIdAndVoucherIdAndStatusNot(userId, voucher.getId(), BookingStatus.CANCELLED);
                if (userUsed >= voucher.getUserUsageLimit()) {
                    throw new BadRequestException("Bạn đã sử dụng hết " + voucher.getUserUsageLimit() + "/" + voucher.getUserUsageLimit() + " lượt cho phép của mã voucher '" + code + "'");
                }
            }
        }

        BigDecimal discountAmount = calculateDiscount(voucher, orderAmount);
        BigDecimal finalAmount = orderAmount.subtract(discountAmount);
        if (finalAmount.compareTo(BigDecimal.ZERO) < 0) {
            finalAmount = BigDecimal.ZERO;
        }

        VoucherResponse vResp = VoucherResponse.fromEntity(voucher);
        vResp.setIsPersonal(isPersonalVoucher);

        return VoucherApplyResponse.builder()
                .valid(true)
                .code(voucher.getCode())
                .voucherName(voucher.getName())
                .message("Áp dụng mã giảm giá '" + voucher.getCode() + "' thành công!")
                .orderAmount(orderAmount)
                .discountAmount(discountAmount)
                .finalAmount(finalAmount)
                .voucher(vResp)
                .build();
    }

    public BigDecimal calculateDiscount(Voucher voucher, BigDecimal orderAmount) {
        BigDecimal discount;
        if (voucher.getDiscountType() == DiscountType.PERCENTAGE) {
            discount = orderAmount.multiply(voucher.getDiscountValue())
                    .divide(BigDecimal.valueOf(100), 0, RoundingMode.HALF_UP);
            if (voucher.getMaxDiscountAmount() != null && discount.compareTo(voucher.getMaxDiscountAmount()) > 0) {
                discount = voucher.getMaxDiscountAmount();
            }
        } else {
            discount = voucher.getDiscountValue();
            if (discount.compareTo(orderAmount) > 0) {
                discount = orderAmount;
            }
        }
        return discount;
    }

    @Transactional
    public void incrementUsedCount(Long voucherId) {
        voucherRepository.findById(voucherId).ifPresent(v -> {
            v.setUsedCount((v.getUsedCount() != null ? v.getUsedCount() : 0) + 1);
            voucherRepository.save(v);
        });
    }

    /**
     * Đánh dấu voucher trong ví cá nhân đã được sử dụng sau khi đơn đặt lịch tạo thành công
     */
    @Transactional
    public void markPersonalVoucherUsed(Long userId, Long voucherId) {
        if (userId == null || voucherId == null) return;
        userVoucherRepository.findByUserIdAndVoucherIdAndIsUsedFalse(userId, voucherId).ifPresent(uv -> {
            uv.setIsUsed(true);
            uv.setUsedAt(LocalDateTime.now());
            userVoucherRepository.save(uv);
            log.info("Đã đánh dấu sử dụng voucher cá nhân ID {} cho user ID {}", voucherId, userId);
        });
    }

    /**
     * Hoàn lại voucher cá nhân nếu đơn đặt lịch bị hủy
     */
    @Transactional
    public void releasePersonalVoucher(Long userId, Long voucherId) {
        if (userId == null || voucherId == null) return;
        userVoucherRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .filter(uv -> uv.getVoucher().getId().equals(voucherId) && Boolean.TRUE.equals(uv.getIsUsed()))
                .findFirst()
                .ifPresent(uv -> {
                    uv.setIsUsed(false);
                    uv.setUsedAt(null);
                    userVoucherRepository.save(uv);
                    log.info("Đã hoàn lại voucher cá nhân ID {} cho user ID {}", voucherId, userId);
                });
    }
}
