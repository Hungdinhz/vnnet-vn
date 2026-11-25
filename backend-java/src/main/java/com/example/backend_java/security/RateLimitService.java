package com.example.backend_java.security;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory sliding-window rate limiter for auth & sensitive endpoints.
 */
@Service
public class RateLimitService {

    private final ConcurrentHashMap<String, Deque<Long>> requestLogs = new ConcurrentHashMap<>();

    public boolean isAllowed(String key, int maxRequests, long windowSeconds) {
        long now = Instant.now().getEpochSecond();
        long cutoff = now - windowSeconds;

        Deque<Long> timestamps = requestLogs.computeIfAbsent(key, k -> new ArrayDeque<>());
        synchronized (timestamps) {
            while (!timestamps.isEmpty() && timestamps.peekFirst() <= cutoff) {
                timestamps.pollFirst();
            }
            if (timestamps.size() >= maxRequests) {
                return false;
            }
            timestamps.addLast(now);
            return true;
        }
    }

    // Dọn dẹp các key hết hạn mỗi 10 phút tránh rò rỉ bộ nhớ
    @Scheduled(fixedRate = 600000)
    public void cleanup() {
        long cutoff = Instant.now().getEpochSecond() - 3600;
        requestLogs.forEach((key, deque) -> {
            synchronized (deque) {
                while (!deque.isEmpty() && deque.peekFirst() <= cutoff) {
                    deque.pollFirst();
                }
                if (deque.isEmpty()) {
                    requestLogs.remove(key, deque);
                }
            }
        });
    }
}
