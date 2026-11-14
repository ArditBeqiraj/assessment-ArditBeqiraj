<?php

require_once dirname(__DIR__).'/services/BookmarkService.php';

class BookmarkController
{
    private BookmarkService $bookmarkService;

    public function __construct(PDO $pdo)
    {
        $this->bookmarkService = new BookmarkService($pdo);
    }

    public function create(array $input, array $user): never
    {
        $result = $this->bookmarkService->create($input, (int) $user['id']);
        if (!$result['ok']) {
            jsonError($result['message'], $result['errors'] ?? [], 422);
        }

        jsonSuccess('Bookmark added successfully.', ['bookmark' => $result['bookmark']], null, 201);
    }
}
