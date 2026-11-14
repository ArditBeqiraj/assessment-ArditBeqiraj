<?php

require_once dirname(__DIR__).'/models/Annotation.php';
require_once dirname(__DIR__).'/models/Video.php';

class AnnotationService
{
    private Annotation $annotationModel;
    private Video $videoModel;

    public function __construct(PDO $pdo)
    {
        $this->annotationModel = new Annotation($pdo);
        $this->videoModel = new Video($pdo);
    }

    public function create(array $input, int $userId): array
    {
        $videoId = filter_var($input['video_id'] ?? null, FILTER_VALIDATE_INT);
        $timestamp = filter_var($input['timestamp'] ?? null, FILTER_VALIDATE_FLOAT);
        $description = trim($input['description'] ?? '');
        $drawing = json_decode($input['drawing_data'] ?? '', true);
        $video = $videoId ? $this->videoModel->find($videoId) : null;

        if (!$video) {
            return ['ok' => false, 'message' => 'Video not found.', 'errors' => ['video_id' => 'Video not found.']];
        }

        if ($timestamp === false || $timestamp < 0 || $timestamp > (float) $video['duration_seconds']) {
            return ['ok' => false, 'message' => 'Choose a valid moment in the video.', 'errors' => ['timestamp' => 'Choose a valid moment in the video.']];
        }

        if (strlen($description) < 1 || strlen($description) > 200) {
            return ['ok' => false, 'message' => 'Description must contain 1 to 200 characters.', 'errors' => ['description' => 'Description must contain 1 to 200 characters.']];
        }

        $sanitized = $this->sanitizeDrawing($drawing);
        if (!$sanitized) {
            return ['ok' => false, 'message' => 'Draw on the video before saving.', 'errors' => ['drawing_data' => 'Draw on the video before saving.']];
        }

        $data = [
            'video_id' => (int) $videoId,
            'user_id' => $userId,
            'timestamp' => number_format((float) $timestamp, 3, '.', ''),
            'description' => $description,
            'drawing_data' => $sanitized,
        ];
        $data['id'] = $this->annotationModel->create($data);

        return ['ok' => true, 'annotation' => $data];
    }

    private function sanitizeDrawing(mixed $drawing): array
    {
        if (!is_array($drawing) || count($drawing) < 1 || count($drawing) > 30) {
            return [];
        }

        $result = [];
        foreach ($drawing as $stroke) {
            if (!is_array($stroke) || !in_array($stroke['type'] ?? '', ['pen', 'circle', 'rect'], true) || !is_array($stroke['points'] ?? null)) {
                return [];
            }

            $type = $stroke['type'];
            $pointCount = count($stroke['points']);
            if ($type === 'pen' && ($pointCount < 2 || $pointCount > 2000)) {
                return [];
            }

            if ($type !== 'pen' && $pointCount !== 2) {
                return [];
            }

            $points = [];
            foreach ($stroke['points'] as $point) {
                $x = $point['x'] ?? null;
                $y = $point['y'] ?? null;
                if (!is_numeric($x) || !is_numeric($y) || $x < 0 || $x > 1 || $y < 0 || $y > 1) {
                    return [];
                }
                $points[] = ['x' => round((float) $x, 5), 'y' => round((float) $y, 5)];
            }

            $result[] = ['type' => $type, 'color' => '#d53228', 'points' => $points];
        }

        return $result;
    }
}
