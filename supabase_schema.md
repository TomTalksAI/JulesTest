# Supabase Schema for World of PromptCraft

This document outlines the conceptual database schema for the 'World of PromptCraft' application, designed for a Supabase (PostgreSQL) backend.

## Table Definitions

### 1. `categories`

Stores different categories for prompts.

| Column     | Type                     | Constraints                                  | Default Value   |
|------------|--------------------------|----------------------------------------------|-----------------|
| `id`       | `bigint`                 | `PRIMARY KEY`, auto-incrementing             | (auto)          |
| `name`     | `text`                   | `UNIQUE`, `NOT NULL`                         |                 |
| `created_at` | `timestamp with time zone` |                                              | `now()`         |

**RLS Idea:**
*   Enable RLS.
*   Policy for public read access:
    ```sql
    CREATE POLICY "Allow public read access to categories"
    ON categories
    FOR SELECT
    USING (true);
    ```
*   Policy for admin write access (assuming an `is_admin` custom claim or a separate admin roles table):
    ```sql
    CREATE POLICY "Allow admin write access to categories"
    ON categories
    FOR INSERT, UPDATE, DELETE
    USING (auth.jwt() ->> 'user_role' = 'admin') -- Example, adjust to your admin role setup
    WITH CHECK (auth.jwt() ->> 'user_role' = 'admin');
    ```

---

### 2. `prompts`

Stores the prompts submitted by users.

| Column        | Type                     | Constraints                                      | Default Value        |
|---------------|--------------------------|--------------------------------------------------|----------------------|
| `id`          | `uuid`                   | `PRIMARY KEY`                                    | `gen_random_uuid()`  |
| `user_id`     | `uuid`                   | `REFERENCES auth.users(id)`, `NOT NULL`          |                      |
| `title`       | `text`                   | `NOT NULL`                                       |                      |
| `prompt_text` | `text`                   | `NOT NULL`                                       |                      |
| `category_id` | `bigint`                 | `REFERENCES categories(id)`                      |                      |
| `created_at`  | `timestamp with time zone` |                                                  | `now()`              |
| `upvotes`     | `integer`                |                                                  | `0`                  |
| `downvotes`   | `integer`                |                                                  | `0`                  |

**RLS Idea:**
*   Enable RLS.
*   Policy for public read access:
    ```sql
    CREATE POLICY "Allow public read access to prompts"
    ON prompts
    FOR SELECT
    USING (true);
    ```
*   Policy for authenticated users to insert:
    ```sql
    CREATE POLICY "Allow authenticated users to insert prompts"
    ON prompts
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');
    ```
*   Policy for owners to update/delete:
    ```sql
    CREATE POLICY "Allow owners to update or delete their prompts"
    ON prompts
    FOR UPDATE, DELETE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
    ```

---

### 3. `votes`

Tracks user votes (upvotes/downvotes) on prompts.

| Column     | Type                     | Constraints                                                                 | Default Value   |
|------------|--------------------------|-----------------------------------------------------------------------------|-----------------|
| `id`       | `bigint`                 | `PRIMARY KEY`, auto-incrementing                                            | (auto)          |
| `user_id`  | `uuid`                   | `REFERENCES auth.users(id)`, `NOT NULL`                                     |                 |
| `prompt_id`| `uuid`                   | `REFERENCES prompts(id)`, `NOT NULL`                                        |                 |
| `vote_type`| `smallint`               | `NOT NULL`, `CHECK (vote_type IN (1, -1))` (1 for upvote, -1 for downvote)  |                 |
| `created_at`| `timestamp with time zone` |                                                                             | `now()`         |
|            |                          | `UNIQUE (user_id, prompt_id)`                                               |                 |

**RLS Idea:**
*   Enable RLS.
*   Policy for authenticated users to manage their own votes:
    ```sql
    CREATE POLICY "Allow users to manage their own votes"
    ON votes
    FOR ALL -- Covers INSERT, SELECT, UPDATE, DELETE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
    ```
    *Note: Separate policies for SELECT, INSERT, UPDATE, DELETE can be created for more granularity if needed. For example, a user might not need to SELECT all their votes directly if this is handled by joins on the `prompts` table.*

---

### 4. `comments`

Stores user comments on prompts. Supports threaded comments via `parent_comment_id`.

| Column              | Type                     | Constraints                                      | Default Value        |
|---------------------|--------------------------|--------------------------------------------------|----------------------|
| `id`                | `uuid`                   | `PRIMARY KEY`                                    | `gen_random_uuid()`  |
| `user_id`           | `uuid`                   | `REFERENCES auth.users(id)`, `NOT NULL`          |                      |
| `prompt_id`         | `uuid`                   | `REFERENCES prompts(id)`, `NOT NULL`             |                      |
| `parent_comment_id` | `uuid`                   | `REFERENCES comments(id)`, `NULLABLE`            |                      |
| `content`           | `text`                   | `NOT NULL`                                       |                      |
| `created_at`        | `timestamp with time zone` |                                                  | `now()`              |

**RLS Idea:**
*   Enable RLS.
*   Policy for public read access:
    ```sql
    CREATE POLICY "Allow public read access to comments"
    ON comments
    FOR SELECT
    USING (true);
    ```
*   Policy for authenticated users to insert comments:
    ```sql
    CREATE POLICY "Allow authenticated users to insert comments"
    ON comments
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');
    ```
*   Policy for owners to update/delete their comments:
    ```sql
    CREATE POLICY "Allow owners to update or delete their comments"
    ON comments
    FOR UPDATE, DELETE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
    ```

---

**Note on RLS Policies:** The SQL provided for RLS policies are examples. The exact implementation might vary based on specific application requirements, such as the definition of an 'admin' role or more granular access controls. Always test RLS policies thoroughly. Consider using Supabase's built-in policy editor in the dashboard for easier management.
