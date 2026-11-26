package com.example.backend_java.controller;

import com.example.backend_java.dto.admin.AdminModerationDtos.CreateReportRequest;
import com.example.backend_java.dto.common.MessageDto;
import com.example.backend_java.entity.ContentReport;
import com.example.backend_java.entity.User;
import com.example.backend_java.repository.ContentReportRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

/**
 * Endpoint báo cáo vi phạm cho người dùng bình thường (không tiết lộ bất kỳ thông tin quản trị nào).
 */
@RestController
@RequestMapping("/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ContentReportRepository reportRepository;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public MessageDto createReport(@AuthenticationPrincipal User currentUser,
                                   @Valid @RequestBody CreateReportRequest req) {
        ContentReport.TargetType targetType;
        ContentReport.ReasonCategory reasonCategory;
        try {
            targetType = ContentReport.TargetType.valueOf(req.getTargetType().trim().toUpperCase());
            reasonCategory = ContentReport.ReasonCategory.valueOf(req.getReasonCategory().trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Loại đối tượng hoặc lý do báo cáo không hợp lệ.");
        }

        if (targetType == ContentReport.TargetType.USER && currentUser.getId().equals(req.getTargetId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Bạn không thể tự báo cáo chính mình.");
        }

        boolean alreadyPending = reportRepository.existsByReporterIdAndTargetTypeAndTargetIdAndStatus(
                currentUser.getId(), targetType, req.getTargetId(), ContentReport.Status.PENDING);
        if (alreadyPending) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Bạn đã gửi báo cáo cho nội dung này và đang chờ xem xét.");
        }

        ContentReport report = ContentReport.builder()
                .reporterId(currentUser.getId())
                .targetType(targetType)
                .targetId(req.getTargetId())
                .reasonCategory(reasonCategory)
                .description(req.getDescription() != null ? req.getDescription().trim() : null)
                .status(ContentReport.Status.PENDING)
                .build();

        reportRepository.save(report);
        return new MessageDto("Cảm ơn bạn đã báo cáo. Đội ngũ kiểm duyệt sẽ xem xét trong thời gian sớm nhất.");
    }
}
