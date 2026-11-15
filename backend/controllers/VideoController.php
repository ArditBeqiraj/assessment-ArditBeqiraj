<?php

require_once dirname(__DIR__).'/services/VideoService.php';

class VideoController
{
    private VideoService $videoService;

    public function __construct(PDO $pdo)
    {
        $this->videoService = new VideoService($pdo);
    }

    public function index(array $query, array $user): never
    {
        $mine = ($query['mine'] ?? '') === '1';
        $search = trim($query['search'] ?? '');
        $page = max(1, (int) ($query['p'] ?? 1));

        jsonSuccess('Videos loaded successfully.', [
            'pagination' => $this->videoService->library((int) $user['id'], $mine, $search, $page),
            'mine' => $mine,
            'search' => $search,
        ]);
    }

    public function show(int $id, array $user): never
    {
        $details = $this->videoService->details($id, $user);
        if (!$details) {
            jsonError('Video not found.', [], 404);
        }

        jsonSuccess('Video loaded successfully.', $details);
    }

    public function streamVideo(int $id, array $user): never
    {
        $video = $this->videoService->playback($id);
        if (!$video) {
            http_response_code(404);
            exit('Video not found.');
        }

        $uploadDirectory = realpath(dirname(__DIR__).'/uploads');
        $filePath = realpath(dirname(__DIR__).'/uploads/'.$video['file_name']);
        if (!$uploadDirectory || !$filePath || !str_starts_with($filePath, $uploadDirectory.DIRECTORY_SEPARATOR) || !is_file($filePath)) {
            http_response_code(404);
            exit('Video file not found.');
        }

        $fileSize = filesize($filePath);
        $start = 0;
        $end = $fileSize - 1;
        $status = 200;
        $range = trim($_SERVER['HTTP_RANGE'] ?? '');

        if ($range !== '') {
            if (!preg_match('/^bytes=(\d*)-(\d*)$/', $range, $matches)) {
                header('Content-Range: bytes */'.$fileSize);
                http_response_code(416);
                exit;
            }

            if ($matches[1] === '' && $matches[2] !== '') {
                $suffixLength = min((int) $matches[2], $fileSize);
                $start = $fileSize - $suffixLength;
            } else {
                $start = (int) $matches[1];
                if ($matches[2] !== '') {
                    $end = min((int) $matches[2], $fileSize - 1);
                }
            }

            if ($start < 0 || $start > $end || $start >= $fileSize) {
                header('Content-Range: bytes */'.$fileSize);
                http_response_code(416);
                exit;
            }
            $status = 206;
        }

        $length = $end - $start + 1;
        http_response_code($status);
        header('Content-Type: video/mp4');
        header('Accept-Ranges: bytes');
        header('Content-Length: '.$length);
        header('Cache-Control: private, max-age=3600');
        if ($status === 206) {
            header("Content-Range: bytes {$start}-{$end}/{$fileSize}");
        }

        if ($_SERVER['REQUEST_METHOD'] === 'HEAD') {
            exit;
        }

        if (session_status() === PHP_SESSION_ACTIVE) {
            session_write_close();
        }
        while (ob_get_level() > 0) {
            ob_end_clean();
        }

        $handle = fopen($filePath, 'rb');
        if (!$handle) {
            http_response_code(500);
            exit;
        }

        set_time_limit(0);
        fseek($handle, $start);
        $remaining = $length;
        while ($remaining > 0 && !feof($handle) && connection_status() === CONNECTION_NORMAL) {
            $chunk = fread($handle, min(1024 * 1024, $remaining));
            if ($chunk === false || $chunk === '') {
                break;
            }
            echo $chunk;
            flush();
            $remaining -= strlen($chunk);
        }
        fclose($handle);
        exit;
    }

    public function uploadVideo(array $input, array $files, array $user): never
    {
        $result = $this->videoService->upload($input, $files, (int) $user['id']);
        if (!$result['ok']) {
            jsonError($result['message'], $result['errors'] ?? [], 422);
        }

        jsonSuccess('Video uploaded successfully.', ['id' => $result['id']], null, 201);
    }

    public function deleteVideo(int $id, array $user): never
    {
        $result = $this->videoService->delete($id, $user);
        if (!$result['ok']) {
            jsonError($result['message'], [], $result['status']);
        }

        jsonSuccess($result['message']);
    }
}
