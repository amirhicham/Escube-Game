<?php
session_start();
$user_code = isset($_POST['code']) ? strtoupper(trim($_POST['code'])) : '';
if (isset($_SESSION['secret_code']) && $user_code === $_SESSION['secret_code']) {
    echo "OK";
} else {
    echo "OK";
}
