package com.example.backend_java.controller;

import com.example.backend_java.dto.EventCreateDto;
import com.example.backend_java.dto.EventResponseDto;
import com.example.backend_java.entity.User;
import com.example.backend_java.repository.UserRepository;
import com.example.backend_java.security.JwtTokenProvider;
import com.example.backend_java.service.EventService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/events")
public class EventController {

    private final EventService eventService;
    private final JwtTokenProvider jwtTokenProvider;
    private final UserRepository userRepository;

    public EventController(EventService eventService, JwtTokenProvider jwtTokenProvider, UserRepository userRepository) {
        this.eventService = eventService;
        this.jwtTokenProvider = jwtTokenProvider;
        this.userRepository = userRepository;
    }

    private User getCurrentUser(String token) {
        if (token == null || !token.startsWith("Bearer ")) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Bạn chưa đăng nhập");
        }
        String jwt = token.substring(7);
        if (!jwtTokenProvider.validateToken(jwt)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Token không hợp lệ");
        }
        String email = jwtTokenProvider.getEmailFromToken(jwt);
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Người dùng không tồn tại"));
    }

    @GetMapping
    public ResponseEntity<List<EventResponseDto>> getAllEvents() {
        return ResponseEntity.ok(eventService.getAllEvents());
    }

    @GetMapping("/{id}")
    public ResponseEntity<EventResponseDto> getEventDetails(@PathVariable Long id) {
        return ResponseEntity.ok(eventService.getEventDetails(id));
    }

    @PostMapping
    public ResponseEntity<EventResponseDto> createEvent(@RequestBody EventCreateDto dto,
                                                        @RequestHeader(value = "Authorization", required = false) String token) {
        User user = getCurrentUser(token);
        return ResponseEntity.ok(eventService.createEvent(dto, user));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteEvent(@PathVariable Long id,
                                         @RequestHeader(value = "Authorization", required = false) String token) {
        User user = getCurrentUser(token);
        eventService.deleteEvent(id, user);
        return ResponseEntity.ok().build();
    }
}
