<?php

require_once dirname(__DIR__).'/models/Bookmark.php';
require_once dirname(__DIR__).'/models/Video.php';

class BookmarkService
{
    private Bookmark $bookmarkModel;
    private Video $videoModel;

    public function __construct(PDO $pdo)
    {
        $this->bookmarkModel = new Bookmark($pdo);
        $this->videoModel = new Video($pdo);
    }

    public function create(array $input, int $userId): array
    {
        $videoId = filter_var($input['video_id'] ?? null, FILTER_VALIDATE_INT);
        $timestamp = filter_var($input['timestamp'] ?? null, FILTER_VALIDATE_FLOAT);
        $title = trim($input['title'] ?? '');
        $video = $videoId ? $this->videoModel->find($videoId) : null;

        if (!$video) {
            return ['ok' => false, 'message' => 'Video not found.', 'errors' => ['video_id' => 'Video not found.']];
        }

        if ($timestamp === false || $timestamp < 0 || $timestamp > (float) $video['duration_seconds']) {
            return ['ok' => false, 'message' => 'Choose a valid moment in the video.', 'errors' => ['timestamp' => 'Choose a valid moment in the video.']];
        }

        if (strlen($title) < 1 || strlen($title) > 100) {
            return ['ok' => false, 'message' => 'Title must contain 1 to 100 characters.', 'errors' => ['title' => 'Title must contain 1 to 100 characters.']];
        }

        $data = [
            'video_id' => (int) $videoId,
            'user_id' => $userId,
            'timestamp' => number_format((float) $timestamp, 3, '.', ''),
            'title' => $title,
        ];
        $data['id'] = $this->bookmarkModel->create($data);

        return ['ok' => true, 'bookmark' => $data];
    }
}
