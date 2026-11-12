package com.bookingmakeup.service;

import com.bookingmakeup.common.exception.BadRequestException;
import com.bookingmakeup.common.exception.ResourceNotFoundException;
import com.bookingmakeup.dto.request.BookingAddressRequest;
import com.bookingmakeup.dto.request.BookingItemRequest;
import com.bookingmakeup.dto.request.BookingRequest;
import com.bookingmakeup.dto.request.CustomerBookingUpdateRequest;
import com.bookingmakeup.dto.request.DispatchEstimateRequest;
import com.bookingmakeup.dto.request.VoucherApplyRequest;
import com.bookingmakeup.dto.response.BookingItemResponse;
import com.bookingmakeup.dto.response.BookingResponse;
import com.bookingmakeup.dto.response.DispatchOptionResponse;
import com.bookingmakeup.dto.response.VoucherApplyResponse;
import com.bookingmakeup.entity.*;
import com.bookingmakeup.enums.BookingStatus;
import com.bookingmakeup.enums.ExecutionMode;
import com.bookingmakeup.enums.LocationType;
import com.bookingmakeup.enums.PaymentMethod;
import com.bookingmakeup.enums.PaymentStatus;
import com.bookingmakeup.enums.Role;
import com.bookingmakeup.repository.*;
import com.bookingmakeup.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final BookingItemRepository bookingItemRepository;
    private final BookingAddressRepository bookingAddressRepository;
    private final ArtistScheduleRepository artistScheduleRepository;
    private final MakeupServiceRepository makeupServiceRepository;
    private final MakeupArtistRepository makeupArtistRepository;
    private final UserRepository userRepository;
    private final PaymentRepository paymentRepository;
    private final MakeupLayoutRepository makeupLayoutRepository;
    private final VoucherRepository voucherRepository;
    private final VoucherService voucherService;

    /**
     * Kiểm tra nhanh độ khả dụng khung giờ của thợ trang điểm (trả về true/false,
     * không ném ngoại lệ)
     */
    @Transactional(readOnly = true)
    public boolean checkSlotAvailability(Long artistId, LocalDate date, LocalTime startTime, LocalTime endTime) {
        try {
            validateSlotAvailability(artistId, date, startTime, endTime);
            return true;
        } catch (BadRequestException e) {
            return false;
        }
    }

    /**
     * Xác thực tính khả dụng của slot làm việc của chuyên viên
     * Kiểm tra trạng thái hoạt động của thợ, ngày nghỉ trong ArtistSchedule và xung
     * đột trùng giờ với các đơn hẹn khác.
     */
    @Transactional(readOnly = true)
    public void validateSlotAvailability(Long artistId, LocalDate date, LocalTime startTime, LocalTime endTime) {
        MakeupArtist artist = makeupArtistRepository.findById(artistId)
                .orElseThrow(() -> new ResourceNotFoundException("MakeupArtist", "id", artistId));

        if (!Boolean.TRUE.equals(artist.getActive())) {
            throw new BadRequestException("Thợ trang điểm (ID: " + artistId + ") hiện không hoạt động");
        }

        // 1. Kiểm tra ngày nghỉ hoặc giờ làm việc trong ArtistSchedule
        Optional<ArtistSchedule> scheduleOpt = artistScheduleRepository.findByMakeupArtistIdAndScheduleDate(artistId,
                date);
        if (scheduleOpt.isPresent()) {
            ArtistSchedule schedule = scheduleOpt.get();
            if (Boolean.TRUE.equals(schedule.getIsDayOff())) {
                throw new BadRequestException(String.format("Thợ '%s' đăng ký nghỉ làm vào ngày %s",
                        artist.getUser().getFullName(), date));
            }
            if (startTime.isBefore(schedule.getStartTime()) || endTime.isAfter(schedule.getEndTime())) {
                throw new BadRequestException(String.format("Khung giờ %s - %s nằm ngoài ca làm việc của thợ (%s - %s)",
                        startTime, endTime, schedule.getStartTime(), schedule.getEndTime()));
            }
        }

        // 2. Kiểm tra trùng lịch với các đơn hẹn chưa hủy
        List<BookingItem> overlaps = bookingItemRepository.findOverlappingItems(artistId, date, startTime, endTime);
        if (!overlaps.isEmpty()) {
            BookingItem conflict = overlaps.get(0);
            throw new BadRequestException(String.format("Thợ '%s' đã có ca làm việc khác từ %s đến %s vào ngày %s",
                    artist.getUser().getFullName(), conflict.getStartTime(), conflict.getEndTime(), date));
        }
    }

    private Map<Long, Long> getMonthlyBookingCountPerArtist(LocalDate targetDate) {
        LocalDate date = targetDate != null ? targetDate : LocalDate.now();
        LocalDate startOfMonth = date.withDayOfMonth(1);
        LocalDate endOfMonth = date.withDayOfMonth(date.lengthOfMonth());

        List<Object[]> results = bookingItemRepository.countDistinctBookingsByArtistInDateRange(startOfMonth,
                endOfMonth);
        Map<Long, Long> counts = new HashMap<>();
        if (results != null) {
            for (Object[] row : results) {
                Long artistId = (Long) row[0];
                Long count = ((Number) row[1]).longValue();
                counts.put(artistId, count);
            }
        }
        return counts;
    }

    private Map<Long, Long> getAllTimeBookingCountPerArtist() {
        List<Object[]> results = bookingItemRepository.countDistinctBookingsByArtistAllTime();
        Map<Long, Long> counts = new HashMap<>();
        if (results != null) {
            for (Object[] row : results) {
                Long artistId = (Long) row[0];
                Long count = ((Number) row[1]).longValue();
                counts.put(artistId, count);
            }
        }
        return counts;
    }

    /**
     * Thuật toán cân bằng tải công việc giữa các chuyên viên trong tháng (Fair
     * Share Workload Distribution):
     * - Mục tiêu: Đảm bảo trong 1 tháng, tất cả chuyên viên đều nhận số lượng lịch
     * đều nhau (ví dụ: Dung 10 lịch thì các thợ khác 9 hoặc 10 lịch).
     * - Cơ chế:
     * 1. Đếm số đơn đặt lịch (DISTINCT bookings, không tính đơn hủy) mà mỗi thợ phụ
     * trách trong tháng của bookingDate.
     * 2. Ưu tiên chuyên viên có số đơn trong tháng THẤP NHẤT nhận lịch tiếp theo.
     * 3. Nếu số đơn trong tháng bằng nhau: Ưu tiên chuyên viên có tổng số đơn từ
     * trước đến nay thấp hơn.
     * 4. Nếu vẫn bằng nhau: Sắp xếp theo ID tăng dần để đảm bảo tính nhất quán
     * (deterministic).
     */
    private Comparator<MakeupArtist> createFairWorkloadComparator(LocalDate targetDate) {
        Map<Long, Long> monthlyCounts = getMonthlyBookingCountPerArtist(targetDate);
        Map<Long, Long> allTimeCounts = getAllTimeBookingCountPerArtist();

        return (a1, a2) -> {
            long count1 = monthlyCounts.getOrDefault(a1.getId(), 0L);
            long count2 = monthlyCounts.getOrDefault(a2.getId(), 0L);
            if (count1 != count2) {
                return Long.compare(count1, count2);
            }
            long all1 = allTimeCounts.getOrDefault(a1.getId(), 0L);
            long all2 = allTimeCounts.getOrDefault(a2.getId(), 0L);
            if (all1 != all2) {
                return Long.compare(all1, all2);
            }
            return Long.compare(a1.getId(), a2.getId());
        };
    }

    /**
     * Ước tính các phương án điều phối thợ theo số người và thời gian hoàn thành
     * (Model 2)
     */
    @Transactional(readOnly = true)
    public List<DispatchOptionResponse> estimateDispatchOptions(DispatchEstimateRequest request) {
        List<MakeupArtist> activeArtists = makeupArtistRepository.findAll().stream()
                .filter(a -> Boolean.TRUE.equals(a.getActive()))
                .toList();

        if (activeArtists.isEmpty()) {
            throw new BadRequestException("Hiện không có chuyên viên makeup nào khả dụng trong hệ thống");
        }

        // Mở rộng tất cả các ca dịch vụ dựa theo số lượng người
        List<ServiceTask> allTasks = new ArrayList<>();
        BigDecimal totalServicesPrice = BigDecimal.ZERO;
        for (DispatchEstimateRequest.ServiceItemQty item : request.getItems()) {
            MakeupService service = makeupServiceRepository.findById(item.getServiceId())
                    .orElseThrow(() -> new ResourceNotFoundException("MakeupService", "id", item.getServiceId()));
            int qty = (item.getQuantity() != null && item.getQuantity() > 0) ? item.getQuantity() : 1;
            for (int i = 0; i < qty; i++) {
                allTasks.add(new ServiceTask(service.getId(), service.getServiceName(), service.getDuration(),
                        service.getPrice()));
                totalServicesPrice = totalServicesPrice.add(service.getPrice());
            }
        }

        if (allTasks.isEmpty()) {
            throw new BadRequestException("Vui lòng chọn ít nhất 1 dịch vụ");
        }

        int maxActive = activeArtists.size();
        int totalTasksCount = allTasks.size();

        // 1. Tính Gói Tiết Kiệm (SAVING - luôn là 1 chuyên viên)
        DispatchOptionResponse savingOpt = buildDispatchOption(
                request, activeArtists, allTasks, totalServicesPrice,
                "SAVING", "Gói Tiết Kiệm", 1);

        // 2. Tính Gói Xong Nhanh (SPEED) trước để xác định chính xác số lượng thợ thực sự rảnh tối đa (actualSpeedK)
        int idealSpeedK = (totalTasksCount <= 3)
                ? Math.min(3, maxActive)
                : Math.min(maxActive, totalTasksCount);

        DispatchOptionResponse speedOpt = null;
        if (idealSpeedK > 1) {
            speedOpt = buildDispatchOption(
                    request, activeArtists, allTasks, totalServicesPrice,
                    "SPEED", "Gói Xong Nhanh", idealSpeedK);
        }

        // Số thợ thực tế rảnh của gói SPEED sau khi kiểm tra lịch nghỉ & xung đột khung giờ
        int actualSpeedK = speedOpt != null ? speedOpt.getArtistCount() : 1;

        // 3. Tính Gói Tiêu Chuẩn (BALANCED) dựa trên lực lượng rảnh thực tế (actualSpeedK)
        // Đảm bảo nếu có >= 3 thợ rảnh thì BALANCED < SPEED (vd: 3 rảnh -> BALANCED=2, SPEED=3; 5 rảnh -> BALANCED=3, SPEED=5)
        DispatchOptionResponse balancedOpt = null;
        if (actualSpeedK >= 2) {
            int balancedK;
            if (totalTasksCount == 1) {
                balancedK = Math.min(2, actualSpeedK);
            } else if (actualSpeedK == 2) {
                balancedK = 2;
            } else {
                balancedK = Math.max(2, (int) Math.round(actualSpeedK * 0.6));
                if (balancedK >= actualSpeedK) {
                    balancedK = actualSpeedK - 1;
                }
            }
            balancedOpt = buildDispatchOption(
                    request, activeArtists, allTasks, totalServicesPrice,
                    "BALANCED", "Gói Tiêu Chuẩn", balancedK);
        }

        List<DispatchOptionResponse> options = new ArrayList<>();
        Set<Integer> addedArtistCounts = new HashSet<>();

        if (savingOpt != null) {
            options.add(savingOpt);
            addedArtistCounts.add(savingOpt.getArtistCount());
        }
        if (balancedOpt != null && !addedArtistCounts.contains(balancedOpt.getArtistCount())) {
            options.add(balancedOpt);
            addedArtistCounts.add(balancedOpt.getArtistCount());
        }
        if (speedOpt != null && !addedArtistCounts.contains(speedOpt.getArtistCount())) {
            options.add(speedOpt);
        }

        return options;
    }

    /**
     * Dựng phương án điều phối chi tiết cho 1 gói cụ thể và tự động điều chỉnh k theo số thợ rảnh trong khung giờ
     */
    private DispatchOptionResponse buildDispatchOption(
            DispatchEstimateRequest request,
            List<MakeupArtist> activeArtists,
            List<ServiceTask> allTasks,
            BigDecimal totalServicesPrice,
            String planCode,
            String planName,
            int initialK) {

        int k = initialK;
        int totalTasksCount = allTasks.size();

        List<ArtistQueue> queues = null;
        int maxDurationMinutes = 60;
        LocalTime planStartTime = null;
        LocalTime planEndTime = null;
        Boolean isLate = null;
        Integer diffMinutes = null;
        LocalTime recommendedStartTime = null;
        List<MakeupArtist> availableArtists = new ArrayList<>();
        List<MakeupArtist> busyArtists = new ArrayList<>();

        // Kiểm tra khả dụng & tự động điều chỉnh k theo số thợ thực sự rảnh trong khung giờ
        for (int attempt = 0; attempt < 2; attempt++) {
            queues = distributeTasksToQueues(allTasks, k);
            maxDurationMinutes = queues.stream().mapToInt(q -> q.totalDuration).max().orElse(60);

            if (request.getBookingTime() != null) {
                planStartTime = request.getBookingTime();
                planEndTime = planStartTime.plusMinutes(maxDurationMinutes);
            } else if (request.getTargetEndTime() != null) {
                planEndTime = request.getTargetEndTime();
                planStartTime = planEndTime.minusMinutes(maxDurationMinutes);
            } else {
                planStartTime = LocalTime.of(7, 0);
                planEndTime = planStartTime.plusMinutes(maxDurationMinutes);
            }

            if (request.getTargetEndTime() != null) {
                int targetMins = request.getTargetEndTime().getHour() * 60 + request.getTargetEndTime().getMinute();
                int endMins = planEndTime.getHour() * 60 + planEndTime.getMinute();
                diffMinutes = targetMins - endMins;
                isLate = diffMinutes < 0;
                recommendedStartTime = request.getTargetEndTime().minusMinutes(maxDurationMinutes);
            } else {
                diffMinutes = null;
                isLate = null;
                recommendedStartTime = null;
            }

            availableArtists.clear();
            busyArtists.clear();
            for (MakeupArtist a : activeArtists) {
                if (checkSlotAvailability(a.getId(), request.getBookingDate(), planStartTime, planEndTime)) {
                    availableArtists.add(a);
                } else {
                    busyArtists.add(a);
                }
            }

            if (!availableArtists.isEmpty() && k > availableArtists.size()) {
                // Nếu số thợ rảnh trong khung giờ ít hơn dự kiến, tự động hạ k xuống đúng số thợ rảnh tối đa
                k = availableArtists.size();
            } else {
                break;
            }
        }

        if (!availableArtists.isEmpty() && k > availableArtists.size()) {
            return null;
        }

        // Sắp xếp chuyên viên theo thuật toán cân bằng tải công việc trong tháng (Fair Workload Balancing)
        Comparator<MakeupArtist> fairComparator = createFairWorkloadComparator(request.getBookingDate());
        availableArtists.sort(fairComparator);
        busyArtists.sort(fairComparator);

        List<MakeupArtist> candidateArtists = new ArrayList<>();
        if (request.getPreferredArtistId() != null) {
            availableArtists.stream()
                    .filter(a -> a.getId().equals(request.getPreferredArtistId()))
                    .findFirst()
                    .ifPresent(candidateArtists::add);
        }
        // Ưu tiên cao nhất: tất cả các chuyên viên ĐANG RẢNH (chưa có lịch hẹn)
        for (MakeupArtist a : availableArtists) {
            if (!candidateArtists.contains(a)) {
                candidateArtists.add(a);
            }
        }
        for (MakeupArtist a : busyArtists) {
            if (!candidateArtists.contains(a)) {
                candidateArtists.add(a);
            }
        }

        for (int i = 0; i < k; i++) {
            queues.get(i).artist = candidateArtists.get(i % candidateArtists.size());
        }

        // Tính phụ phí theo Model 2
        // 1. Phụ phí điều phối thợ cấp tốc: CHỈ áp dụng cho gói SPEED (+15% giá dịch vụ, tối thiểu 100k)
        BigDecimal rushFee = BigDecimal.ZERO;
        if ("SPEED".equals(planCode)) {
            rushFee = totalServicesPrice.multiply(BigDecimal.valueOf(0.15)).setScale(-3, RoundingMode.HALF_UP);
            if (rushFee.compareTo(BigDecimal.valueOf(100000)) < 0) {
                rushFee = BigDecimal.valueOf(100000);
            }
        }

        // 2. Chiết khấu giảm 15% cho gói Tiết Kiệm (SAVING) khi nhóm từ 2 người trở lên
        BigDecimal discountAmount = BigDecimal.ZERO;
        if ("SAVING".equals(planCode) && totalTasksCount >= 2) {
            discountAmount = totalServicesPrice.multiply(BigDecimal.valueOf(0.15)).setScale(-3,
                    RoundingMode.HALF_UP);
        }

        // 3. Phụ phí làm sớm (Early Bird): nếu bắt đầu trước 06:00 sáng -> 50.000đ / thợ
        BigDecimal earlyFee = BigDecimal.ZERO;
        if (planStartTime.isBefore(LocalTime.of(6, 0))) {
            earlyFee = BigDecimal.valueOf(50000L * k);
        }

        BigDecimal totalSurcharge = rushFee.add(earlyFee);
        BigDecimal totalPrice = totalServicesPrice.subtract(discountAmount).add(totalSurcharge);
        if (totalPrice.compareTo(BigDecimal.ZERO) < 0) {
            totalPrice = BigDecimal.ZERO;
        }
        BigDecimal depositAmount = totalPrice.multiply(BigDecimal.valueOf(0.3)).setScale(-3, RoundingMode.HALF_UP);

        String dynamicBadge;
        String dynamicDesc;
        if ("SAVING".equals(planCode)) {
            dynamicBadge = totalTasksCount >= 2 ? "Tiết kiệm 15% chi phí" : "Tiêu chuẩn 1 chuyên viên";
            dynamicDesc = "1 chuyên viên phục vụ lần lượt từng người, giảm ngay 15% tổng giá dịch vụ.";
        } else if ("BALANCED".equals(planCode)) {
            dynamicBadge = String.format("Phối hợp %d chuyên viên", k);
            dynamicDesc = String.format("%d chuyên viên cùng thực hiện song song, cân bằng tối ưu thời gian và chi phí.", k);
        } else {
            dynamicBadge = String.format("Huy động tối đa %d chuyên viên", k);
            dynamicDesc = String.format("Ekip %d chuyên viên làm đồng loạt hỏa tốc theo lực lượng rảnh, hoàn thành nhanh nhất.", k);
        }

        // Dựng timeline cho từng thợ
        List<DispatchOptionResponse.ArtistTimelineDto> timelineDtos = new ArrayList<>();
        for (ArtistQueue q : queues) {
            LocalTime pointer = planStartTime;
            List<DispatchOptionResponse.SlotItemDto> slotDtos = new ArrayList<>();
            for (ServiceTask t : q.tasks) {
                LocalTime slotEnd = pointer.plusMinutes(t.duration());
                slotDtos.add(DispatchOptionResponse.SlotItemDto.builder()
                        .serviceId(t.serviceId())
                        .serviceName(t.serviceName())
                        .startTime(pointer)
                        .endTime(slotEnd)
                        .duration(t.duration())
                        .price(t.price())
                        .build());
                pointer = slotEnd;
            }

            timelineDtos.add(DispatchOptionResponse.ArtistTimelineDto.builder()
                    .artistId(q.artist.getId())
                    .artistName(q.artist.getUser().getFullName())
                    .avatar(q.artist.getUser().getAvatar())
                    .startTime(planStartTime)
                    .endTime(pointer)
                    .slots(slotDtos)
                    .build());
        }

        return DispatchOptionResponse.builder()
                .planCode(planCode)
                .planName(planName)
                .badge(dynamicBadge)
                .description(dynamicDesc)
                .artistCount(k)
                .availableArtistCount(availableArtists.size())
                .totalActiveArtists(activeArtists.size())
                .startTime(planStartTime)
                .endTime(planEndTime)
                .durationMinutes(maxDurationMinutes)
                .isLate(isLate)
                .diffMinutes(diffMinutes)
                .recommendedStartTime(recommendedStartTime)
                .servicesPrice(totalServicesPrice)
                .rushFee(rushFee)
                .earlyFee(earlyFee)
                .totalSurcharge(totalSurcharge)
                .discountAmount(discountAmount)
                .totalPrice(totalPrice)
                .depositAmount(depositAmount)
                .timelines(timelineDtos)
                .build();
    }

    /**
     * Phân bổ các dịch vụ vào k hàng đợi thợ bằng thuật toán Tham lam LPT (Longest Processing Time First)
     */
    private List<ArtistQueue> distributeTasksToQueues(List<ServiceTask> allTasks, int k) {
        List<ArtistQueue> queues = new ArrayList<>();
        for (int i = 0; i < k; i++) {
            queues.add(new ArtistQueue(null));
        }

        int totalTasksCount = allTasks.size();
        if (totalTasksCount == 1) {
            ServiceTask baseTask = allTasks.get(0);
            if (k == 1) {
                queues.get(0).tasks.add(baseTask);
                queues.get(0).totalDuration += baseTask.duration();
            } else if (k == 2) {
                int d1 = Math.max(30, (int) Math.round(baseTask.duration() * 0.60));
                int d2 = Math.max(25, (int) Math.round(baseTask.duration() * 0.50));
                queues.get(0).tasks.add(new ServiceTask(baseTask.serviceId(),
                        baseTask.serviceName() + " (Trang điểm mặt)", d1, baseTask.price()));
                queues.get(0).totalDuration += d1;

                queues.get(1).tasks.add(new ServiceTask(baseTask.serviceId(),
                        "Tạo kiểu tóc & Cài phụ kiện (Song song)", d2, BigDecimal.ZERO));
                queues.get(1).totalDuration += d2;
            } else {
                int d1 = Math.max(25, (int) Math.round(baseTask.duration() * 0.40));
                int d2 = Math.max(20, (int) Math.round(baseTask.duration() * 0.35));
                int d3 = Math.max(15, (int) Math.round(baseTask.duration() * 0.30));
                queues.get(0).tasks.add(new ServiceTask(baseTask.serviceId(),
                        baseTask.serviceName() + " (Trang điểm mặt chính)", d1, baseTask.price()));
                queues.get(0).totalDuration += d1;

                queues.get(1).tasks.add(new ServiceTask(baseTask.serviceId(), "Tạo kiểu tóc cao cấp (Song song)",
                        d2, BigDecimal.ZERO));
                queues.get(1).totalDuration += d2;

                queues.get(2).tasks.add(new ServiceTask(baseTask.serviceId(), "Trang điểm body & Trợ lý trang phục",
                        d3, BigDecimal.ZERO));
                queues.get(2).totalDuration += d3;
            }
            return queues;
        }

        // Tham lam LPT: Sắp xếp các dịch vụ giảm dần theo thời gian thực hiện
        List<ServiceTask> sortedTasks = new ArrayList<>(allTasks);
        sortedTasks.sort((a, b) -> Integer.compare(b.duration(), a.duration()));
        for (ServiceTask task : sortedTasks) {
            ArtistQueue minQueue = queues.stream().min(Comparator.comparingInt(q -> q.totalDuration))
                    .orElse(queues.get(0));
            minQueue.tasks.add(task);
            minQueue.totalDuration += task.duration();
        }

        // Nếu có thợ rảnh (ví dụ 2 khách mà chọn gói 3 thợ), thợ rảnh hỗ trợ ca dài nhất
        for (ArtistQueue q : queues) {
            if (q.tasks.isEmpty()) {
                ArtistQueue maxQueue = queues.stream().max(Comparator.comparingInt(mq -> mq.totalDuration))
                        .orElse(null);
                if (maxQueue != null && maxQueue.totalDuration > 35) {
                    ServiceTask longest = maxQueue.tasks.get(0);
                    int originalD = longest.duration();
                    int assistD = Math.max(20, (int) Math.round(originalD * 0.45));
                    int reducedD = Math.max(25, (int) Math.round(originalD * 0.60));
                    maxQueue.tasks.set(0, new ServiceTask(longest.serviceId(),
                            longest.serviceName() + " (Trang điểm mặt)", reducedD, longest.price()));
                    maxQueue.totalDuration = maxQueue.totalDuration - originalD + reducedD;

                    q.tasks.add(new ServiceTask(longest.serviceId(),
                            "Hỗ trợ làm tóc cho " + longest.serviceName(), assistD, BigDecimal.ZERO));
                    q.totalDuration += assistD;
                }
            }
        }
        return queues;
    }

    /**
     * Tạo mới đơn đặt lịch hẹn trang điểm (Booking Creation)
     * Xử lý xác thực khách hàng, tính toán chi phí dịch vụ, phụ phí sáng sớm/di
     * chuyển Mapbox, áp dụng voucher và phân bổ thợ.
     */
    @Transactional
    public BookingResponse createBooking(UserPrincipal currentUser, BookingRequest request) {
        if (currentUser == null) {
            throw new BadRequestException("Vui lòng đăng nhập tài khoản Khách hàng để thực hiện đặt lịch");
        }

        if ("ROLE_ADMIN".equals(currentUser.getRole()) || "ROLE_ARTIST".equals(currentUser.getRole())) {
            throw new BadRequestException(
                    "Tài khoản Quản trị viên (Admin) và Nghệ sĩ (Artist) không được phép thực hiện đặt lịch dịch vụ. Vui lòng sử dụng tài khoản Khách hàng.");
        }

        User customer = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", currentUser.getId()));

        if (customer.getRole() == Role.ROLE_ADMIN || customer.getRole() == Role.ROLE_ARTIST) {
            throw new BadRequestException(
                    "Tài khoản Quản trị viên (Admin) và Nghệ sĩ (Artist) không được phép thực hiện đặt lịch dịch vụ. Vui lòng sử dụng tài khoản Khách hàng.");
        }

        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new BadRequestException("Đơn đặt lịch phải có ít nhất 1 dịch vụ");
        }

        if (request.getBookingDate() == null) {
            throw new BadRequestException("Vui lòng chọn ngày đặt lịch");
        }
        LocalDate today = LocalDate.now();
        if (request.getBookingDate().isBefore(today)) {
            throw new BadRequestException("Không thể đặt lịch hẹn trong quá khứ");
        }
        if (request.getBookingDate().isEqual(today)) {
            LocalTime minTime = LocalTime.now().plusHours(1);
            if (request.getBookingTime() != null && request.getBookingTime().isBefore(minTime)) {
                throw new BadRequestException(String.format(
                        "Lịch hẹn trong ngày hôm nay phải đặt trước ít nhất 1 tiếng (sớm nhất từ %02d:%02d)",
                        minTime.getHour(), minTime.getMinute()));
            }
        }
        if (request.getBookingTime() != null && request.getTargetEndTime() != null
                && !request.getTargetEndTime().isAfter(request.getBookingTime())) {
            throw new BadRequestException("Thời gian kết thúc phải sau thời gian bắt đầu");
        }

        boolean isDispatchManaged = request.getDispatchPlan() != null
                || (request.getArtistCount() != null && request.getArtistCount() > 1);

        if (!isDispatchManaged && request.getExecutionMode() == ExecutionMode.SINGLE && request.getItems().size() > 1) {
            throw new BadRequestException(
                    "Chế độ SINGLE chỉ cho phép đặt 1 dịch vụ đơn lẻ. Với nhiều dịch vụ, vui lòng chọn phương án điều phối (SAVING, BALANCED, SPEED).");
        }

        // 1. Xử lý phân bổ thời gian và thợ cho từng ca
        List<PreparedItem> preparedItems = prepareBookingItems(request);

        // 2. Tính tiền dịch vụ
        BigDecimal servicesPrice = BigDecimal.ZERO;
        for (PreparedItem pItem : preparedItems) {
            servicesPrice = servicesPrice.add(pItem.price);
        }

        // Phụ phí điều phối thợ & làm sớm
        BigDecimal surcharge = request.getSurcharge() != null ? request.getSurcharge() : BigDecimal.ZERO;
        if (surcharge.compareTo(BigDecimal.ZERO) == 0 && "SPEED".equalsIgnoreCase(request.getDispatchPlan())) {
            surcharge = servicesPrice.multiply(BigDecimal.valueOf(0.15)).setScale(-3, RoundingMode.HALF_UP);
        }
        if (request.getBookingTime() != null && request.getBookingTime().isBefore(LocalTime.of(6, 0))) {
            int aCount = request.getArtistCount() != null ? request.getArtistCount() : 1;
            surcharge = surcharge.add(BigDecimal.valueOf(50000L * aCount));
        }

        // 3. Tính phí di chuyển nếu locationType == HOME
        BigDecimal travelFee = BigDecimal.ZERO;
        BigDecimal distanceKm = BigDecimal.ZERO;
        String homeAddress = null;

        if (request.getLocationType() == LocationType.HOME) {
            BookingAddressRequest addrReq = request.getAddressInfo();
            if (addrReq == null || addrReq.getAddress() == null || addrReq.getAddress().trim().isEmpty()) {
                throw new BadRequestException("Vui lòng nhập địa chỉ cụ thể khi đặt lịch trang điểm tại nhà (HOME)");
            }
            homeAddress = addrReq.getAddress().trim();
            double inputDist = (addrReq.getDistanceKm() != null && addrReq.getDistanceKm() > 0)
                    ? addrReq.getDistanceKm()
                    : 5.0;

            // Giới hạn bán kính phục vụ tối đa 200km
            if (inputDist > 200.0) {
                throw new BadRequestException(
                        "Studio chỉ nhận phục vụ tận nơi trong bán kính tối đa 200km. Vui lòng chọn địa điểm gần hơn hoặc đặt lịch tại Studio.");
            }

            distanceKm = BigDecimal.valueOf(inputDist).setScale(2, RoundingMode.HALF_UP);

            // Bảng phí di chuyển mới:

            double calculatedFee = 0.0;
            if (inputDist < 10.0) {
                calculatedFee = 0.0;
            } else if (inputDist <= 20.0) {
                calculatedFee = 100000.0;
            } else if (inputDist <= 100.0) {
                calculatedFee = 200000.0;
            } else {
                calculatedFee = 300000.0;
            }
            travelFee = BigDecimal.valueOf(calculatedFee).setScale(2, RoundingMode.HALF_UP);
        }

        // Chiết khấu giảm 15% cho gói Tiết Kiệm (SAVING) khi nhóm từ 2 người trở lên
        BigDecimal discountAmount = BigDecimal.ZERO;
        if ("SAVING".equalsIgnoreCase(request.getDispatchPlan()) && request.getItems().size() >= 2) {
            discountAmount = servicesPrice.multiply(BigDecimal.valueOf(0.15)).setScale(-3, RoundingMode.HALF_UP);
        }

        // Áp dụng mã Voucher khuyến mãi nếu có
        Voucher appliedVoucher = null;
        if (request.getVoucherCode() != null && !request.getVoucherCode().isBlank()) {
            String vCode = request.getVoucherCode().trim().toUpperCase();
            try {
                VoucherApplyResponse vResp = voucherService.calculateVoucherDiscount(
                        VoucherApplyRequest.builder().code(vCode).orderAmount(servicesPrice).build(),
                        currentUser.getId());
                Optional<Voucher> vOpt = voucherRepository.findByCodeIgnoreCase(vCode);
                if (vOpt.isPresent()) {
                    Voucher v = vOpt.get();
                    appliedVoucher = v;
                    discountAmount = discountAmount.add(vResp.getDiscountAmount());
                    voucherService.incrementUsedCount(v.getId());
                    if (v.getVoucherScope() == com.bookingmakeup.enums.VoucherScope.PERSONAL) {
                        voucherService.markPersonalVoucherUsed(currentUser.getId(), v.getId());
                    }
                }
            } catch (Exception e) {
                log.warn("Lỗi khi áp dụng voucher '{}' cho user ID {}: {}", vCode, currentUser.getId(), e.getMessage());
                throw new BadRequestException("Không thể áp dụng voucher: " + e.getMessage());
            }
        }

        BigDecimal totalPrice = servicesPrice.subtract(discountAmount).add(travelFee).add(surcharge);
        if (totalPrice.compareTo(BigDecimal.ZERO) < 0) {
            totalPrice = BigDecimal.ZERO;
        }
        // Tiền cọc 30% tổng giá trị đơn
        BigDecimal depositAmount = totalPrice.multiply(BigDecimal.valueOf(0.3)).setScale(0, RoundingMode.HALF_UP);

        // 4. Tìm phong cách MakeupLayout nếu có
        MakeupLayout selectedLayout = null;
        if (request.getLayoutId() != null) {
            selectedLayout = makeupLayoutRepository.findById(request.getLayoutId()).orElse(null);
        } else if (request.getLayout() != null && !request.getLayout().isBlank()) {
            selectedLayout = makeupLayoutRepository.findByCode(request.getLayout()).orElse(null);
        }

        String layoutName = request.getLayout();
        if ((layoutName == null || layoutName.isBlank()) && selectedLayout != null) {
            layoutName = selectedLayout.getName();
        }

        if (request.getContactPhone() != null && !request.getContactPhone().isBlank()) {
            customer.setPhone(request.getContactPhone().trim());
            userRepository.save(customer);
        }

        String finalNotes = request.getNotes();
        boolean hasContactPhone = request.getContactPhone() != null && !request.getContactPhone().isBlank();
        boolean hasContactEmail = request.getContactEmail() != null && !request.getContactEmail().isBlank();
        if (hasContactPhone || hasContactEmail) {
            StringBuilder contactInfo = new StringBuilder("[Xác nhận liên hệ:");
            if (hasContactPhone) {
                contactInfo.append(" SĐT ").append(request.getContactPhone().trim());
            }
            if (hasContactEmail) {
                contactInfo.append(" | Email: ").append(request.getContactEmail().trim());
            }
            contactInfo.append("]");
            finalNotes = (finalNotes != null && !finalNotes.isBlank()) ? (finalNotes + "\n" + contactInfo)
                    : contactInfo.toString();
        }

        // 4. Lưu đơn Booking cha
        Booking booking = Booking.builder()
                .user(customer)
                .bookingDate(request.getBookingDate())
                .bookingTime(request.getBookingTime())
                .targetEndTime(request.getTargetEndTime())
                .locationType(request.getLocationType())
                .executionMode(request.getExecutionMode())
                .artistCount(request.getArtistCount() != null ? request.getArtistCount() : 1)
                .dispatchPlan(request.getDispatchPlan() != null ? request.getDispatchPlan() : "SAVING")
                .makeupLayout(selectedLayout)
                .voucher(appliedVoucher)
                .voucherCode(appliedVoucher != null ? appliedVoucher.getCode() : null)
                .discountAmount(discountAmount)
                .layout(layoutName)
                .customerImage(request.getCustomerImage())
                .notes(finalNotes)
                .status(BookingStatus.PENDING_PAYMENT)
                .totalPrice(totalPrice)
                .surcharge(surcharge)
                .depositAmount(depositAmount)
                .build();

        Booking savedBooking = bookingRepository.save(booking);

        // 5. Lưu địa chỉ nếu tại nhà
        if (request.getLocationType() == LocationType.HOME) {
            BookingAddress bookingAddress = BookingAddress.builder()
                    .booking(savedBooking)
                    .address(homeAddress)
                    .distanceKm(distanceKm)
                    .travelFee(travelFee)
                    .build();
            bookingAddressRepository.save(bookingAddress);
            savedBooking.setBookingAddress(bookingAddress);
        }

        // 6. Lưu các ca BookingItem con
        List<BookingItemResponse> itemResponses = new ArrayList<>();
        for (PreparedItem pItem : preparedItems) {
            BookingItem bookingItem = BookingItem.builder()
                    .booking(savedBooking)
                    .makeupService(pItem.service)
                    .makeupArtist(pItem.artist)
                    .startTime(pItem.startTime)
                    .endTime(pItem.endTime)
                    .price(pItem.price)
                    .build();

            BookingItem savedItem = bookingItemRepository.save(bookingItem);

            itemResponses.add(BookingItemResponse.builder()
                    .id(savedItem.getId())
                    .makeupServiceId(pItem.service.getId())
                    .serviceName(pItem.service.getServiceName())
                    .makeupArtistId(pItem.artist.getId())
                    .artistName(pItem.artist.getUser().getFullName())
                    .startTime(savedItem.getStartTime())
                    .endTime(savedItem.getEndTime())
                    .price(savedItem.getPrice())
                    .build());
        }

        log.info("Tạo thành công đơn đặt lịch ID: {} cho khách hàng: {}", savedBooking.getId(), customer.getEmail());

        return mapToResponse(savedBooking, servicesPrice, travelFee, homeAddress, distanceKm, itemResponses);
    }

    /**
     * Tự động quét và hủy các đơn hàng ở trạng thái PENDING_PAYMENT quá 15 phút
     * chưa hoàn tất cọc
     */
    @Scheduled(fixedRate = 60000)
    @Transactional
    public void cancelExpiredPendingBookings() {
        LocalDateTime threshold = LocalDateTime.now().minusMinutes(15);
        List<Booking> expiredBookings = bookingRepository.findByStatusAndCreatedAtBefore(BookingStatus.PENDING_PAYMENT,
                threshold);
        for (Booking b : expiredBookings) {
            b.setStatus(BookingStatus.CANCELLED);
            String oldNotes = b.getNotes() != null ? b.getNotes() : "";
            b.setNotes(("[Tự động hủy: Quá hạn 15 phút chưa thanh toán cọc] " + oldNotes).trim());
            bookingRepository.save(b);
            log.info("Tự động hủy đơn đặt lịch #{} do quá hạn 15 phút chưa hoàn tất thanh toán cọc VNPay", b.getId());
        }
    }

    /**
     * Lấy toàn bộ danh sách đơn đặt lịch hẹn cho Quản trị viên (sắp xếp mới nhất
     * lên đầu, loại bỏ đơn PENDING_PAYMENT)
     */
    @Transactional
    public List<BookingResponse> getAllBookings() {
        // Quét đơn quá hạn trước
        cancelExpiredPendingBookings();

        // Đơn nào đặt sau thì hiện trước (sắp xếp theo ngày tạo createdAt và ID giảm
        // dần)
        List<Booking> bookings = bookingRepository.findAllByOrderByCreatedAtDescIdDesc();
        for (Booking b : bookings) {
            if (b.getNotes() != null && (b.getNotes().contains("[Lý do hủy") || b.getNotes().contains("[HOÀN CỌC")
                    || b.getNotes().contains("[ĐÃ HOÀN CỌC"))) {
                if (b.getStatus() != BookingStatus.CANCELLED) {
                    b.setStatus(BookingStatus.CANCELLED);
                    bookingRepository.save(b);
                }
            }
        }
        // Trang Admin chỉ hiện đơn đã cọc hoặc chọn thanh toán tại studio (loại bỏ đơn
        // PENDING_PAYMENT thanh toán sau)
        return bookings.stream()
                .filter(b -> b.getStatus() != BookingStatus.PENDING_PAYMENT)
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Lấy danh sách lịch sử đặt lịch của khách hàng hiện tại (Admin có thể xem tất
     * cả)
     */
    @Transactional
    public List<BookingResponse> getMyBookings(UserPrincipal currentUser) {
        cancelExpiredPendingBookings();

        List<Booking> bookings;
        if ("ROLE_ADMIN".equals(currentUser.getRole())) {
            bookings = bookingRepository.findAllByOrderByCreatedAtDesc();
        } else {
            bookings = bookingRepository.findByUserIdOrderByCreatedAtDesc(currentUser.getId());
        }

        // Tự động kiểm tra và chuẩn hóa trạng thái CANCELLED cho các đơn có ghi chú hủy
        for (Booking b : bookings) {
            if (b.getNotes() != null && (b.getNotes().contains("[Lý do hủy") || b.getNotes().contains("[HOÀN CỌC")
                    || b.getNotes().contains("[ĐÃ HOÀN CỌC") || b.getNotes().contains("[Tự động hủy"))) {
                if (b.getStatus() != BookingStatus.CANCELLED) {
                    b.setStatus(BookingStatus.CANCELLED);
                    bookingRepository.save(b);
                }
            }
        }

        if ("ROLE_ADMIN".equals(currentUser.getRole())) {
            return bookings.stream()
                    .filter(b -> b.getStatus() != BookingStatus.PENDING_PAYMENT)
                    .map(this::mapToResponse)
                    .collect(Collectors.toList());
        } else {
            return bookings.stream()
                    .map(this::mapToResponse)
                    .collect(Collectors.toList());
        }
    }

    /**
     * Cập nhật trạng thái tiến trình của đơn đặt lịch
     * Ràng buộc: Đối với COMPLETED, bắt buộc đơn hàng phải đã thu đủ 100% tiền từ
     * khách hàng.
     */
    @Transactional
    public BookingResponse updateBookingStatus(Long id, BookingStatus newStatus) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking", "id", id));

        // Kiểm tra nếu đơn đặt lịch đã bị hủy thì không cho phép chuyển trạng thái khác
        // (đặc biệt là COMPLETED)
        boolean hasCancelNote = booking.getNotes() != null
                && (booking.getNotes().contains("[Lý do hủy") || booking.getNotes().contains("[HOÀN CỌC")
                        || booking.getNotes().contains("[ĐÃ HOÀN CỌC") || booking.getNotes().contains("[Tự động hủy"));
        if ((booking.getStatus() == BookingStatus.CANCELLED || hasCancelNote) && newStatus != BookingStatus.CANCELLED) {
            throw new BadRequestException("Đơn đặt lịch đã bị hủy, không thể thay đổi trạng thái sang " + newStatus);
        }

        if (newStatus == BookingStatus.COMPLETED) {
            List<Payment> payments = paymentRepository.findByBookingId(id);
            BigDecimal totalPaid = BigDecimal.ZERO;
            if (payments != null) {
                for (Payment p : payments) {
                    if (p.getStatus() == PaymentStatus.PAID) {
                        totalPaid = totalPaid.add(p.getAmount() != null ? p.getAmount() : BigDecimal.ZERO);
                    }
                }
            }
            BigDecimal totalPrice = booking.getTotalPrice() != null ? booking.getTotalPrice() : BigDecimal.ZERO;
            boolean hasCollectedNote = booking.getNotes() != null && booking.getNotes().contains("[ĐÃ THU ĐỦ TIỀN");
            boolean isFullyPaid = hasCollectedNote
                    || (totalPrice.compareTo(BigDecimal.ZERO) > 0 && totalPaid.compareTo(totalPrice) >= 0)
                    || (totalPrice.compareTo(BigDecimal.ZERO) == 0);
            if (!isFullyPaid) {
                throw new BadRequestException(
                        "Bạn phải bấm xác nhận 'Đã Thu Tiền' từ khách hàng trước khi hoàn thành đơn đặt lịch!");
            }
        }

        booking.setStatus(newStatus);
        Booking updated = bookingRepository.save(booking);
        log.info("Cập nhật trạng thái đơn đặt lịch ID: {} sang {}", id, newStatus);
        return mapToResponse(updated);
    }

    /**
     * Admin xác nhận đã thu đủ số tiền thanh toán còn lại (70% hoặc 100% tại
     * studio)
     */
    @Transactional
    public BookingResponse collectPayment(Long id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking", "id", id));

        List<Payment> payments = paymentRepository.findByBookingId(id);
        BigDecimal totalPaid = BigDecimal.ZERO;
        if (payments != null) {
            for (Payment p : payments) {
                if (p.getStatus() == PaymentStatus.PAID) {
                    totalPaid = totalPaid.add(p.getAmount() != null ? p.getAmount() : BigDecimal.ZERO);
                }
            }
        }

        BigDecimal totalPrice = booking.getTotalPrice() != null ? booking.getTotalPrice() : BigDecimal.ZERO;
        BigDecimal remaining = totalPrice.subtract(totalPaid).max(BigDecimal.ZERO);

        if (remaining.compareTo(BigDecimal.ZERO) > 0) {
            Payment cashPayment = Payment.builder()
                    .booking(booking)
                    .amount(remaining)
                    .paymentMethod(PaymentMethod.CASH)
                    .status(PaymentStatus.PAID)
                    .transactionCode("ADMIN_COLLECTED_" + id + "_" + System.currentTimeMillis())
                    .paymentDate(LocalDateTime.now())
                    .build();
            paymentRepository.save(cashPayment);
        }

        String currentNotes = booking.getNotes() != null ? booking.getNotes() : "";
        if (!currentNotes.contains("[ĐÃ THU ĐỦ TIỀN")) {
            booking.setNotes(("[ĐÃ THU ĐỦ TIỀN] " + currentNotes).trim());
            bookingRepository.save(booking);
        }

        log.info("Admin đã xác nhận thu tiền cho đơn đặt lịch ID: {}", id);
        return mapToResponse(booking);
    }

    /**
     * Admin xác nhận đã chuyển khoản hoàn trả tiền cọc cho khách hàng
     */
    @Transactional
    public BookingResponse confirmRefund(Long id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking", "id", id));
        String currentNotes = booking.getNotes() != null ? booking.getNotes() : "";
        String updatedNotes;
        if (currentNotes.contains("[HOÀN CỌC")) {
            updatedNotes = currentNotes.replace("[HOÀN CỌC", "[ĐÃ HOÀN CỌC");
        } else if (!currentNotes.contains("[ĐÃ HOÀN CỌC")) {
            updatedNotes = "[ĐÃ HOÀN CỌC] " + currentNotes;
        } else {
            updatedNotes = currentNotes;
        }
        booking.setNotes(updatedNotes.trim());
        booking.setStatus(BookingStatus.CANCELLED);
        Booking saved = bookingRepository.save(booking);
        log.info("Admin đã xác nhận hoàn cọc cho đơn booking ID: {}", id);
        return mapToResponse(saved);
    }

    /**
     * Khách hàng hoặc Admin hủy đơn đặt lịch hẹn
     * Kiểm tra chính sách hủy: Trước 24h hỗ trợ hoàn tiền cọc, dưới 24h mất cọc
     * theo quy định.
     */
    @Transactional
    public BookingResponse cancelBooking(Long id, UserPrincipal currentUser, String reason) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking", "id", id));

        boolean isOwner = booking.getUser().getId().equals(currentUser.getId());
        boolean isAdmin = currentUser.getRole().equals("ROLE_ADMIN");

        if (!isOwner && !isAdmin) {
            throw new BadRequestException("Bạn không có quyền hủy đơn đặt lịch này");
        }

        if (booking.getStatus() == BookingStatus.COMPLETED) {
            throw new BadRequestException("Không thể hủy đơn đặt lịch đã hoàn thành");
        }

        if (booking.getStatus() == BookingStatus.CANCELLED) {
            throw new BadRequestException("Đơn đặt lịch này đã được hủy trước đó");
        }

        booking.setStatus(BookingStatus.CANCELLED);
        if (booking.getVoucher() != null) {
            voucherService.releasePersonalVoucher(booking.getUser().getId(), booking.getVoucher().getId());
        }
        if (reason != null && !reason.trim().isEmpty()) {
            String currentNotes = booking.getNotes() != null ? booking.getNotes() : "";
            booking.setNotes((currentNotes + " [Lý do hủy: " + reason.trim() + "]").trim());
        }

        Booking updated = bookingRepository.save(booking);
        log.info("Người dùng {} đã hủy đơn đặt lịch ID: {}, lý do: {}", currentUser.getUsername(), id, reason);
        return mapToResponse(updated);
    }

    private boolean isArtistAvailableExcludingBooking(Long artistId, LocalDate date, LocalTime startTime,
            LocalTime endTime, Long excludeBookingId) {
        MakeupArtist artist = makeupArtistRepository.findById(artistId).orElse(null);
        if (artist == null || !Boolean.TRUE.equals(artist.getActive())) {
            return false;
        }
        Optional<ArtistSchedule> scheduleOpt = artistScheduleRepository.findByMakeupArtistIdAndScheduleDate(artistId,
                date);
        if (scheduleOpt.isPresent()) {
            ArtistSchedule schedule = scheduleOpt.get();
            if (Boolean.TRUE.equals(schedule.getIsDayOff())) {
                return false;
            }
            if (startTime.isBefore(schedule.getStartTime()) || endTime.isAfter(schedule.getEndTime())) {
                return false;
            }
        }
        List<BookingItem> overlaps = bookingItemRepository.findOverlappingItems(artistId, date, startTime, endTime);
        for (BookingItem conflict : overlaps) {
            if (conflict.getBooking() != null && !conflict.getBooking().getId().equals(excludeBookingId)) {
                return false;
            }
        }
        return true;
    }

    /**
     * Khách hàng chỉnh sửa thông tin đơn đặt lịch (Đổi ngày/giờ hẹn, phong cách
     * makeup, địa chỉ đón tiếp)
     * Ràng buộc nghiệp vụ: Chỉ cho phép chỉnh sửa trước thời điểm diễn ra lịch hẹn
     * tối thiểu 12 tiếng.
     */
    @Transactional
    public BookingResponse updateCustomerBooking(Long id, UserPrincipal currentUser,
            CustomerBookingUpdateRequest request) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking", "id", id));

        boolean isOwner = booking.getUser().getId().equals(currentUser.getId());
        boolean isAdmin = "ROLE_ADMIN".equals(currentUser.getRole());

        if (!isOwner && !isAdmin) {
            throw new BadRequestException("Bạn không có quyền chỉnh sửa đơn đặt lịch này");
        }

        boolean isCancelled = booking.getStatus() == BookingStatus.CANCELLED
                || (booking.getNotes() != null && (booking.getNotes().contains("[Lý do hủy")
                        || booking.getNotes().contains("[HOÀN CỌC")
                        || booking.getNotes().contains("[ĐÃ HOÀN CỌC")
                        || booking.getNotes().contains("[Tự động hủy")));
        if (isCancelled) {
            throw new BadRequestException("Không thể chỉnh sửa đơn đặt lịch đã bị hủy");
        }

        if (booking.getStatus() == BookingStatus.COMPLETED || booking.getStatus() == BookingStatus.IN_PROGRESS) {
            throw new BadRequestException("Không thể chỉnh sửa đơn đặt lịch đang thực hiện hoặc đã hoàn thành");
        }

        // Kiểm tra điều kiện 1: Thời gian bắt đầu của đơn hiện tại phải cách thời điểm
        // hiện tại tối thiểu 12 tiếng
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime currentStart = LocalDateTime.of(booking.getBookingDate(), booking.getBookingTime());
        long minutesUntilCurrentStart = java.time.Duration.between(now, currentStart).toMinutes();
        if (!isAdmin && minutesUntilCurrentStart < 12 * 60) {
            throw new BadRequestException(String.format(
                    "Chỉ được phép chỉnh sửa đơn hẹn trước ít nhất 12 tiếng so với giờ bắt đầu hiện tại (%s ngày %s)!",
                    booking.getBookingTime(), booking.getBookingDate()));
        }

        LocalDate newDate = request.getBookingDate();
        LocalTime newTime = request.getBookingTime();

        if (newTime.isBefore(LocalTime.of(6, 0)) || newTime.isAfter(LocalTime.of(21, 0))) {
            throw new BadRequestException("Giờ bắt đầu phải nằm trong khung giờ phục vụ từ 06:00 đến 21:00");
        }

        // Kiểm tra điều kiện 2: Thời gian hẹn mới cũng phải cách thời điểm hiện tại tối
        // thiểu 12 tiếng
        LocalDateTime newStart = LocalDateTime.of(newDate, newTime);
        long minutesUntilNewStart = java.time.Duration.between(now, newStart).toMinutes();
        if (!isAdmin && minutesUntilNewStart < 12 * 60) {
            throw new BadRequestException(String.format(
                    "Thời gian hẹn mới (%s ngày %s) phải cách thời điểm hiện tại tối thiểu 12 tiếng!",
                    newTime, newDate));
        }

        if (!newDate.equals(booking.getBookingDate()) || !newTime.equals(booking.getBookingTime())) {

            List<BookingItem> items = bookingItemRepository.findByBookingId(booking.getId());
            LocalTime oldBookingTime = booking.getBookingTime();
            List<MakeupArtist> activeArtists = makeupArtistRepository.findAll().stream()
                    .filter(a -> Boolean.TRUE.equals(a.getActive()))
                    .sorted(createFairWorkloadComparator(newDate))
                    .toList();

            LocalTime maxItemEnd = newTime;
            // Track slots assigned within this booking during update
            Map<Long, List<LocalTime[]>> assignedInSameBooking = new HashMap<>();

            for (BookingItem item : items) {
                long offsetMins = oldBookingTime != null && item.getStartTime() != null
                        ? Math.max(0, java.time.Duration.between(oldBookingTime, item.getStartTime()).toMinutes())
                        : 0;
                long durationMins = (item.getStartTime() != null && item.getEndTime() != null)
                        ? java.time.Duration.between(item.getStartTime(), item.getEndTime()).toMinutes()
                        : (item.getMakeupService() != null && item.getMakeupService().getDuration() != null
                                ? item.getMakeupService().getDuration()
                                : 60);
                if (durationMins <= 0) {
                    durationMins = 60;
                }

                LocalTime itemNewStart = newTime.plusMinutes(offsetMins);
                LocalTime itemNewEnd = itemNewStart.plusMinutes(durationMins);
                if (itemNewEnd.isAfter(maxItemEnd)) {
                    maxItemEnd = itemNewEnd;
                }

                MakeupArtist chosenArtist = null;
                MakeupArtist currentArtist = item.getMakeupArtist();

                if (currentArtist != null && isArtistAvailableExcludingBooking(currentArtist.getId(), newDate,
                        itemNewStart, itemNewEnd, booking.getId())) {
                    boolean internalConflict = assignedInSameBooking
                            .getOrDefault(currentArtist.getId(), Collections.emptyList())
                            .stream().anyMatch(slot -> slot[0].isBefore(itemNewEnd) && slot[1].isAfter(itemNewStart));
                    if (!internalConflict) {
                        chosenArtist = currentArtist;
                    }
                }

                if (chosenArtist == null) {
                    for (MakeupArtist candidate : activeArtists) {
                        if (isArtistAvailableExcludingBooking(candidate.getId(), newDate, itemNewStart, itemNewEnd,
                                booking.getId())) {
                            boolean internalConflict = assignedInSameBooking
                                    .getOrDefault(candidate.getId(), Collections.emptyList())
                                    .stream()
                                    .anyMatch(slot -> slot[0].isBefore(itemNewEnd) && slot[1].isAfter(itemNewStart));
                            if (!internalConflict) {
                                chosenArtist = candidate;
                                break;
                            }
                        }
                    }
                }

                if (chosenArtist == null) {
                    throw new BadRequestException(String.format(
                            "Khung giờ mới (%s - %s ngày %s) đã kín lịch tất cả chuyên viên trang điểm. Quý khách vui lòng chọn khung giờ khác!",
                            itemNewStart, itemNewEnd, newDate));
                }

                item.setMakeupArtist(chosenArtist);
                item.setStartTime(itemNewStart);
                item.setEndTime(itemNewEnd);
                bookingItemRepository.save(item);

                assignedInSameBooking.computeIfAbsent(chosenArtist.getId(), k -> new ArrayList<>())
                        .add(new LocalTime[] { itemNewStart, itemNewEnd });
            }

            booking.setBookingDate(newDate);
            booking.setBookingTime(newTime);
            if (booking.getTargetEndTime() != null) {
                booking.setTargetEndTime(maxItemEnd);
            }
        }

        // Cập nhật phong cách (Layout)
        if (request.getLayout() != null) {
            String trimmedLayout = request.getLayout().trim();
            booking.setLayout(trimmedLayout.isEmpty() ? null : trimmedLayout);
            if (!trimmedLayout.isEmpty()) {
                makeupLayoutRepository.findByCode(trimmedLayout)
                        .or(() -> makeupLayoutRepository.findAll().stream()
                                .filter(l -> trimmedLayout.equalsIgnoreCase(l.getName()))
                                .findFirst())
                        .ifPresent(booking::setMakeupLayout);
            }
        }

        // Cập nhật ảnh chân dung
        if (request.getCustomerImage() != null) {
            String trimmedImg = request.getCustomerImage().trim();
            booking.setCustomerImage(trimmedImg.isEmpty() ? null : trimmedImg);
        }

        // Cập nhật số điện thoại khách hàng
        if (request.getContactPhone() != null && !request.getContactPhone().isBlank()) {
            User customer = booking.getUser();
            customer.setPhone(request.getContactPhone().trim());
            userRepository.save(customer);
        }

        // Cập nhật địa chỉ nếu là đơn tại nhà (HOME)
        if (booking.getLocationType() == LocationType.HOME && request.getAddress() != null
                && !request.getAddress().isBlank()) {
            BookingAddress bookingAddress = booking.getBookingAddress();
            if (bookingAddress != null) {
                bookingAddress.setAddress(request.getAddress().trim());
                bookingAddressRepository.save(bookingAddress);
            }
        }

        // Cập nhật ghi chú (giữ lại các tag hệ thống nếu có)
        if (request.getNotes() != null) {
            String existingNotes = booking.getNotes() != null ? booking.getNotes() : "";
            boolean hadCollectedTag = existingNotes.contains("[ĐÃ THU ĐỦ TIỀN]");
            String cleanUserNote = request.getNotes().trim();
            if (hadCollectedTag && !cleanUserNote.contains("[ĐÃ THU ĐỦ TIỀN]")) {
                cleanUserNote = ("[ĐÃ THU ĐỦ TIỀN] " + cleanUserNote).trim();
            }
            booking.setNotes(cleanUserNote);
        }

        Booking saved = bookingRepository.save(booking);
        log.info("Khách hàng {} đã cập nhật đơn đặt lịch #{}", currentUser.getUsername(), id);
        return mapToResponse(saved);
    }

    /**
     * Lấy thông tin chi tiết của một đơn đặt lịch theo ID
     * Kiểm tra phân quyền: Khách chỉ xem được đơn của mình, Admin và Artist được
     * phép xem mọi đơn.
     */
    @Transactional(readOnly = true)
    public BookingResponse getBookingById(Long id, UserPrincipal currentUser) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking", "id", id));

        boolean isOwner = booking.getUser().getId().equals(currentUser.getId());
        boolean isStaff = currentUser.getRole().equals("ROLE_ADMIN") || currentUser.getRole().equals("ROLE_ARTIST");

        if (!isOwner && !isStaff) {
            throw new BadRequestException("Bạn không có quyền xem thông tin đơn đặt lịch này");
        }

        return mapToResponse(booking);
    }

    private List<PreparedItem> prepareBookingItems(BookingRequest request) {
        List<PreparedItem> prepared = new ArrayList<>();
        List<MakeupArtist> activeArtists = makeupArtistRepository.findAll().stream()
                .filter(a -> Boolean.TRUE.equals(a.getActive()))
                .toList();

        if (activeArtists.isEmpty()) {
            throw new BadRequestException("Hệ thống hiện chưa có thợ trang điểm nào sẵn sàng nhận lịch");
        }

        int maxArtists = activeArtists.size();
        int itemCount = request.getItems() != null ? request.getItems().size() : 1;
        int defaultSpeedCount = itemCount <= 3 ? Math.min(3, maxArtists) : Math.min(maxArtists, itemCount);
        int defaultBalancedCount = itemCount <= 3 ? Math.min(2, maxArtists)
                : Math.max(2, (int) Math.round(defaultSpeedCount * 0.6));
        if (defaultSpeedCount >= 3 && defaultBalancedCount >= defaultSpeedCount) {
            defaultBalancedCount = defaultSpeedCount - 1;
        }

        int targetArtistCount = request.getArtistCount() != null && request.getArtistCount() > 0
                ? request.getArtistCount()
                : ("SPEED".equalsIgnoreCase(request.getDispatchPlan()) ? defaultSpeedCount
                        : ("BALANCED".equalsIgnoreCase(request.getDispatchPlan()) ? defaultBalancedCount : 1));
        targetArtistCount = Math.min(targetArtistCount, maxArtists);

        // Sử dụng thuật toán điều phối thông minh (Smart Dispatch)
        if (targetArtistCount > 1 || request.getDispatchPlan() != null) {
            List<BookingItemTask> tasks = new ArrayList<>();
            for (BookingItemRequest itemReq : request.getItems()) {
                MakeupService service = makeupServiceRepository.findById(itemReq.getMakeupServiceId())
                        .orElseThrow(() -> new ResourceNotFoundException("MakeupService", "id",
                                itemReq.getMakeupServiceId()));
                if (!Boolean.TRUE.equals(service.getActive())) {
                    throw new BadRequestException("Dịch vụ '" + service.getServiceName() + "' hiện không hoạt động");
                }
                tasks.add(new BookingItemTask(service, itemReq));
            }

            // Sắp xếp thợ có thời lượng công việc dài nhất lên đầu để cân bằng tải
            tasks.sort((a, b) -> Integer.compare(b.service.getDuration(), a.service.getDuration()));

            LocalTime sessionStart = request.getBookingTime();
            int totalMins = tasks.stream().mapToInt(t -> t.service.getDuration()).sum();
            int approxDuration = Math.max(30, (totalMins + targetArtistCount - 1) / targetArtistCount);
            LocalTime sessionEnd = request.getTargetEndTime() != null
                    ? request.getTargetEndTime()
                    : sessionStart.plusMinutes(approxDuration);

            // Kiểm tra các chuyên viên ĐANG RẢNH trong khung giờ này
            List<MakeupArtist> availableArtists = new ArrayList<>();
            List<MakeupArtist> busyArtists = new ArrayList<>();
            for (MakeupArtist a : activeArtists) {
                if (checkSlotAvailability(a.getId(), request.getBookingDate(), sessionStart, sessionEnd)) {
                    availableArtists.add(a);
                } else {
                    busyArtists.add(a);
                }
            }

            // Sắp xếp các chuyên viên theo thuật toán cân bằng tải công việc trong tháng

            Comparator<MakeupArtist> fairComparator = createFairWorkloadComparator(request.getBookingDate());
            availableArtists.sort(fairComparator);
            busyArtists.sort(fairComparator);

            if (availableArtists.isEmpty()) {
                throw new BadRequestException(String.format(
                        "Tất cả chuyên viên đều đã có lịch hẹn kín hoặc bận trong khung giờ %s - %s ngày %s. Quý khách vui lòng chọn khung giờ khác!",
                        sessionStart, sessionEnd, request.getBookingDate()));
            }

            List<MakeupArtist> candidateArtists = new ArrayList<>();
            if (request.getDefaultArtistId() != null) {
                // Nếu khách chỉ định thợ và thợ đó rảnh
                availableArtists.stream()
                        .filter(a -> a.getId().equals(request.getDefaultArtistId()))
                        .findFirst()
                        .ifPresent(candidateArtists::add);

                // Nếu khách chỉ định thợ nhưng thợ bận, vẫn thêm để validateSlotAvailability
                // báo lỗi rõ ràng về thợ đó
                if (candidateArtists.isEmpty()) {
                    activeArtists.stream()
                            .filter(a -> a.getId().equals(request.getDefaultArtistId()))
                            .findFirst()
                            .ifPresent(candidateArtists::add);
                }
            }

            // Ưu tiên các chuyên viên ĐANG RẢNH (chưa có lịch hẹn)
            for (MakeupArtist a : availableArtists) {
                if (!candidateArtists.contains(a)) {
                    candidateArtists.add(a);
                }
            }
            // Thợ bận chỉ làm fallback nếu thiếu người
            for (MakeupArtist a : busyArtists) {
                if (!candidateArtists.contains(a)) {
                    candidateArtists.add(a);
                }
            }

            List<MakeupArtist> assignedArtists = new ArrayList<>();
            for (MakeupArtist a : candidateArtists) {
                if (assignedArtists.size() >= targetArtistCount)
                    break;
                assignedArtists.add(a);
            }
            if (assignedArtists.isEmpty()) {
                assignedArtists.add(activeArtists.get(0));
            }

            List<BookingArtistQueue> queues = new ArrayList<>();
            for (MakeupArtist artist : assignedArtists) {
                queues.add(new BookingArtistQueue(artist));
            }

            for (BookingItemTask task : tasks) {
                BookingArtistQueue targetQueue = null;
                if (task.itemReq.getMakeupArtistId() != null) {
                    targetQueue = queues.stream()
                            .filter(q -> q.artist.getId().equals(task.itemReq.getMakeupArtistId()))
                            .findFirst()
                            .orElse(null);
                }
                // Tham lam chọn thợ đang có thời lượng ngắn nhất
                if (targetQueue == null) {
                    targetQueue = queues.stream().min(Comparator.comparingInt(q -> q.totalDuration))
                            .orElse(queues.get(0));
                }
                targetQueue.tasks.add(task);
                targetQueue.totalDuration += task.service.getDuration();
            }

            for (BookingArtistQueue q : queues) {
                LocalTime pointer = sessionStart;
                for (BookingItemTask t : q.tasks) {
                    LocalTime slotEnd = pointer.plusMinutes(t.service.getDuration());
                    validateSlotAvailability(q.artist.getId(), request.getBookingDate(), pointer, slotEnd);
                    prepared.add(new PreparedItem(t.service, q.artist, pointer, slotEnd, t.service.getPrice()));
                    pointer = slotEnd;
                }
            }

            return prepared;
        }

        // Chế độ tương thích ngược cũ (Legacy SINGLE, PARALLEL, SEQUENTIAL, ASSISTED)
        LocalTime currentPointer = request.getBookingTime();
        Set<Long> parallelArtistIds = new HashSet<>();
        Comparator<MakeupArtist> legacyFairComparator = createFairWorkloadComparator(request.getBookingDate());
        List<MakeupArtist> activeArtistsSorted = activeArtists.stream().sorted(legacyFairComparator).toList();

        for (int i = 0; i < request.getItems().size(); i++) {
            BookingItemRequest itemReq = request.getItems().get(i);
            MakeupService service = makeupServiceRepository.findById(itemReq.getMakeupServiceId())
                    .orElseThrow(
                            () -> new ResourceNotFoundException("MakeupService", "id", itemReq.getMakeupServiceId()));

            if (!Boolean.TRUE.equals(service.getActive())) {
                throw new BadRequestException("Dịch vụ '" + service.getServiceName() + "' hiện không hoạt động");
            }

            LocalTime slotStart;
            LocalTime slotEnd;

            if (request.getExecutionMode() == ExecutionMode.PARALLEL) {
                slotStart = request.getBookingTime();
                slotEnd = slotStart.plusMinutes(service.getDuration());
            } else if (request.getExecutionMode() == ExecutionMode.SEQUENTIAL) {
                slotStart = currentPointer;
                slotEnd = slotStart.plusMinutes(service.getDuration());
            } else if (request.getExecutionMode() == ExecutionMode.ASSISTED) {
                int effectiveDuration = Math.max(30, (int) Math.round(service.getDuration() * 0.7));
                slotStart = currentPointer;
                slotEnd = slotStart.plusMinutes(effectiveDuration);
            } else {
                slotStart = request.getBookingTime();
                slotEnd = slotStart.plusMinutes(service.getDuration());
            }

            Long resolvedArtistId = itemReq.getMakeupArtistId() != null ? itemReq.getMakeupArtistId()
                    : request.getDefaultArtistId();
            if (request.getExecutionMode() == ExecutionMode.PARALLEL) {
                if (resolvedArtistId == null || parallelArtistIds.contains(resolvedArtistId)) {
                    final LocalTime fStart = slotStart;
                    final LocalTime fEnd = slotEnd;
                    resolvedArtistId = activeArtistsSorted.stream()
                            .map(MakeupArtist::getId)
                            .filter(id -> !parallelArtistIds.contains(id)
                                    && checkSlotAvailability(id, request.getBookingDate(), fStart, fEnd))
                            .findFirst()
                            .orElse(activeArtistsSorted.stream()
                                    .map(MakeupArtist::getId)
                                    .filter(id -> !parallelArtistIds.contains(id))
                                    .findFirst()
                                    .orElse(activeArtistsSorted.get(i % activeArtistsSorted.size()).getId()));
                }
            } else if (resolvedArtistId == null) {
                final LocalTime fStart = slotStart;
                final LocalTime fEnd = slotEnd;
                resolvedArtistId = activeArtistsSorted.stream()
                        .map(MakeupArtist::getId)
                        .filter(id -> checkSlotAvailability(id, request.getBookingDate(), fStart, fEnd))
                        .findFirst()
                        .orElse(activeArtistsSorted.get(0).getId());
            }

            final Long artistId = resolvedArtistId;
            MakeupArtist artist = makeupArtistRepository.findById(artistId)
                    .orElseThrow(() -> new ResourceNotFoundException("MakeupArtist", "id", artistId));

            if (request.getExecutionMode() == ExecutionMode.PARALLEL) {
                if (parallelArtistIds.contains(artistId)) {
                    throw new BadRequestException(
                            "Chế độ PARALLEL yêu cầu mỗi dịch vụ đồng thời phải do một thợ khác nhau thực hiện. Thợ ID: "
                                    + artistId + " bị trùng.");
                }
                parallelArtistIds.add(artistId);
            } else {
                currentPointer = slotEnd;
            }

            validateSlotAvailability(artistId, request.getBookingDate(), slotStart, slotEnd);
            prepared.add(new PreparedItem(service, artist, slotStart, slotEnd, service.getPrice()));
        }

        return prepared;
    }

    private record PreparedItem(
            MakeupService service,
            MakeupArtist artist,
            LocalTime startTime,
            LocalTime endTime,
            BigDecimal price) {
    }

    private record ServiceTask(
            Long serviceId,
            String serviceName,
            int duration,
            BigDecimal price) {
    }

    private static class ArtistQueue {
        MakeupArtist artist;
        int totalDuration = 0;
        final List<ServiceTask> tasks = new ArrayList<>();

        ArtistQueue(MakeupArtist artist) {
            this.artist = artist;
        }
    }

    private record BookingItemTask(
            MakeupService service,
            BookingItemRequest itemReq) {
    }

    private static class BookingArtistQueue {
        final MakeupArtist artist;
        int totalDuration = 0;
        final List<BookingItemTask> tasks = new ArrayList<>();

        BookingArtistQueue(MakeupArtist artist) {
            this.artist = artist;
        }
    }

    private BookingResponse mapToResponse(Booking booking) {
        List<BookingItem> items = bookingItemRepository.findByBookingId(booking.getId());

        BigDecimal servicesPrice = BigDecimal.ZERO;
        List<BookingItemResponse> itemResponses = new ArrayList<>();
        for (BookingItem item : items) {
            servicesPrice = servicesPrice.add(item.getPrice());
            itemResponses.add(BookingItemResponse.builder()
                    .id(item.getId())
                    .makeupServiceId(item.getMakeupService().getId())
                    .serviceName(item.getMakeupService().getServiceName())
                    .makeupArtistId(item.getMakeupArtist().getId())
                    .artistName(item.getMakeupArtist().getUser().getFullName())
                    .startTime(item.getStartTime())
                    .endTime(item.getEndTime())
                    .price(item.getPrice())
                    .cancelRequested(item.getCancelRequested())
                    .cancelReason(item.getCancelReason())
                    .cancelStatus(item.getCancelStatus())
                    .cancelRequestedAt(item.getCancelRequestedAt())
                    .originalArtistId(item.getOriginalArtistId())
                    .build());
        }

        BigDecimal travelFee = BigDecimal.ZERO;
        String address = null;
        BigDecimal distanceKm = null;

        Optional<BookingAddress> addrOpt = bookingAddressRepository.findByBookingId(booking.getId());
        if (addrOpt.isPresent()) {
            BookingAddress bAddr = addrOpt.get();
            travelFee = bAddr.getTravelFee();
            address = bAddr.getAddress();
            distanceKm = bAddr.getDistanceKm();
        }

        return mapToResponse(booking, servicesPrice, travelFee, address, distanceKm, itemResponses);
    }

    private BookingResponse mapToResponse(
            Booking booking,
            BigDecimal servicesPrice,
            BigDecimal travelFee,
            String address,
            BigDecimal distanceKm,
            List<BookingItemResponse> itemResponses) {
        List<Payment> payments = paymentRepository.findByBookingId(booking.getId());
        BigDecimal totalPaid = BigDecimal.ZERO;
        String paymentMethod = null;
        String paymentStatus = null;
        boolean hasVnpay = false;
        if (payments != null && !payments.isEmpty()) {
            for (Payment p : payments) {
                if (p.getStatus() == PaymentStatus.PAID) {
                    totalPaid = totalPaid.add(p.getAmount() != null ? p.getAmount() : BigDecimal.ZERO);
                }
                if (p.getPaymentMethod() == PaymentMethod.VNPAY) {
                    hasVnpay = true;
                }
            }
            Payment latestPayment = payments.get(payments.size() - 1);
            paymentMethod = hasVnpay
                    ? PaymentMethod.VNPAY.name()
                    : (latestPayment.getPaymentMethod() != null ? latestPayment.getPaymentMethod().name() : null);
            paymentStatus = latestPayment.getStatus() != null ? latestPayment.getStatus().name() : null;
        }

        BigDecimal totalPrice = booking.getTotalPrice() != null ? booking.getTotalPrice() : BigDecimal.ZERO;
        boolean hasCollectedNote = booking.getNotes() != null && booking.getNotes().contains("[ĐÃ THU ĐỦ TIỀN");
        boolean isFullyPaid = hasCollectedNote
                || (totalPrice.compareTo(BigDecimal.ZERO) > 0 && totalPaid.compareTo(totalPrice) >= 0)
                || (totalPrice.compareTo(BigDecimal.ZERO) == 0);
        BigDecimal remainingToCollect = isFullyPaid ? BigDecimal.ZERO
                : totalPrice.subtract(totalPaid).max(BigDecimal.ZERO);

        return BookingResponse.builder()
                .id(booking.getId())
                .customerId(booking.getUser().getId())
                .customerName(booking.getUser().getFullName())
                .customerPhone(booking.getUser().getPhone())
                .bookingDate(booking.getBookingDate())
                .bookingTime(booking.getBookingTime())
                .targetEndTime(booking.getTargetEndTime())
                .locationType(booking.getLocationType())
                .executionMode(booking.getExecutionMode())
                .artistCount(booking.getArtistCount())
                .dispatchPlan(booking.getDispatchPlan())
                .status(booking.getStatus())
                .servicesPrice(servicesPrice)
                .travelFee(travelFee)
                .surcharge(booking.getSurcharge() != null ? booking.getSurcharge() : BigDecimal.ZERO)
                .discountAmount(booking.getDiscountAmount() != null ? booking.getDiscountAmount() : BigDecimal.ZERO)
                .voucherId(booking.getVoucher() != null ? booking.getVoucher().getId() : null)
                .voucherCode(booking.getVoucherCode() != null ? booking.getVoucherCode()
                        : (booking.getVoucher() != null ? booking.getVoucher().getCode() : null))
                .totalPrice(booking.getTotalPrice())
                .depositAmount(booking.getDepositAmount())
                .address(address)
                .distanceKm(distanceKm)
                .items(itemResponses)
                .layoutId(booking.getMakeupLayout() != null ? booking.getMakeupLayout().getId() : null)
                .layoutCode(booking.getMakeupLayout() != null ? booking.getMakeupLayout().getCode() : null)
                .layout(booking.getMakeupLayout() != null ? booking.getMakeupLayout().getName() : booking.getLayout())
                .customerImage(booking.getCustomerImage())
                .notes(booking.getNotes())
                .paymentMethod(paymentMethod)
                .paymentStatus(paymentStatus)
                .totalPaid(totalPaid)
                .remainingToCollect(remainingToCollect)
                .isFullyPaid(isFullyPaid)
                .createdAt(booking.getCreatedAt())
                .build();
    }
}
