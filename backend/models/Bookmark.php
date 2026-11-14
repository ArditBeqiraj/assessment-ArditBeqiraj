<?php

class Bookmark
{
    public function __construct(private PDO $pdo) {}

    public function forVideo(int $videoId, ?int $userId = null): array
    {
        $sql = 'SELECT b.id, b.time_seconds AS timestamp, b.title, b.video_id,
            b.user_id, b.created_at, u.username
            FROM bookmarks b JOIN users u ON u.id = b.user_id WHERE b.video_id = ?';
        $values = [$videoId];

        if ($userId !== null) {
            $sql .= ' AND b.user_id = ?';
            $values[] = $userId;
        }

        $statement = $this->pdo->prepare($sql.' ORDER BY b.time_seconds, b.id');
        $statement->execute($values);

        return $statement->fetchAll();
    }

    public function create(array $data): int
    {
        $statement = $this->pdo->prepare('INSERT INTO bookmarks
            (time_seconds, title, video_id, user_id) VALUES (?, ?, ?, ?)');
        $statement->execute([
            $data['timestamp'],
            $data['title'],
            $data['video_id'],
            $data['user_id'],
        ]);
        return (int) $this->pdo->lastInsertId();
    }


    public function all(): array
    {
        return $this->pdo->query('SELECT b.id, b.time_seconds AS timestamp, b.title,
            b.video_id, b.user_id, b.created_at, u.username, v.title AS video_title
            FROM bookmarks b JOIN users u ON u.id = b.user_id
            JOIN videos v ON v.id = b.video_id ORDER BY b.id DESC')->fetchAll();
    }

    public function count(): int
    {
        return (int) $this->pdo->query('SELECT COUNT(*) FROM bookmarks')->fetchColumn();
    }
}
