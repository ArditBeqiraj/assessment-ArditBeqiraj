<?php

require_once dirname(__DIR__).'/services/AuthService.php';

class AuthController
{
    private AuthService $authService;

    public function __construct(PDO $pdo)
    {
        $this->authService = new AuthService($pdo);
    }

    public function authenticate(array $input): never
    {
        $result = $this->authService->login($input);
        if (!$result['ok']) {
            jsonError($result['message'], $result['errors'] ?? [], 422);
        }

        jsonSuccess('Login successful.', ['user' => $result['user']]);
    }

    public function registerUser(array $input): never
    {
        $result = $this->authService->register($input);
        if (!$result['ok']) {
            jsonError($result['message'], $result['errors'] ?? [], 422);
        }

        jsonSuccess('Account created successfully.', ['user' => $result['user']], null, 201);
    }

    public function signOut(): never
    {
        $this->authService->logout();
        jsonSuccess('Logged out successfully.');
    }
}
