<?php

class Annotation
{
    public function __construct(private PDO $pdo) {}

    public function forVideo(int $videoId, ?int $userId = null): array
    {
        $sql = 'SELECT a.id, a.time_seconds AS timestamp, a.description, a.drawing_data,
            a.video_id, a.user_id, a.created_at, u.username
            FROM annotations a JOIN users u ON u.id = a.user_id WHERE a.video_id = ?';
        $values = [$videoId];

        if ($userId !== null) {
            $sql .= ' AND a.user_id = ?';
            $values[] = $userId;
        }

        $statement = $this->pdo->prepare($sql.' ORDER BY a.time_seconds, a.id');
        $statement->execute($values);
        $items = $statement->fetchAll();

        foreach ($items as &$item) {
            $item['drawing_data'] = json_decode($item['drawing_data'], true) ?: [];
        }

        return $items;
    }

    public function create(array $data): int
    {
        $statement = $this->pdo->prepare('INSERT INTO annotations
            (time_seconds, description, drawing_data, video_id, user_id)
            VALUES (?, ?, ?, ?, ?)');
        $statement->execute([
            $data['timestamp'],
            $data['description'],
            json_encode($data['drawing_data']),
            $data['video_id'],
            $data['user_id'],
        ]);
        return (int) $this->pdo->lastInsertId();
    }


    public function all(): array
    {
        return $this->pdo->query('SELECT a.id, a.time_seconds AS timestamp, a.description,
            a.drawing_data, a.video_id, a.user_id, a.created_at, u.username, v.title AS video_title
            FROM annotations a JOIN users u ON u.id = a.user_id
            JOIN videos v ON v.id = a.video_id ORDER BY a.id DESC')->fetchAll();
    }

    public function count(): int
    {
        return (int) $this->pdo->query('SELECT COUNT(*) FROM annotations')->fetchColumn();
    }
}
