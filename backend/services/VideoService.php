<?php

require_once dirname(__DIR__).'/models/Video.php';
require_once dirname(__DIR__).'/models/Annotation.php';
require_once dirname(__DIR__).'/models/Bookmark.php';

class VideoService
{
    private Video $videoModel;
    private Annotation $annotationModel;
    private Bookmark $bookmarkModel;

    public function __construct(PDO $pdo)
    {
        $this->videoModel = new Video($pdo);
        $this->annotationModel = new Annotation($pdo);
        $this->bookmarkModel = new Bookmark($pdo);
    }

    public function library(int $userId, bool $mine, string $search, int $page): array
    {
        return $this->videoModel->paginate(trim($search), $mine ? $userId : null, max(1, $page), 8);
    }

    public function details(int $id, array $user): ?array
    {
        $video = $this->videoModel->find($id);

        if (!$video) {
            return null;
        }

        $canSeeAll = $user['role'] === 'ADMIN' || (int) $video['owner_id'] === (int) $user['id'];
        $userFilter = $canSeeAll ? null : (int) $user['id'];

        return [
            'video' => $video,
            'annotations' => $this->annotationModel->forVideo($id, $userFilter),
            'bookmarks' => $this->bookmarkModel->forVideo($id, $userFilter),
        ];
    }

    public function playback(int $id): ?array
    {
        return $this->videoModel->find($id);
    }

    public function upload(array $input, array $files, int $userId): array
    {
        $title = trim($input['title'] ?? '');
        $description = trim($input['description'] ?? '');
        if (strlen($title) < 3 || strlen($title) > 150) {
            return ['ok' => false, 'message' => 'Title must contain 3 to 150 characters.', 'errors' => ['title' => 'Title must contain 3 to 150 characters.']];
        }

        if (strlen($description) < 5 || strlen($description) > 1000) {
            return ['ok' => false, 'message' => 'Description must contain 5 to 1000 characters.', 'errors' => ['description' => 'Description must contain 5 to 1000 characters.']];
        }

        $video = $files['video_file'] ?? null;

        if (!$video || $video['error'] !== UPLOAD_ERR_OK) {
            return ['ok' => false, 'message' => 'Choose an MP4 video.', 'errors' => ['video_file' => 'Choose an MP4 video.']];
        }

        if ($video['size'] > 100 * 1024 * 1024 || strtolower(pathinfo($video['name'], PATHINFO_EXTENSION)) !== 'mp4') {
            return ['ok' => false, 'message' => 'The video must be an MP4 file under 100MB.', 'errors' => ['video_file' => 'The video must be an MP4 file under 100MB.']];
        }

        $videoMime = (new finfo(FILEINFO_MIME_TYPE))->file($video['tmp_name']);
        if (!in_array($videoMime, ['video/mp4', 'application/octet-stream'], true)) {
            return ['ok' => false, 'message' => 'The selected file is not a valid MP4 video.', 'errors' => ['video_file' => 'The selected file is not a valid MP4 video.']];
        }

        $duration = $this->readMp4Duration($video['tmp_name']);
        if ($duration === null || $duration < 1 || $duration > 86400) {
            return ['ok' => false, 'message' => 'Could not read the video duration.', 'errors' => ['video_file' => 'Please select a valid MP4 video.']];
        }

        $thumbnail = $files['thumbnail'] ?? null;
        $thumbnailExtension = null;

        if ($thumbnail && $thumbnail['error'] !== UPLOAD_ERR_NO_FILE) {
            if ($thumbnail['error'] !== UPLOAD_ERR_OK || $thumbnail['size'] > 5 * 1024 * 1024) {
                return ['ok' => false, 'message' => 'The thumbnail must be an image under 5MB.', 'errors' => ['thumbnail' => 'The thumbnail must be an image under 5MB.']];
            }

            $thumbnailExtension = strtolower(pathinfo($thumbnail['name'], PATHINFO_EXTENSION));
            $thumbnailMime = (new finfo(FILEINFO_MIME_TYPE))->file($thumbnail['tmp_name']);
            $allowedImages = ['jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg', 'png' => 'image/png', 'webp' => 'image/webp'];

            if (!isset($allowedImages[$thumbnailExtension]) || $allowedImages[$thumbnailExtension] !== $thumbnailMime) {
                return ['ok' => false, 'message' => 'Use a JPG, PNG, or WebP thumbnail.', 'errors' => ['thumbnail' => 'Use a JPG, PNG, or WebP thumbnail.']];
            }
        }

        $directory = dirname(__DIR__).'/uploads';
        if (!is_dir($directory)) {
            mkdir($directory, 0775, true);
        }

        $videoName = bin2hex(random_bytes(16)).'.mp4';
        if (!move_uploaded_file($video['tmp_name'], $directory.'/'.$videoName)) {
            return ['ok' => false, 'message' => 'The video could not be uploaded.', 'errors' => ['video_file' => 'The video could not be uploaded.']];
        }

        $thumbnailName = null;
        if ($thumbnailExtension !== null) {
            $thumbnailName = bin2hex(random_bytes(16)).'.'.$thumbnailExtension;
            if (!move_uploaded_file($thumbnail['tmp_name'], $directory.'/'.$thumbnailName)) {
                unlink($directory.'/'.$videoName);
                return ['ok' => false, 'message' => 'The thumbnail could not be uploaded.', 'errors' => ['thumbnail' => 'The thumbnail could not be uploaded.']];
            }
        }

        try {
            $id = $this->videoModel->create([
                'title' => $title,
                'description' => $description,
                'file_name' => $videoName,
                'thumbnail' => $thumbnailName,
                'duration_seconds' => $duration,
                'owner_id' => $userId,
            ]);
        } catch (Throwable $exception) {
            @unlink($directory.'/'.$videoName);
            if ($thumbnailName !== null) {
                @unlink($directory.'/'.$thumbnailName);
            }
            throw $exception;
        }

        return ['ok' => true, 'id' => $id];
    }

    private function readMp4Duration(string $path): ?int
    {
        $handle = @fopen($path, 'rb');
        $fileSize = @filesize($path);
        if (!$handle || !is_int($fileSize) || $fileSize < 16) {
            if (is_resource($handle)) fclose($handle);
            return null;
        }

        $hasFileType = false;
        $movieBox = null;
        $offset = 0;

        while ($offset + 8 <= $fileSize) {
            $box = $this->readMp4BoxHeader($handle, $offset, $fileSize);
            if ($box === null) break;
            if ($box['type'] === 'ftyp') $hasFileType = true;
            if ($box['type'] === 'moov') {
                $movieBox = $box;
                break;
            }
            $offset = $box['end'];
        }

        if (!$hasFileType || $movieBox === null) {
            fclose($handle);
            return null;
        }

        $offset = $movieBox['content'];
        while ($offset + 8 <= $movieBox['end']) {
            $box = $this->readMp4BoxHeader($handle, $offset, $movieBox['end']);
            if ($box === null) break;
            if ($box['type'] === 'mvhd') {
                fseek($handle, $box['content']);
                $versionData = fread($handle, 4);
                if ($versionData === false || strlen($versionData) !== 4) break;
                $version = ord($versionData[0]);
                $skip = $version === 1 ? 16 : 8;
                if ($version !== 0 && $version !== 1) break;
                fseek($handle, $skip, SEEK_CUR);
                $timeData = fread($handle, $version === 1 ? 12 : 8);
                if ($timeData === false || strlen($timeData) !== ($version === 1 ? 12 : 8)) break;

                $timescale = unpack('Nvalue', substr($timeData, 0, 4))['value'];
                if ($version === 1) {
                    $parts = unpack('Nhigh/Nlow', substr($timeData, 4, 8));
                    $duration = $parts['high'] * 4294967296 + $parts['low'];
                } else {
                    $duration = unpack('Nvalue', substr($timeData, 4, 4))['value'];
                }

                fclose($handle);
                return $timescale > 0 && $duration > 0 ? (int) ceil($duration / $timescale) : null;
            }
            $offset = $box['end'];
        }

        fclose($handle);
        return null;
    }

    private function readMp4BoxHeader($handle, int $offset, int $containerEnd): ?array
    {
        fseek($handle, $offset);
        $header = fread($handle, 8);
        if ($header === false || strlen($header) !== 8) return null;

        $values = unpack('Nsize/a4type', $header);
        $size = (int) $values['size'];
        $headerSize = 8;
        if ($size === 1) {
            $extended = fread($handle, 8);
            if ($extended === false || strlen($extended) !== 8) return null;
            $parts = unpack('Nhigh/Nlow', $extended);
            $size = (int) ($parts['high'] * 4294967296 + $parts['low']);
            $headerSize = 16;
        } elseif ($size === 0) {
            $size = $containerEnd - $offset;
        }

        $end = $offset + $size;
        if ($size < $headerSize || $end > $containerEnd || $end <= $offset) return null;

        return [
            'type' => $values['type'],
            'content' => $offset + $headerSize,
            'end' => $end,
        ];
    }
}
