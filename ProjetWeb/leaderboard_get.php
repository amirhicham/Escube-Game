<?php
$file = 'leaderboard.json';
if (file_exists($file)) {
    $leaderboard = json_decode(file_get_contents($file), true);
    if (!is_array($leaderboard)) $leaderboard = [];
} else {
    $leaderboard = [];
}
echo json_encode($leaderboard);
