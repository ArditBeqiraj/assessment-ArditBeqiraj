<?php

$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
$file = realpath(__DIR__.$path);

if ($path !== '/' && $file && str_starts_with($file, __DIR__.DIRECTORY_SEPARATOR) && is_file($file)) {
    return false;
}

http_response_code(404);
header('Content-Type: application/json; charset=utf-8');
echo json_encode([
    'status' => 'error',
    'message' => 'Backend endpoint not found.',
    'errors' => (object) [],
]);
