package com.example.backend_java.service;

import com.example.backend_java.dto.EventCreateDto;
import com.example.backend_java.dto.EventResponseDto;
import com.example.backend_java.entity.Event;
import com.example.backend_java.entity.Group;
import com.example.backend_java.entity.User;
import com.example.backend_java.repository.EventRepository;
import com.example.backend_java.repository.GroupMemberRepository;
import com.example.backend_java.repository.GroupRepository;
import com.example.backend_java.repository.UserRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class EventService {

    private final EventRepository eventRepository;
    private final UserRepository userRepository;
    private final GroupRepository groupRepository;
    private final GroupMemberRepository groupMemberRepository;

    public EventService(EventRepository eventRepository, UserRepository userRepository,
                        GroupRepository groupRepository, GroupMemberRepository groupMemberRepository) {
        this.eventRepository = eventRepository;
        this.userRepository = userRepository;
        this.groupRepository = groupRepository;
        this.groupMemberRepository = groupMemberRepository;
    }

    @PostConstruct
    public void seedEvents() {
        if (eventRepository.count() == 0) {
            // Seed Hanoi Event
            eventRepository.save(Event.builder()
                    .title("Lễ hội Sakura Anime Festival")
                    .description("Lễ hội hoa anh đào và hóa trang anime lớn nhất miền Bắc với sự tham gia của hàng ngàn cosplayer chuyên nghiệp, các gian hàng anime goods độc quyền, và sân khấu biểu diễn nhạc phim cực bùng nổ.")
                    .locationName("Lotte Center Hanoi, 54 Liễu Giai, Cống Vị, Ba Đình, Hà Nội")
                    .latitude(21.0319)
                    .longitude(105.8115)
                    .eventDate(LocalDateTime.now().plusDays(5))
                    .organizerType("USER")
                    .organizerId(1L) // Fallback or first user
                    .build());

            // Seed Saigon Event
            eventRepository.save(Event.builder()
                    .title("Manga Comic Con 2026")
                    .description("Sự kiện truyện tranh và văn hóa đại chúng lớn nhất năm tại TP.HCM, quy tụ các nhà xuất bản lớn, họa sĩ truyện tranh nổi tiếng trong và ngoài nước cùng hoạt động giao lưu ký tặng.")
                    .locationName("Phố đi bộ Nguyễn Huệ, Quận 1, Thành phố Hồ Chí Minh")
                    .latitude(10.7740)
                    .longitude(106.7038)
                    .eventDate(LocalDateTime.now().plusDays(10))
                    .organizerType("USER")
                    .organizerId(1L)
                    .build());

            // Seed Da Nang Event
            eventRepository.save(Event.builder()
                    .title("Cosplay Beach Party")
                    .description("Đại hội hóa trang bên bờ biển Mỹ Khê xinh đẹp. Các hoạt động chụp ảnh ngoại cảnh, lửa trại cosplay, tiệc nướng BBQ bãi biển và các trò chơi đồng đội hấp dẫn.")
                    .locationName("Bãi biển Mỹ Khê, Võ Nguyên Giáp, Phước Mỹ, Sơn Trà, Đà Nẵng")
                    .latitude(16.0609)
                    .longitude(108.2458)
                    .eventDate(LocalDateTime.now().plusDays(15))
                    .organizerType("GROUP")
                    .organizerId(1L) // Fallback or first group
                    .build());

            // Seed Can Tho Event
            eventRepository.save(Event.builder()
                    .title("Offline Hội Phim Ghibli")
                    .description("Buổi giao lưu offline ấm cúng của những người yêu mến thế giới phim hoạt hình Studio Ghibli. Chiếu phim ngoài trời miễn phí, workshop vẽ tranh màu nước và chia sẻ đĩa nhạc phim.")
                    .locationName("Bến Ninh Kiều, Hai Bà Trưng, Tân An, Ninh Kiều, Cần Thơ")
                    .latitude(10.0342)
                    .longitude(105.7876)
                    .eventDate(LocalDateTime.now().plusDays(2))
                    .organizerType("GROUP")
                    .organizerId(1L)
                    .build());
        }
    }

    @Transactional(readOnly = true)
    public List<EventResponseDto> getAllEvents() {
        List<Event> events = eventRepository.findAllByOrderByEventDateAsc();
        return events.stream().map(this::toResponseDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public EventResponseDto getEventDetails(Long id) {
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Sự kiện không tồn tại"));
        return toResponseDto(event);
    }

    @Transactional
    public EventResponseDto createEvent(EventCreateDto dto, User currentUser) {
        // Validate organizer
        if ("GROUP".equalsIgnoreCase(dto.getOrganizerType())) {
            Group group = groupRepository.findById(dto.getOrganizerId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nhóm không tồn tại"));
            
            // Check if user is member/admin of group
            boolean isMember = groupMemberRepository.existsByGroupIdAndUserId(group.getId(), currentUser.getId());
            if (!isMember && !currentUser.getId().equals(group.getCreatorId())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn phải là thành viên nhóm để tạo sự kiện");
            }
        } else {
            // Organizer must be the current user
            dto.setOrganizerType("USER");
            dto.setOrganizerId(currentUser.getId());
        }

        Event event = Event.builder()
                .title(dto.getTitle())
                .description(dto.getDescription())
                .locationName(dto.getLocationName())
                .latitude(dto.getLatitude())
                .longitude(dto.getLongitude())
                .eventDate(dto.getEventDate())
                .organizerType(dto.getOrganizerType().toUpperCase())
                .organizerId(dto.getOrganizerId())
                .build();

        event = eventRepository.save(event);
        return toResponseDto(event);
    }

    @Transactional
    public void deleteEvent(Long id, User currentUser) {
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Sự kiện không tồn tại"));

        boolean canDelete = false;
        if ("USER".equalsIgnoreCase(event.getOrganizerType())) {
            canDelete = event.getOrganizerId().equals(currentUser.getId());
        } else if ("GROUP".equalsIgnoreCase(event.getOrganizerType())) {
            Group group = groupRepository.findById(event.getOrganizerId()).orElse(null);
            if (group != null) {
                if (group.getCreatorId().equals(currentUser.getId())) {
                    canDelete = true;
                } else {
                    canDelete = groupMemberRepository.findByGroupIdAndUserId(group.getId(), currentUser.getId())
                            .map(m -> "ADMIN".equals(m.getRole()))
                            .orElse(false);
                }
            }
        }

        if (!canDelete) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn không có quyền xóa sự kiện này");
        }

        eventRepository.delete(event);
    }

    private EventResponseDto toResponseDto(Event event) {
        String organizerName = "Không rõ";
        String organizerAvatarUrl = null;

        if ("USER".equalsIgnoreCase(event.getOrganizerType())) {
            User user = userRepository.findById(event.getOrganizerId()).orElse(null);
            if (user != null) {
                organizerName = user.getUsername();
                organizerAvatarUrl = user.getAvatarUrl();
            }
        } else if ("GROUP".equalsIgnoreCase(event.getOrganizerType())) {
            Group group = groupRepository.findById(event.getOrganizerId()).orElse(null);
            if (group != null) {
                organizerName = group.getName();
                organizerAvatarUrl = group.getCoverUrl(); // Use cover image as representation
            }
        }

        return EventResponseDto.builder()
                .id(event.getId())
                .title(event.getTitle())
                .description(event.getDescription())
                .locationName(event.getLocationName())
                .latitude(event.getLatitude())
                .longitude(event.getLongitude())
                .eventDate(event.getEventDate())
                .organizerType(event.getOrganizerType())
                .organizerId(event.getOrganizerId())
                .organizerName(organizerName)
                .organizerAvatarUrl(organizerAvatarUrl)
                .createdAt(event.getCreatedAt())
                .build();
    }
}
