package com.bookingmakeup.service;

import com.bookingmakeup.common.exception.BadRequestException;
import com.bookingmakeup.common.exception.ResourceNotFoundException;
import com.bookingmakeup.dto.request.BookingAddressRequest;
import com.bookingmakeup.dto.request.BookingItemRequest;
import com.bookingmakeup.dto.request.BookingRequest;
import com.bookingmakeup.dto.request.DispatchEstimateRequest;
import com.bookingmakeup.dto.response.BookingItemResponse;
import com.bookingmakeup.dto.response.BookingResponse;
import com.bookingmakeup.dto.response.DispatchOptionResponse;
import com.bookingmakeup.entity.*;
import com.bookingmakeup.enums.BookingStatus;
import com.bookingmakeup.enums.ExecutionMode;
import com.bookingmakeup.enums.LocationType;
import com.bookingmakeup.repository.*;
import com.bookingmakeup.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
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

    @Transactional(readOnly = true)
    public boolean checkSlotAvailability(Long artistId, LocalDate date, LocalTime startTime, LocalTime endTime) {
        try {
            validateSlotAvailability(artistId, date, startTime, endTime);
            return true;
        } catch (BadRequestException e) {
            return false;
        }
    }

    @Transactional(readOnly = true)
    public void validateSlotAvailability(Long artistId, LocalDate date, LocalTime startTime, LocalTime endTime) {
        MakeupArtist artist = makeupArtistRepository.findById(artistId)
                .orElseThrow(() -> new ResourceNotFoundException("MakeupArtist", "id", artistId));

        if (!Boolean.TRUE.equals(artist.getActive())) {
            throw new BadRequestException("Thợ trang điểm (ID: " + artistId + ") hiện không hoạt động");
        }

        // 1. Kiểm tra ngày nghỉ hoặc giờ làm việc trong ArtistSchedule
        Optional<ArtistSchedule> scheduleOpt = artistScheduleRepository.findByMakeupArtistIdAndScheduleDate(artistId, date);
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

    /**
     * Ước tính các phương án điều phối thợ theo số người và thời gian hoàn thành (Model 2)
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
                allTasks.add(new ServiceTask(service.getId(), service.getServiceName(), service.getDuration(), service.getPrice()));
                totalServicesPrice = totalServicesPrice.add(service.getPrice());
            }
        }

        if (allTasks.isEmpty()) {
            throw new BadRequestException("Vui lòng chọn ít nhất 1 dịch vụ");
        }

        List<DispatchOptionResponse> options = new ArrayList<>();

        // 3 Gói điều phối: SAVING (1 thợ), BALANCED (2 thợ), SPEED (3 thợ hoặc tối đa)
        int maxAvailable = activeArtists.size();
        int[] targetCounts = new int[]{1, Math.min(2, maxAvailable), Math.min(3, maxAvailable)};
        String[] planCodes = new String[]{"SAVING", "BALANCED", "SPEED"};
        String[] planNames = new String[]{
                "Gói Tiết Kiệm",
                "Gói Tiêu Chuẩn",
                "Gói Xong Nhanh"
        };
        String[] badges = new String[]{
                "Tiết kiệm 15% chi phí",
                "Khuyên dùng cho nhóm 3-6 người",
                "Hoàn thành cấp tốc & Thảnh thơi"
        };
        String[] descriptions = new String[]{
                "1 chuyên viên phục vụ lần lượt từng người, giảm ngay 15% tổng giá dịch vụ.",
                "2 chuyên viên cùng thực hiện song song (makeup + làm tóc), rút ngắn ~40% thời gian chờ.",
                "Ekip 3 chuyên viên làm đồng loạt hỏa tốc (mặt + tóc + phụ tá), hoàn thành nhanh nhất."
        };

        Set<Integer> createdCounts = new HashSet<>();
        for (int p = 0; p < 3; p++) {
            int k = targetCounts[p];
            if (p > 0 && createdCounts.contains(k)) {
                // Nếu studio không đủ số thợ phân biệt (vd chỉ có 1 hoặc 2 thợ), tránh lặp lại gói giống hệt
                continue;
            }
            createdCounts.add(k);

            // Phân bổ công việc vào k hàng đợi để tính toán thời lượng chính xác
            List<ArtistQueue> queues = new ArrayList<>();
            for (int i = 0; i < k; i++) {
                queues.add(new ArtistQueue(null));
            }

            int totalTasksCount = allTasks.size();

            if (totalTasksCount == 1) {
                // Trường hợp 1 người (1 dịch vụ chính, ví dụ Trang điểm Cô dâu Ngày Cưới):
                ServiceTask baseTask = allTasks.get(0);
                if (k == 1) {
                    queues.get(0).tasks.add(baseTask);
                    queues.get(0).totalDuration += baseTask.duration();
                } else if (k == 2) {
                    // 2 thợ phục vụ song song: 1 thợ makeup mặt, 1 thợ làm tóc -> Rút ngắn còn ~60% thời gian
                    int d1 = Math.max(30, (int) Math.round(baseTask.duration() * 0.60));
                    int d2 = Math.max(25, (int) Math.round(baseTask.duration() * 0.50));
                    queues.get(0).tasks.add(new ServiceTask(baseTask.serviceId(), baseTask.serviceName() + " (Trang điểm mặt)", d1, baseTask.price()));
                    queues.get(0).totalDuration += d1;

                    queues.get(1).tasks.add(new ServiceTask(baseTask.serviceId(), "Tạo kiểu tóc & Cài phụ kiện (Song song)", d2, BigDecimal.ZERO));
                    queues.get(1).totalDuration += d2;
                } else {
                    // 3 thợ phục vụ hỏa tốc: Thợ makeup chính + Thợ tóc + Trợ lý trang phục/body -> Rút ngắn còn ~40% thời gian
                    int d1 = Math.max(25, (int) Math.round(baseTask.duration() * 0.40));
                    int d2 = Math.max(20, (int) Math.round(baseTask.duration() * 0.35));
                    int d3 = Math.max(15, (int) Math.round(baseTask.duration() * 0.30));
                    queues.get(0).tasks.add(new ServiceTask(baseTask.serviceId(), baseTask.serviceName() + " (Trang điểm mặt chính)", d1, baseTask.price()));
                    queues.get(0).totalDuration += d1;

                    queues.get(1).tasks.add(new ServiceTask(baseTask.serviceId(), "Tạo kiểu tóc cao cấp (Song song)", d2, BigDecimal.ZERO));
                    queues.get(1).totalDuration += d2;

                    queues.get(2).tasks.add(new ServiceTask(baseTask.serviceId(), "Trang điểm body & Trợ lý trang phục", d3, BigDecimal.ZERO));
                    queues.get(2).totalDuration += d3;
                }
            } else {
                // Trường hợp nhóm nhiều người (>= 2 người):
                List<ServiceTask> sortedTasks = new ArrayList<>(allTasks);
                sortedTasks.sort((a, b) -> Integer.compare(b.duration(), a.duration()));

                for (ServiceTask task : sortedTasks) {
                    ArtistQueue minQueue = queues.stream().min(Comparator.comparingInt(q -> q.totalDuration)).orElse(queues.get(0));
                    minQueue.tasks.add(task);
                    minQueue.totalDuration += task.duration();
                }

                // Nếu có thợ rảnh (ví dụ 2 khách mà chọn gói 3 thợ), thợ rảnh hỗ trợ ca dài nhất
                for (ArtistQueue q : queues) {
                    if (q.tasks.isEmpty()) {
                        ArtistQueue maxQueue = queues.stream().max(Comparator.comparingInt(mq -> mq.totalDuration)).orElse(null);
                        if (maxQueue != null && maxQueue.totalDuration > 35) {
                            ServiceTask longest = maxQueue.tasks.get(0);
                            int originalD = longest.duration();
                            int assistD = Math.max(20, (int) Math.round(originalD * 0.45));
                            int reducedD = Math.max(25, (int) Math.round(originalD * 0.60));
                            maxQueue.tasks.set(0, new ServiceTask(longest.serviceId(), longest.serviceName() + " (Trang điểm mặt)", reducedD, longest.price()));
                            maxQueue.totalDuration = maxQueue.totalDuration - originalD + reducedD;

                            q.tasks.add(new ServiceTask(longest.serviceId(), "Hỗ trợ làm tóc cho " + longest.serviceName(), assistD, BigDecimal.ZERO));
                            q.totalDuration += assistD;
                        }
                    }
                }
            }

            int maxDurationMinutes = queues.stream().mapToInt(q -> q.totalDuration).max().orElse(60);

            LocalTime planStartTime;
            LocalTime planEndTime;
            Boolean isLate = null;
            Integer diffMinutes = null;
            LocalTime recommendedStartTime = null;

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
            }

            // Kiểm tra tình trạng rảnh/bận của chuyên viên trong khung giờ [planStartTime, planEndTime]
            List<MakeupArtist> availableArtists = new ArrayList<>();
            List<MakeupArtist> busyArtists = new ArrayList<>();
            for (MakeupArtist a : activeArtists) {
                if (checkSlotAvailability(a.getId(), request.getBookingDate(), planStartTime, planEndTime)) {
                    availableArtists.add(a);
                } else {
                    busyArtists.add(a);
                }
            }

            // Nếu studio có thợ rảnh nhưng số lượng thợ rảnh không đủ k thợ cho gói này -> bỏ qua gói này
            if (!availableArtists.isEmpty() && k > availableArtists.size()) {
                continue;
            }

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
            // 1. Phụ phí điều phối thợ cấp tốc (gói SPEED): +15% giá dịch vụ
            BigDecimal rushFee = BigDecimal.ZERO;
            if ("SPEED".equals(planCodes[p]) || k >= 3) {
                rushFee = totalServicesPrice.multiply(BigDecimal.valueOf(0.15)).setScale(-3, RoundingMode.HALF_UP);
                if (rushFee.compareTo(BigDecimal.valueOf(100000)) < 0) {
                    rushFee = BigDecimal.valueOf(100000);
                }
            }

            // 2. Chiết khấu giảm 15% cho gói Tiết Kiệm (SAVING) khi nhóm từ 2 người trở lên
            BigDecimal discountAmount = BigDecimal.ZERO;
            if ("SAVING".equals(planCodes[p]) && totalTasksCount >= 2) {
                discountAmount = totalServicesPrice.multiply(BigDecimal.valueOf(0.15)).setScale(-3, RoundingMode.HALF_UP);
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

            options.add(DispatchOptionResponse.builder()
                    .planCode(planCodes[p])
                    .planName(planNames[p])
                    .badge(badges[p])
                    .description(descriptions[p])
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
                    .build());
        }

        return options;
    }

    @Transactional
    public BookingResponse createBooking(UserPrincipal currentUser, BookingRequest request) {
        User customer = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", currentUser.getId()));

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
                throw new BadRequestException(String.format("Lịch hẹn trong ngày hôm nay phải đặt trước ít nhất 1 tiếng (sớm nhất từ %02d:%02d)", minTime.getHour(), minTime.getMinute()));
            }
        }
        if (request.getBookingTime() != null && request.getTargetEndTime() != null 
                && !request.getTargetEndTime().isAfter(request.getBookingTime())) {
            throw new BadRequestException("Thời gian kết thúc phải sau thời gian bắt đầu");
        }

        boolean isDispatchManaged = request.getDispatchPlan() != null 
                || (request.getArtistCount() != null && request.getArtistCount() > 1);

        if (!isDispatchManaged && request.getExecutionMode() == ExecutionMode.SINGLE && request.getItems().size() > 1) {
            throw new BadRequestException("Chế độ SINGLE chỉ cho phép đặt 1 dịch vụ đơn lẻ. Với nhiều dịch vụ, vui lòng chọn phương án điều phối (SAVING, BALANCED, SPEED).");
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
            double inputDist = (addrReq.getDistanceKm() != null && addrReq.getDistanceKm() > 0) ? addrReq.getDistanceKm() : 5.0;

            // Giới hạn bán kính phục vụ tối đa 200km
            if (inputDist > 200.0) {
                throw new BadRequestException("Studio chỉ nhận phục vụ tận nơi trong bán kính tối đa 200km. Vui lòng chọn địa điểm gần hơn hoặc đặt lịch tại Studio.");
            }

            distanceKm = BigDecimal.valueOf(inputDist).setScale(2, RoundingMode.HALF_UP);

            // Bảng phí di chuyển mới:
            // - Dưới 10km: Miễn phí (0 VNĐ)
            // - Từ 10km - 20km: 100.000 VNĐ
            // - Từ 20km - 100km: 200.000 VNĐ
            // - Từ 100km - 200km: 300.000 VNĐ
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

        BigDecimal totalPrice = servicesPrice.subtract(discountAmount).add(travelFee).add(surcharge);
        if (totalPrice.compareTo(BigDecimal.ZERO) < 0) {
            totalPrice = BigDecimal.ZERO;
        }
        // Tiền cọc 30% tổng giá trị đơn
        BigDecimal depositAmount = totalPrice.multiply(BigDecimal.valueOf(0.3)).setScale(0, RoundingMode.HALF_UP);

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
                .layout(request.getLayout())
                .customerImage(request.getCustomerImage())
                .notes(request.getNotes())
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

    @Transactional(readOnly = true)
    public List<BookingResponse> getAllBookings() {
        List<Booking> bookings = bookingRepository.findAllByOrderByBookingDateDescBookingTimeDesc();
        return bookings.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<BookingResponse> getMyBookings(UserPrincipal currentUser) {
        List<Booking> bookings;
        if ("ROLE_ADMIN".equals(currentUser.getRole())) {
            bookings = bookingRepository.findAllByOrderByCreatedAtDesc();
        } else {
            bookings = bookingRepository.findByUserIdOrderByCreatedAtDesc(currentUser.getId());
        }
        return bookings.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public BookingResponse updateBookingStatus(Long id, BookingStatus newStatus) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking", "id", id));
        booking.setStatus(newStatus);
        Booking updated = bookingRepository.save(booking);
        log.info("Cập nhật trạng thái đơn đặt lịch ID: {} sang {}", id, newStatus);
        return mapToResponse(updated);
    }

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
        if (reason != null && !reason.trim().isEmpty()) {
            String currentNotes = booking.getNotes() != null ? booking.getNotes() : "";
            booking.setNotes((currentNotes + " [Lý do hủy: " + reason.trim() + "]").trim());
        }

        Booking updated = bookingRepository.save(booking);
        log.info("Người dùng {} đã hủy đơn đặt lịch ID: {}, lý do: {}", currentUser.getUsername(), id, reason);
        return mapToResponse(updated);
    }

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

        int targetArtistCount = request.getArtistCount() != null && request.getArtistCount() > 0
                ? request.getArtistCount()
                : ("SPEED".equalsIgnoreCase(request.getDispatchPlan()) ? 3 : ("BALANCED".equalsIgnoreCase(request.getDispatchPlan()) ? 2 : 1));
        targetArtistCount = Math.min(targetArtistCount, activeArtists.size());

        // Sử dụng thuật toán điều phối thông minh (Smart Dispatch)
        if (targetArtistCount > 1 || request.getDispatchPlan() != null) {
            List<BookingItemTask> tasks = new ArrayList<>();
            for (BookingItemRequest itemReq : request.getItems()) {
                MakeupService service = makeupServiceRepository.findById(itemReq.getMakeupServiceId())
                        .orElseThrow(() -> new ResourceNotFoundException("MakeupService", "id", itemReq.getMakeupServiceId()));
                if (!Boolean.TRUE.equals(service.getActive())) {
                    throw new BadRequestException("Dịch vụ '" + service.getServiceName() + "' hiện không hoạt động");
                }
                tasks.add(new BookingItemTask(service, itemReq));
            }

            // Sắp xếp dài nhất lên đầu để cân bằng tải
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

            if (availableArtists.isEmpty()) {
                throw new BadRequestException(String.format("Tất cả chuyên viên đều đã có lịch hẹn kín hoặc bận trong khung giờ %s - %s ngày %s. Quý khách vui lòng chọn khung giờ khác!",
                        sessionStart, sessionEnd, request.getBookingDate()));
            }

            List<MakeupArtist> candidateArtists = new ArrayList<>();
            if (request.getDefaultArtistId() != null) {
                // Nếu khách chỉ định thợ và thợ đó rảnh
                availableArtists.stream()
                        .filter(a -> a.getId().equals(request.getDefaultArtistId()))
                        .findFirst()
                        .ifPresent(candidateArtists::add);

                // Nếu khách chỉ định thợ nhưng thợ bận, vẫn thêm để validateSlotAvailability báo lỗi rõ ràng về thợ đó
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
                if (assignedArtists.size() >= targetArtistCount) break;
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
                if (targetQueue == null) {
                    targetQueue = queues.stream().min(Comparator.comparingInt(q -> q.totalDuration)).orElse(queues.get(0));
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

        for (int i = 0; i < request.getItems().size(); i++) {
            BookingItemRequest itemReq = request.getItems().get(i);
            MakeupService service = makeupServiceRepository.findById(itemReq.getMakeupServiceId())
                    .orElseThrow(() -> new ResourceNotFoundException("MakeupService", "id", itemReq.getMakeupServiceId()));

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

            Long resolvedArtistId = itemReq.getMakeupArtistId() != null ? itemReq.getMakeupArtistId() : request.getDefaultArtistId();
            if (request.getExecutionMode() == ExecutionMode.PARALLEL) {
                if (resolvedArtistId == null || parallelArtistIds.contains(resolvedArtistId)) {
                    final LocalTime fStart = slotStart;
                    final LocalTime fEnd = slotEnd;
                    resolvedArtistId = activeArtists.stream()
                            .map(MakeupArtist::getId)
                            .filter(id -> !parallelArtistIds.contains(id) && checkSlotAvailability(id, request.getBookingDate(), fStart, fEnd))
                            .findFirst()
                            .orElse(activeArtists.stream()
                                    .map(MakeupArtist::getId)
                                    .filter(id -> !parallelArtistIds.contains(id))
                                    .findFirst()
                                    .orElse(activeArtists.get(i % activeArtists.size()).getId()));
                }
            } else if (resolvedArtistId == null) {
                final LocalTime fStart = slotStart;
                final LocalTime fEnd = slotEnd;
                resolvedArtistId = activeArtists.stream()
                        .map(MakeupArtist::getId)
                        .filter(id -> checkSlotAvailability(id, request.getBookingDate(), fStart, fEnd))
                        .findFirst()
                        .orElse(activeArtists.get(0).getId());
            }

            final Long artistId = resolvedArtistId;
            MakeupArtist artist = makeupArtistRepository.findById(artistId)
                    .orElseThrow(() -> new ResourceNotFoundException("MakeupArtist", "id", artistId));

            if (request.getExecutionMode() == ExecutionMode.PARALLEL) {
                if (parallelArtistIds.contains(artistId)) {
                    throw new BadRequestException("Chế độ PARALLEL yêu cầu mỗi dịch vụ đồng thời phải do một thợ khác nhau thực hiện. Thợ ID: " + artistId + " bị trùng.");
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
            BigDecimal price
    ) {}

    private record ServiceTask(
            Long serviceId,
            String serviceName,
            int duration,
            BigDecimal price
    ) {}

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
            BookingItemRequest itemReq
    ) {}

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
            List<BookingItemResponse> itemResponses
    ) {
        List<Payment> payments = paymentRepository.findByBookingId(booking.getId());
        String paymentMethod = null;
        String paymentStatus = null;
        if (payments != null && !payments.isEmpty()) {
            Payment latestPayment = payments.get(payments.size() - 1);
            paymentMethod = latestPayment.getPaymentMethod() != null ? latestPayment.getPaymentMethod().name() : null;
            paymentStatus = latestPayment.getStatus() != null ? latestPayment.getStatus().name() : null;
        }

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
                .totalPrice(booking.getTotalPrice())
                .depositAmount(booking.getDepositAmount())
                .address(address)
                .distanceKm(distanceKm)
                .items(itemResponses)
                .layout(booking.getLayout())
                .customerImage(booking.getCustomerImage())
                .notes(booking.getNotes())
                .paymentMethod(paymentMethod)
                .paymentStatus(paymentStatus)
                .createdAt(booking.getCreatedAt())
                .build();
    }
}
