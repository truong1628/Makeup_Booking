package com.bookingmakeup.service;

import com.bookingmakeup.common.exception.BadRequestException;
import com.bookingmakeup.common.exception.ResourceNotFoundException;
import com.bookingmakeup.dto.request.PortfolioCreateRequest;
import com.bookingmakeup.dto.response.PortfolioResponse;
import com.bookingmakeup.entity.MakeupArtist;
import com.bookingmakeup.entity.Portfolio;
import com.bookingmakeup.entity.User;
import com.bookingmakeup.repository.MakeupArtistRepository;
import com.bookingmakeup.repository.PortfolioRepository;
import com.bookingmakeup.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class PortfolioService {

    private final PortfolioRepository portfolioRepository;
    private final MakeupArtistRepository makeupArtistRepository;

    /**
     * Khách hàng tìm kiếm và lọc danh sách bộ sưu tập
     */
    @Transactional(readOnly = true)
    public List<PortfolioResponse> searchPortfolios(Long artistId, String categoryName, String keyword) {
        List<Portfolio> portfolios = portfolioRepository.searchPortfolios(artistId, categoryName, keyword);
        return portfolios.stream().map(this::mapToResponse).toList();
    }

    /**
     * Khách hàng xem chi tiết tác phẩm (tự động tăng viewCount)
     */
    @Transactional
    public PortfolioResponse getPortfolioById(Long id) {
        Portfolio portfolio = portfolioRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Portfolio", "id", id));

        portfolio.setViewCount((portfolio.getViewCount() != null ? portfolio.getViewCount() : 0) + 1);
        portfolioRepository.save(portfolio);

        return mapToResponse(portfolio);
    }

    /**
     * Lấy danh sách danh mục / phong cách tác phẩm
     */
    @Transactional(readOnly = true)
    public List<String> getCategories() {
        return portfolioRepository.findDistinctCategories();
    }

    /**
     * Nghệ sĩ lấy danh sách các tác phẩm trong bộ sưu tập của chính mình
     */
    @Transactional(readOnly = true)
    public List<PortfolioResponse> getMyPortfolios(UserPrincipal currentUser) {
        MakeupArtist artist = getArtistFromPrincipal(currentUser);
        List<Portfolio> list = portfolioRepository.findByMakeupArtistIdOrderByCreatedAtDesc(artist.getId());
        return list.stream().map(this::mapToResponse).toList();
    }

    /**
     * Nghệ sĩ đăng tải tác phẩm mới lên bộ sưu tập
     */
    @Transactional
    public PortfolioResponse createPortfolio(UserPrincipal currentUser, PortfolioCreateRequest request) {
        MakeupArtist artist = getArtistFromPrincipal(currentUser);

        Portfolio portfolio = Portfolio.builder()
                .makeupArtist(artist)
                .title(request.getTitle().trim())
                .description(request.getDescription())
                .imageUrl(request.getImageUrl().trim())
                .additionalImages(request.getAdditionalImages())
                .categoryName(request.getCategoryName() != null ? request.getCategoryName().trim() : "Tác phẩm nổi bật")
                .tags(request.getTags())
                .viewCount(0)
                .build();

        Portfolio saved = portfolioRepository.save(portfolio);
        log.info("Thợ {} (ID: {}) đã đăng tác phẩm mới: {}", artist.getUser().getFullName(), artist.getId(), saved.getTitle());
        return mapToResponse(saved);
    }

    /**
     * Nghệ sĩ chỉnh sửa tác phẩm của mình
     */
    @Transactional
    public PortfolioResponse updatePortfolio(UserPrincipal currentUser, Long id, PortfolioCreateRequest request) {
        MakeupArtist artist = getArtistFromPrincipal(currentUser);
        Portfolio portfolio = portfolioRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Portfolio", "id", id));

        // Kiểm tra quyền sở hữu
        boolean isAdmin = currentUser.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        if (!portfolio.getMakeupArtist().getId().equals(artist.getId()) && !isAdmin) {
            throw new BadRequestException("Bạn không có quyền chỉnh sửa tác phẩm của thợ khác");
        }

        portfolio.setTitle(request.getTitle().trim());
        portfolio.setDescription(request.getDescription());
        portfolio.setImageUrl(request.getImageUrl().trim());
        portfolio.setAdditionalImages(request.getAdditionalImages());
        if (request.getCategoryName() != null) {
            portfolio.setCategoryName(request.getCategoryName().trim());
        }
        portfolio.setTags(request.getTags());

        Portfolio updated = portfolioRepository.save(portfolio);
        return mapToResponse(updated);
    }

    /**
     * Nghệ sĩ xóa tác phẩm của mình
     */
    @Transactional
    public void deletePortfolio(UserPrincipal currentUser, Long id) {
        MakeupArtist artist = getArtistFromPrincipal(currentUser);
        Portfolio portfolio = portfolioRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Portfolio", "id", id));

        boolean isAdmin = currentUser.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        if (!portfolio.getMakeupArtist().getId().equals(artist.getId()) && !isAdmin) {
            throw new BadRequestException("Bạn không có quyền xóa tác phẩm của thợ khác");
        }

        portfolioRepository.delete(portfolio);
        log.info("Tác phẩm ID {} đã bị xóa bởi thợ {}", id, artist.getUser().getFullName());
    }

    private MakeupArtist getArtistFromPrincipal(UserPrincipal currentUser) {
        return makeupArtistRepository.findByUserId(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("MakeupArtist", "userId", currentUser.getId()));
    }

    private PortfolioResponse mapToResponse(Portfolio p) {
        MakeupArtist artist = p.getMakeupArtist();
        User user = (artist != null) ? artist.getUser() : null;

        return PortfolioResponse.builder()
                .id(p.getId())
                .artistId(artist != null ? artist.getId() : null)
                .artistName(user != null ? user.getFullName() : "Chuyên gia Makeup")
                .artistAvatar(user != null ? user.getAvatar() : null)
                .artistPhone(user != null ? user.getPhone() : null)
                .artistExperience(artist != null ? artist.getExperience() : null)
                .artistSpecialties(artist != null ? artist.getSpecialties() : null)
                .title(p.getTitle())
                .description(p.getDescription())
                .imageUrl(p.getImageUrl())
                .additionalImages(p.getAdditionalImages())
                .categoryName(p.getCategoryName())
                .tags(p.getTags())
                .viewCount(p.getViewCount() != null ? p.getViewCount() : 0)
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .build();
    }
}
