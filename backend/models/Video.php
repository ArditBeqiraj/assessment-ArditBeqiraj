<?php

class Video
{
    public function __construct(private PDO $pdo) {}

    public function paginate(string $search, ?int $ownerId, int $page, int $perPage): array
    {
        $where = [];
        $values = [];

        if ($search !== '') {
            $where[] = 'v.title LIKE ?';
            $values[] = '%'.$search.'%';
        }

        if ($ownerId !== null) {
            $where[] = 'v.owner_id = ?';
            $values[] = $ownerId;
        }

        $clause = $where ? ' WHERE '.implode(' AND ', $where) : '';
        $count = $this->pdo->prepare('SELECT COUNT(*) FROM videos v'.$clause);
        $count->execute($values);
        $total = (int) $count->fetchColumn();

        $offset = ($page - 1) * $perPage;
        $statement = $this->pdo->prepare('SELECT v.*, u.username
            FROM videos v JOIN users u ON u.id = v.owner_id'.$clause.'
            ORDER BY v.id DESC LIMIT '.(int) $perPage.' OFFSET '.(int) $offset);
        $statement->execute($values);

        return [
            'items' => $statement->fetchAll(),
            'total' => $total,
            'page' => $page,
            'pages' => max(1, (int) ceil($total / $perPage)),
            'per_page' => $perPage,
        ];
    }

    public function find(int $id): ?array
    {
        $statement = $this->pdo->prepare('SELECT v.*, u.username
            FROM videos v JOIN users u ON u.id = v.owner_id WHERE v.id = ?');
        $statement->execute([$id]);

        return $statement->fetch() ?: null;
    }

    public function create(array $data): int
    {
        $statement = $this->pdo->prepare('INSERT INTO videos
            (title, description, file_name, thumbnail, duration_seconds, owner_id)
            VALUES (?, ?, ?, ?, ?, ?)');
        $statement->execute([
            $data['title'],
            $data['description'],
            $data['file_name'],
            $data['thumbnail'],
            $data['duration_seconds'],
            $data['owner_id'],
        ]);

        return (int) $this->pdo->lastInsertId();
    }

    public function deleteById(int $id): bool
    {
        $statement = $this->pdo->prepare('DELETE FROM videos WHERE id = ?');
        $statement->execute([$id]);

        return $statement->rowCount() === 1;
    }

    public function recent(int $limit = 5): array
    {
        $limit = max(1, $limit);
        return $this->pdo->query('SELECT v.*, u.username FROM videos v
            JOIN users u ON u.id = v.owner_id ORDER BY v.id DESC LIMIT '.(int) $limit)->fetchAll();
    }

    public function all(): array
    {
        return $this->pdo->query('SELECT v.*, u.username
            FROM videos v JOIN users u ON u.id = v.owner_id ORDER BY v.id DESC')->fetchAll();
    }

    public function count(): int
    {
        return (int) $this->pdo->query('SELECT COUNT(*) FROM videos')->fetchColumn();
    }
}
