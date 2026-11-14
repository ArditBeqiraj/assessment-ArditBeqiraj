<?php

require_once dirname(__DIR__).'/models/User.php';

class AuthService
{
    private User $userModel;

    public function __construct(PDO $pdo)
    {
        $this->userModel = new User($pdo);
    }

    public function login(array $input): array
    {
        $username = strtolower(trim($input['username'] ?? ''));
        $password = $input['password'] ?? '';
        $user = $this->userModel->findByUsername($username);

        if (!$user || !password_verify($password, $user['password'])) {
            return ['ok' => false, 'message' => 'Invalid username or password.', 'errors' => []];
        }

        unset($user['password']);
        session_regenerate_id(true);
        $_SESSION['user'] = $user;

        return ['ok' => true, 'user' => $user];
    }

    public function register(array $input): array
    {
        $data = [
            'first_name' => trim($input['first_name'] ?? ''),
            'last_name' => trim($input['last_name'] ?? ''),
            'username' => strtolower(trim($input['username'] ?? '')),
            'email' => strtolower(trim($input['email'] ?? '')),
            'password' => $input['password'] ?? '',
        ];

        if (in_array('', $data, true)) {
            $errors = [];
            foreach ($data as $field => $value) {
                if ($value === '') {
                    $errors[$field] = 'This field is required.';
                }
            }
            return ['ok' => false, 'message' => 'All fields are required.', 'errors' => $errors];
        }

        $nameErrors = [];
        if (!preg_match('/^[a-zA-Z -]{2,50}$/', $data['first_name'])) {
            $nameErrors['first_name'] = 'Enter 2 to 50 letters, spaces, or hyphens.';
        }
        if (!preg_match('/^[a-zA-Z -]{2,50}$/', $data['last_name'])) {
            $nameErrors['last_name'] = 'Enter 2 to 50 letters, spaces, or hyphens.';
        }
        if ($nameErrors) {
            return ['ok' => false, 'message' => 'Enter a valid first and last name.', 'errors' => $nameErrors];
        }

        if (!preg_match('/^[a-z0-9_]{3,30}$/', $data['username'])) {
            return ['ok' => false, 'message' => 'Username must be 3 to 30 letters, numbers, or underscores.', 'errors' => ['username' => 'Username must be 3 to 30 letters, numbers, or underscores.']];
        }

        if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            return ['ok' => false, 'message' => 'Enter a valid email address.', 'errors' => ['email' => 'Enter a valid email address.']];
        }

        if (strlen($data['password']) < 8) {
            return ['ok' => false, 'message' => 'Password must contain at least 8 characters.', 'errors' => ['password' => 'Password must contain at least 8 characters.']];
        }

        $conflicts = $this->userModel->registrationConflicts($data['username'], $data['email']);
        if ($conflicts['username'] || $conflicts['email']) {
            $errors = [];
            if ($conflicts['username']) {
                $errors['username'] = 'That username is already registered.';
            }
            if ($conflicts['email']) {
                $errors['email'] = 'That email address is already registered.';
            }
            return ['ok' => false, 'message' => 'An account already uses those details.', 'errors' => $errors];
        }

        $user = $this->userModel->create($data);
        unset($user['password']);
        session_regenerate_id(true);
        $_SESSION['user'] = $user;

        return ['ok' => true, 'user' => $user];
    }

    public function logout(): void
    {
        $_SESSION = [];
        session_regenerate_id(true);
    }
}
