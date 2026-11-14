<?php

require_once dirname(__DIR__).'/services/AnnotationService.php';

class AnnotationController
{
    private AnnotationService $annotationService;

    public function __construct(PDO $pdo)
    {
        $this->annotationService = new AnnotationService($pdo);
    }

    public function create(array $input, array $user): never
    {
        $result = $this->annotationService->create($input, (int) $user['id']);
        if (!$result['ok']) {
            jsonError($result['message'], $result['errors'] ?? [], 422);
        }

        jsonSuccess('Annotation added successfully.', ['annotation' => $result['annotation']], null, 201);
    }
}
