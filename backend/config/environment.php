<?php

function loadEnvironment(string $path): void
{
    if (!is_file($path)) {
        return;
    }

    $values = parse_ini_file($path, false, INI_SCANNER_RAW);
    if (!is_array($values)) {
        throw new RuntimeException('The environment file could not be read.');
    }

    foreach ($values as $key => $value) {
        if (getenv($key) !== false) {
            continue;
        }

        $value = (string) $value;
        putenv($key.'='.$value);
        $_ENV[$key] = $value;
    }
}

function env(string $key, ?string $default = null): ?string
{
    $value = getenv($key);
    return $value === false ? $default : $value;
}

loadEnvironment(dirname(__DIR__).'/.env');
