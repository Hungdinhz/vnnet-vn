package com.example.backend_java.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "post_mentions", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"post_id", "mentioned_user_id"}, name = "_post_mention_uc")
})
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class PostMention {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "post_id", insertable = false, updatable = false)
    private Long postId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id", nullable = false)
    private Post post;

    @Column(name = "mentioned_user_id", nullable = false)
    private Long mentionedUserId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "mentioned_user_id", insertable = false, updatable = false)
    private User mentionedUser;
}
