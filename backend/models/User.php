<?php

class User
{
    public function __construct(private PDO $pdo) {}

    public function findByUsername(string $username): ?array
    {
        $statement = $this->pdo->prepare('SELECT * FROM users WHERE username = ?');
        $statement->execute([$username]);

        return $statement->fetch() ?: null;
    }

    public function registrationConflicts(string $username, string $email): array
    {
        $statement = $this->pdo->prepare('SELECT username, email FROM users WHERE username = ? OR email = ?');
        $statement->execute([$username, $email]);
        $conflicts = ['username' => false, 'email' => false];

        foreach ($statement->fetchAll() as $user) {
            $conflicts['username'] = $conflicts['username'] || $user['username'] === $username;
            $conflicts['email'] = $conflicts['email'] || $user['email'] === $email;
        }

        return $conflicts;
    }

    public function create(array $data): array
    {
        $statement = $this->pdo->prepare('INSERT INTO users
            (first_name, last_name, username, email, password, role)
            VALUES (?, ?, ?, ?, ?, "USER")');
        $statement->execute([
            $data['first_name'],
            $data['last_name'],
            $data['username'],
            $data['email'],
            password_hash($data['password'], PASSWORD_DEFAULT),
        ]);

        return $this->findByUsername($data['username']);
    }

    public function paginate(int $page, int $perPage = 5): array
    {
        $total = $this->count();
        $pages = max(1, (int) ceil($total / $perPage));
        $page = min(max(1, $page), $pages);
        $offset = ($page - 1) * $perPage;
        $items = $this->pdo->query('SELECT id, first_name, last_name, username, email, role, created_at
            FROM users ORDER BY id DESC LIMIT '.(int) $perPage.' OFFSET '.(int) $offset)->fetchAll();

        return [
            'items' => $items,
            'total' => $total,
            'page' => $page,
            'pages' => $pages,
            'per_page' => $perPage,
        ];
    }

    public function count(): int
    {
        return (int) $this->pdo->query('SELECT COUNT(*) FROM users')->fetchColumn();
    }
}
