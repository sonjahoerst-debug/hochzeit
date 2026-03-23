<?php
// ============================================================
// HOCHZEIT DIANA & JULIAN – Formular-Backend
// ============================================================
// Dieses Script auf deinen Webhoster hochladen (z.B. per FTP)
// URL dann ins HTML-Formular eintragen: action="https://deine-domain.de/formular.php"
//
// SETUP:
//  1. HCAPTCHA_SECRET  → von hcaptcha.com (Settings > Secret Key)
//  2. MAIL_1 + MAIL_2  → Empfänger-Adressen anpassen
//  3. CSV_FILE         → Pfad zur CSV-Datei (wird automatisch erstellt)
// ============================================================

// --- Konfiguration ---
define('HCAPTCHA_SECRET', 'DEIN_HCAPTCHA_SECRET_KEY');
define('MAIL_1',          'rsvp@hoerst.org');
define('MAIL_2',          'Dianamartin1112@gmail.com');
define('CSV_FILE',        __DIR__ . '/anmeldungen.csv');
define('ALLOWED_ORIGIN',  'https://sonjahoerst-debug.github.io');

// --- CORS & Header ---
header('Access-Control-Allow-Origin: ' . ALLOWED_ORIGIN);
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

// --- Honeypot prüfen ---
if (!empty($_POST['website'])) {
    // Bot erkannt – still 200 zurückgeben damit Bot nichts merkt
    echo json_encode(['success' => true]);
    exit;
}

// --- Zeitstempel prüfen (< 3 Sekunden = Bot) ---
$formTime = isset($_POST['form_time']) ? (int)$_POST['form_time'] : 0;
$elapsed  = (time() * 1000 - $formTime) / 1000;
if ($formTime > 0 && $elapsed < 3) {
    echo json_encode(['success' => false, 'error' => 'Zu schnell ausgefüllt.']);
    exit;
}

// --- hCaptcha serverseitig prüfen ---
$captchaToken = $_POST['h-captcha-response'] ?? '';
if (empty($captchaToken)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Captcha fehlt.']);
    exit;
}

$captchaVerify = file_get_contents(
    'https://hcaptcha.com/siteverify',
    false,
    stream_context_create([
        'http' => [
            'method'  => 'POST',
            'header'  => 'Content-Type: application/x-www-form-urlencoded',
            'content' => http_build_query([
                'secret'   => HCAPTCHA_SECRET,
                'response' => $captchaToken,
                'remoteip' => $_SERVER['REMOTE_ADDR'],
            ]),
        ],
    ])
);

$captchaResult = json_decode($captchaVerify, true);
if (empty($captchaResult['success'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Captcha ungültig.']);
    exit;
}

// --- Eingaben sanitizen ---
function clean(string $val): string {
    return htmlspecialchars(strip_tags(trim($val)), ENT_QUOTES, 'UTF-8');
}

$anwesenheit  = clean($_POST['anwesenheit']  ?? '');
$vorname      = clean($_POST['vorname']      ?? '');
$nachname     = clean($_POST['nachname']     ?? '');
$email        = filter_var(trim($_POST['email'] ?? ''), FILTER_SANITIZE_EMAIL);
$telefon      = clean($_POST['telefon']      ?? '');
$begleitung   = clean($_POST['begleitung']   ?? '');
$uebernachtung= clean($_POST['uebernachtung']?? '');
$nachricht    = clean($_POST['nachricht']    ?? '');
$zeitstempel  = date('d.m.Y H:i');

// --- Pflichtfelder prüfen ---
if (empty($anwesenheit) || empty($vorname) || empty($nachname) || !filter_var($email, FILTER_VALIDATE_EMAIL) || $begleitung === '') {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Pflichtfelder fehlen.']);
    exit;
}

// --- CSV speichern ---
$csvHeader = ['Zeitstempel','Anwesenheit','Vorname','Nachname','E-Mail','Telefon','Begleitpersonen','Übernachtung','Nachricht'];
$csvRow    = [$zeitstempel, $anwesenheit, $vorname, $nachname, $email, $telefon, $begleitung, $uebernachtung, $nachricht];

$csvNeu = !file_exists(CSV_FILE);
$fh = fopen(CSV_FILE, 'a');
if ($fh) {
    if ($csvNeu) {
        fputcsv($fh, $csvHeader, ';');
    }
    fputcsv($fh, $csvRow, ';');
    fclose($fh);
}

// --- E-Mail senden ---
$betreff = "Neue Anmeldung: {$vorname} {$nachname} – Hochzeit Diana & Julian";

$mailBody = "Neue Anmeldung für die Hochzeit Diana & Julian\n";
$mailBody .= str_repeat('=', 50) . "\n\n";
$mailBody .= "Zeitstempel:      {$zeitstempel}\n";
$mailBody .= "Anwesenheit:      {$anwesenheit}\n";
$mailBody .= "Vorname:          {$vorname}\n";
$mailBody .= "Nachname:         {$nachname}\n";
$mailBody .= "E-Mail:           {$email}\n";
$mailBody .= "Telefon:          {$telefon}\n";
$mailBody .= "Begleitpersonen:  {$begleitung}\n";
$mailBody .= "Übernachtung:     {$uebernachtung}\n";
$mailBody .= "Nachricht:\n{$nachricht}\n";

$headers  = "From: rsvp@hoerst.org\r\n";
$headers .= "Reply-To: {$email}\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";

mail(MAIL_1, $betreff, $mailBody, $headers);
mail(MAIL_2, $betreff, $mailBody, $headers);

// --- Erfolg ---
echo json_encode(['success' => true]);
