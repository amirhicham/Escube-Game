<?php
// Récupération des données POST
$data = json_decode(file_get_contents('php://input'), true);
$pseudo = isset($data['pseudo']) ? trim($data['pseudo']) : '';
$temps = isset($data['temps']) ? intval($data['temps']) : 0;

// Validation simple
if ($pseudo === '' || $temps <= 0) {
    http_response_code(400);
    echo json_encode(['error' => 'Pseudo ou temps invalide']);
    exit;
}

// Charger le leaderboard existant
$file = 'leaderboard.json';
if (file_exists($file)) {
    $leaderboard = json_decode(file_get_contents($file), true);
    if (!is_array($leaderboard)) $leaderboard = [];
} else {
    $leaderboard = [];
}

// Ajouter le nouveau score
$leaderboard[] = [
    'pseudo' => htmlspecialchars($pseudo),
    'temps' => $temps
];

// Trier par temps croissant (meilleurs en haut)
usort($leaderboard, function($a, $b) {
    return $a['temps'] - $b['temps'];
});

// Garder seulement les 10 meilleurs
$leaderboard = array_slice($leaderboard, 0, 10);

// Sauvegarder
file_put_contents($file, json_encode($leaderboard, JSON_PRETTY_PRINT));

// Répondre avec le leaderboard à jour
echo json_encode($leaderboard);
