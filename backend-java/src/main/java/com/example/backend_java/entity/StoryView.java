package com.example.backend_java.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "story_views", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"story_id", "viewer_id"}, name = "_story_viewer_uc")
})
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class StoryView {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "story_id", insertable = false, updatable = false)
    private Long storyId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "story_id", nullable = false)
    private Story story;

    @Column(name = "viewer_id", nullable = false)
    private Long viewerId;

    @CreationTimestamp
    @Column(name = "viewed_at")
    private LocalDateTime viewedAt;
}
