package com.example.backend_java.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "game_achievements")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GameAchievement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "game_id", insertable = false, updatable = false)
    private Long gameId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "game_id", nullable = false)
    private Game game;

    @Column(nullable = false, length = 100)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(length = 100)
    private String icon;

    @Column(name = "required_score")
    @Builder.Default
    private Integer requiredScore = 0;

    @Column(name = "required_plays")
    @Builder.Default
    private Integer requiredPlays = 0;
}
