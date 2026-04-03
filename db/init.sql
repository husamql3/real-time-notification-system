-- Better Auth tables
CREATE TABLE IF NOT EXISTS "user" (
    "id" text PRIMARY KEY NOT NULL,
    "name" text NOT NULL,
    "email" text NOT NULL UNIQUE,
    "email_verified" boolean NOT NULL DEFAULT false,
    "image" text,
    "created_at" timestamp NOT NULL DEFAULT now(),
    "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "session" (
    "id" text PRIMARY KEY NOT NULL,
    "expires_at" timestamp NOT NULL,
    "token" text NOT NULL UNIQUE,
    "created_at" timestamp NOT NULL DEFAULT now(),
    "updated_at" timestamp NOT NULL DEFAULT now(),
    "ip_address" text,
    "user_agent" text,
    "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "account" (
    "id" text PRIMARY KEY NOT NULL,
    "account_id" text NOT NULL,
    "provider_id" text NOT NULL,
    "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
    "access_token" text,
    "refresh_token" text,
    "id_token" text,
    "access_token_expires_at" timestamp,
    "refresh_token_expires_at" timestamp,
    "scope" text,
    "password" text,
    "created_at" timestamp NOT NULL DEFAULT now(),
    "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "verification" (
    "id" text PRIMARY KEY NOT NULL,
    "identifier" text NOT NULL,
    "value" text NOT NULL,
    "expires_at" timestamp NOT NULL,
    "created_at" timestamp DEFAULT now(),
    "updated_at" timestamp DEFAULT now()
);

-- Seed: initial admin user
-- Email: admin@example.com  |  Password: admin1234
-- Set ADMIN_EMAIL=admin@example.com in .env to grant admin access
INSERT INTO "user" (id, name, email, email_verified, created_at, updated_at)
VALUES (
    'seed-admin-user',
    'Admin',
    'admin@example.com',
    true,
    now(),
    now()
) ON CONFLICT DO NOTHING;

INSERT INTO account (id, account_id, provider_id, user_id, password, created_at, updated_at)
VALUES (
    'seed-admin-account',
    'admin@example.com',
    'credential',
    'seed-admin-user',
    '745bd32538cbd5433081c0145d4af4d6:a52bedeaeaf77dc99bee2c8f20a628e30438380889e406babc600986088f69285d180a02fa42740cf76c13b443555f98b6ec920e2440f6a76f0da299783a1b30',
    now(),
    now()
) ON CONFLICT DO NOTHING;

-- Broadcast messages table
CREATE TABLE IF NOT EXISTS broadcast_messages (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    sent_by VARCHAR(255) NOT NULL DEFAULT 'admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
