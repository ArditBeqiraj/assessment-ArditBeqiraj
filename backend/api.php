<?php

require_once __DIR__.'/config/app.php';
require_once __DIR__.'/controllers/AuthController.php';
require_once __DIR__.'/controllers/VideoController.php';
require_once __DIR__.'/controllers/AnnotationController.php';
require_once __DIR__.'/controllers/BookmarkController.php';
require_once __DIR__.'/controllers/AdminController.php';

set_exception_handler(static function (Throwable $exception): void {
    error_log($exception::class.': '.$exception->getMessage());
    jsonError('The server could not complete your request. Please try again.', [], 500);
});

$pdo = database();
$user = currentUser();
$method = $_SERVER['REQUEST_METHOD'];
$resource = $_GET['resource'] ?? '';

$authController = new AuthController($pdo);
$videoController = new VideoController($pdo);
$annotationController = new AnnotationController($pdo);
$bookmarkController = new BookmarkController($pdo);
$adminController = new AdminController($pdo);

if ($method === 'GET' && $resource === 'session') {
    jsonSuccess('Session loaded.', ['user' => $user]);
}

if ($method === 'POST' && $resource === 'login') {
    $authController->authenticate($_POST);
}

if ($method === 'POST' && $resource === 'register') {
    $authController->registerUser($_POST);
}

if (!$user) {
    jsonError('Your session has expired. Please log in again.', [], 401);
}

switch ($method.':'.$resource) {
    case 'POST:logout':
        $authController->signOut();
    case 'GET:videos':
        $videoController->index($_GET, $user);
    case 'GET:video':
        $videoController->show((int) ($_GET['id'] ?? 0), $user);
    case 'HEAD:stream':
    case 'GET:stream':
        $videoController->streamVideo((int) ($_GET['id'] ?? 0), $user);
    case 'POST:videos':
        $videoController->uploadVideo($_POST, $_FILES, $user);
    case 'POST:annotations':
        $annotationController->create($_POST, $user);
    case 'POST:bookmarks':
        $bookmarkController->create($_POST, $user);
    case 'GET:admin':
        if (!isAdmin()) {
            jsonError('Administrator access is required.', [], 403);
        }
        $adminController->index($_GET);
    default:
        jsonError('API endpoint not found.', [], 404);
}
