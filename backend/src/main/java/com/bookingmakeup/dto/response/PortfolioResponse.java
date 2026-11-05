package com.bookingmakeup.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PortfolioResponse {
    private Long id;
    private Long artistId;
    private String artistName;
    private String artistAvatar;
    private String artistExperience;
    private String artistPhone;
    private String title;
    private String description;
    private String imageUrl;
    private String additionalImages;
    private java.util.List<PortfolioImageResponse> gallery;
    private String categoryName;
    private String tags;
    private Integer viewCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
