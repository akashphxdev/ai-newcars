-- CreateTable
CREATE TABLE "agent_conversations" (
    "conversation_id" VARCHAR(100) NOT NULL,
    "user_id" VARCHAR(100) NOT NULL DEFAULT 'local_user',
    "title" VARCHAR(255) NOT NULL DEFAULT 'New chat',
    "kind" VARCHAR(30) NOT NULL DEFAULT 'chat',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_conversations_pkey" PRIMARY KEY ("conversation_id")
);

-- CreateTable
CREATE TABLE "agent_conversation_messages" (
    "message_id" VARCHAR(100) NOT NULL,
    "conversation_id" VARCHAR(100) NOT NULL,
    "user_id" VARCHAR(100) NOT NULL DEFAULT 'local_user',
    "role" VARCHAR(20) NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agent_conversation_messages_pkey" PRIMARY KEY ("message_id")
);

-- CreateTable
CREATE TABLE "agent_memories" (
    "memory_id" VARCHAR(100) NOT NULL,
    "user_id" VARCHAR(100) NOT NULL DEFAULT 'local_user',
    "memory_type" VARCHAR(50) NOT NULL,
    "key" VARCHAR(100) NOT NULL,
    "value" JSONB,
    "content" TEXT NOT NULL,
    "importance" INTEGER NOT NULL DEFAULT 5,
    "expires_at" TIMESTAMP(3),
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_memories_pkey" PRIMARY KEY ("memory_id")
);

-- CreateIndex
CREATE INDEX "agent_conversations_user_id_updated_at_idx" ON "agent_conversations"("user_id", "updated_at");

-- CreateIndex
CREATE INDEX "agent_conversation_messages_conversation_id_created_at_idx" ON "agent_conversation_messages"("conversation_id", "created_at");

-- CreateIndex
CREATE INDEX "agent_conversation_messages_user_id_created_at_idx" ON "agent_conversation_messages"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "agent_conversation_messages_role_idx" ON "agent_conversation_messages"("role");

-- CreateIndex
CREATE INDEX "agent_memories_user_id_memory_type_key_idx" ON "agent_memories"("user_id", "memory_type", "key");

-- CreateIndex
CREATE INDEX "agent_memories_user_id_importance_idx" ON "agent_memories"("user_id", "importance");

-- CreateIndex
CREATE INDEX "agent_memories_expires_at_idx" ON "agent_memories"("expires_at");

-- AddForeignKey
ALTER TABLE "agent_conversation_messages" ADD CONSTRAINT "agent_conversation_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "agent_conversations"("conversation_id") ON DELETE CASCADE ON UPDATE CASCADE;
