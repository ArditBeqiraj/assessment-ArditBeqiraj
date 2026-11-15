<?php

require_once dirname(__DIR__).'/models/User.php';
require_once dirname(__DIR__).'/models/Video.php';
require_once dirname(__DIR__).'/models/Annotation.php';
require_once dirname(__DIR__).'/models/Bookmark.php';

class AdminService
{
    public function __construct(private PDO $pdo) {}

    public function dashboard(int $usersPage): array
    {
        $videoModel = new Video($this->pdo);
        $annotationModel = new Annotation($this->pdo);
        $bookmarkModel = new Bookmark($this->pdo);
        $userModel = new User($this->pdo);

        return [
            'stats' => [
                'videos' => $videoModel->count(),
                'annotations' => $annotationModel->count(),
                'bookmarks' => $bookmarkModel->count(),
            ],
            'recentVideos' => $videoModel->recent(5),
            'userPagination' => $userModel->paginate($usersPage, 5),
        ];
    }
}
