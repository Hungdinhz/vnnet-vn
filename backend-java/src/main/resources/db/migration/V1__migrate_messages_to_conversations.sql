-- Migration script for migrating existing messages to conversations model

-- 1. Create conversations table if not exists (in case ddl-auto didn't run)
CREATE TABLE IF NOT EXISTS conversations (
    id BIGSERIAL PRIMARY KEY,
    type VARCHAR(20) NOT NULL,
    name VARCHAR(100),
    avatar_url VARCHAR(255),
    creator_id BIGINT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create conversation_members table if not exists
CREATE TABLE IF NOT EXISTS conversation_members (
    id BIGSERIAL PRIMARY KEY,
    conversation_id BIGINT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL DEFAULT 'MEMBER',
    last_read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_muted BOOLEAN DEFAULT FALSE,
    CONSTRAINT uk_conversation_member UNIQUE (conversation_id, user_id)
);

-- 3. Add columns to messages table if not exists and allow nullable receiver_id for group chats
ALTER TABLE messages ALTER COLUMN receiver_id DROP NOT NULL;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS conversation_id BIGINT REFERENCES conversations(id) ON DELETE CASCADE;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS message_type VARCHAR(20) DEFAULT 'TEXT';
ALTER TABLE messages ADD COLUMN IF NOT EXISTS image_url VARCHAR(255);
ALTER TABLE messages ADD COLUMN IF NOT EXISTS file_url VARCHAR(255);
ALTER TABLE messages ADD COLUMN IF NOT EXISTS file_name VARCHAR(255);
ALTER TABLE messages ADD COLUMN IF NOT EXISTS file_size BIGINT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS reply_to_id BIGINT REFERENCES messages(id);
ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;

-- 4. Create DIRECT conversations for any existing pairs of sender_id and receiver_id
DO $$
DECLARE
    pair RECORD;
    new_conv_id BIGINT;
BEGIN
    FOR pair IN
        SELECT DISTINCT LEAST(sender_id, receiver_id) AS u1, GREATEST(sender_id, receiver_id) AS u2
        FROM messages
        WHERE conversation_id IS NULL AND receiver_id IS NOT NULL
    LOOP
        -- Check if direct conversation already exists
        SELECT c.id INTO new_conv_id
        FROM conversations c
        JOIN conversation_members m1 ON c.id = m1.conversation_id
        JOIN conversation_members m2 ON c.id = m2.conversation_id
        WHERE c.type = 'DIRECT' AND m1.user_id = pair.u1 AND m2.user_id = pair.u2
        LIMIT 1;

        IF new_conv_id IS NULL THEN
            INSERT INTO conversations (type, creator_id, created_at, updated_at)
            VALUES ('DIRECT', pair.u1, NOW(), NOW())
            RETURNING id INTO new_conv_id;

            INSERT INTO conversation_members (conversation_id, user_id, role, last_read_at)
            VALUES (new_conv_id, pair.u1, 'ADMIN', NOW()),
                   (new_conv_id, pair.u2, 'MEMBER', NOW())
            ON CONFLICT DO NOTHING;
        END IF;

        -- Update messages
        UPDATE messages
        SET conversation_id = new_conv_id
        WHERE conversation_id IS NULL
          AND ((sender_id = pair.u1 AND receiver_id = pair.u2) OR (sender_id = pair.u2 AND receiver_id = pair.u1));
    END LOOP;
END $$;
