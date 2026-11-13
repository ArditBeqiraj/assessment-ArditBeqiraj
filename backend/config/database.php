<?php

require_once __DIR__.'/environment.php';

function database(): PDO
{
    static $pdo;

    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $host = env('DB_HOST');
    $port = env('DB_PORT');
    $name = env('DB_DATABASE');
    $username = env('DB_USERNAME');
    $password = env('DB_PASSWORD', '');

    if (!$host || !$port || !$name || !$username) {
        throw new RuntimeException('Database environment variables are missing.');
    }

    if (!ctype_digit($port) || !preg_match('/^[A-Za-z0-9_]+$/', $name)) {
        throw new RuntimeException('Database environment variables are invalid.');
    }

    $pdo = new PDO(
        "mysql:host={$host};port={$port};charset=utf8mb4",
        $username,
        $password,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]
    );

    $pdo->exec("CREATE DATABASE IF NOT EXISTS `{$name}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    $pdo->exec("USE `{$name}`");
    initializeDatabase($pdo);

    return $pdo;
}

function initializeDatabase(PDO $pdo): void
{
    $pdo->exec("CREATE TABLE IF NOT EXISTS users (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        first_name VARCHAR(50) NOT NULL CHECK (CHAR_LENGTH(first_name) BETWEEN 2 AND 50),
        last_name VARCHAR(50) NOT NULL CHECK (CHAR_LENGTH(last_name) BETWEEN 2 AND 50),
        username VARCHAR(30) NOT NULL UNIQUE CHECK (CHAR_LENGTH(username) BETWEEN 3 AND 30),
        email VARCHAR(120) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role ENUM('USER', 'ADMIN') NOT NULL DEFAULT 'USER',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $pdo->exec("CREATE TABLE IF NOT EXISTS videos (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(150) NOT NULL CHECK (CHAR_LENGTH(title) BETWEEN 3 AND 150),
        description VARCHAR(1000) NOT NULL CHECK (CHAR_LENGTH(description) BETWEEN 5 AND 1000),
        file_name VARCHAR(255) NOT NULL,
        thumbnail VARCHAR(255) NULL,
        duration_seconds MEDIUMINT UNSIGNED NOT NULL CHECK (duration_seconds BETWEEN 1 AND 86400),
        owner_id INT UNSIGNED NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX videos_owner_id_index (owner_id),
        CONSTRAINT videos_owner_id_foreign FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $pdo->exec("CREATE TABLE IF NOT EXISTS annotations (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        time_seconds DECIMAL(10,3) UNSIGNED NOT NULL,
        description VARCHAR(200) NOT NULL CHECK (CHAR_LENGTH(description) BETWEEN 1 AND 200),
        drawing_data JSON NOT NULL CHECK (JSON_VALID(drawing_data)),
        video_id INT UNSIGNED NOT NULL,
        user_id INT UNSIGNED NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX annotations_video_id_index (video_id),
        INDEX annotations_user_id_index (user_id),
        CONSTRAINT annotations_video_id_foreign FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE,
        CONSTRAINT annotations_user_id_foreign FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $pdo->exec("CREATE TABLE IF NOT EXISTS bookmarks (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        time_seconds DECIMAL(10,3) UNSIGNED NOT NULL,
        title VARCHAR(100) NOT NULL CHECK (CHAR_LENGTH(title) BETWEEN 1 AND 100),
        video_id INT UNSIGNED NOT NULL,
        user_id INT UNSIGNED NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX bookmarks_video_id_index (video_id),
        INDEX bookmarks_user_id_index (user_id),
        CONSTRAINT bookmarks_video_id_foreign FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE,
        CONSTRAINT bookmarks_user_id_foreign FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    initializeDevelopmentAdmin($pdo);
}

function initializeDevelopmentAdmin(PDO $pdo): void
{
    $password = env('VIDEOMANAGER_ADMIN_PASSWORD');
    if (!is_string($password) || strlen($password) < 8) {
        return;
    }

    $username = strtolower(trim((string) env('VIDEOMANAGER_ADMIN_USERNAME', 'admin')));
    $email = strtolower(trim((string) env('VIDEOMANAGER_ADMIN_EMAIL', 'admin@example.com')));

    $statement = $pdo->prepare('SELECT id FROM users WHERE username = ? OR email = ?');
    $statement->execute([$username, $email]);
    if ($statement->fetch()) {
        return;
    }

    $statement = $pdo->prepare('INSERT INTO users
        (first_name, last_name, username, email, password, role)
        VALUES (?, ?, ?, ?, ?, "ADMIN")');
    $statement->execute([
        'System',
        'Admin',
        $username,
        $email,
        password_hash($password, PASSWORD_DEFAULT),
    ]);
}
