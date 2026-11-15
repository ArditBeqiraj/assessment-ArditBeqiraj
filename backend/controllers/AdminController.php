<?php

require_once dirname(__DIR__).'/services/AdminService.php';

class AdminController
{
    private AdminService $adminService;

    public function __construct(PDO $pdo)
    {
        $this->adminService = new AdminService($pdo);
    }

    public function index(array $query): never
    {
        $usersPage = max(1, (int) ($query['users_page'] ?? 1));
        jsonSuccess('Dashboard loaded successfully.', $this->adminService->dashboard($usersPage));
    }
}
