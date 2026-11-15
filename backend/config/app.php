<?php

require_once __DIR__.'/database.php';

ini_set('display_errors', '0');
ini_set('log_errors', '1');
header_remove('X-Powered-By');

$frontendOrigin = rtrim(env('FRONTEND_URL', 'http://localhost:5173'), '/');
$requestOrigin = rtrim($_SERVER['HTTP_ORIGIN'] ?? '', '/');

if ($requestOrigin !== '' && hash_equals($frontendOrigin, $requestOrigin)) {
    header('Access-Control-Allow-Origin: '.$frontendOrigin);
    header('Access-Control-Allow-Credentials: true');
    header('Vary: Origin');
}

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    if ($requestOrigin === '' || !hash_equals($frontendOrigin, $requestOrigin)) {
        http_response_code(403);
        exit;
    }

    header('Access-Control-Allow-Methods: GET, HEAD, POST, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Accept, Content-Type, X-CSRF-Token');
    header('Access-Control-Max-Age: 600');
    http_response_code(204);
    exit;
}

if (session_status() !== PHP_SESSION_ACTIVE) {
    session_set_cookie_params([
        'path' => '/',
        'secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    session_start();
}

function currentUser(): ?array
{
    return $_SESSION['user'] ?? null;
}

function csrfToken(): string
{
    if (!isset($_SESSION['csrf_token']) || !is_string($_SESSION['csrf_token']) || $_SESSION['csrf_token'] === '') {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }

    return $_SESSION['csrf_token'];
}

function verifyCsrfToken(): void
{
    $provided = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    $expected = csrfToken();

    if (!is_string($provided) || $provided === '' || !hash_equals($expected, $provided)) {
        jsonError('Your security token is invalid. Please try again.', [], 403);
    }
}

function isAdmin(): bool
{
    return (currentUser()['role'] ?? '') === 'ADMIN';
}

function jsonResponse(array $data, int $status = 200): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('X-Content-Type-Options: nosniff');
    echo json_encode($data);
    exit;
}

function jsonSuccess(string $message, array $data = [], ?string $redirect = null, int $status = 200): never
{
    jsonResponse([
        'status' => 'success',
        'message' => $message,
        'redirect' => $redirect,
        'data' => $data,
    ], $status);
}

function jsonError(string $message, array $errors = [], int $status = 422): never
{
    jsonResponse([
        'status' => 'error',
        'message' => $message,
        'errors' => $errors,
    ], $status);
}
