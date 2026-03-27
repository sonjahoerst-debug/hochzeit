<?php
// ============================================================
// HOCHZEIT DIANA & JULIAN – Formular-Backend
// ============================================================
// PHPMailer via Gmail SMTP
//
// E-Mails gehen an:
//   To:  julian.hoerst@gmail.com (Julian)
//   CC:  Dianamartin1112@gmail.com (Diana)
// ============================================================

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

require __DIR__ . '/phpmailer/src/Exception.php';
require __DIR__ . '/phpmailer/src/PHPMailer.php';
require __DIR__ . '/phpmailer/src/SMTP.php';

// --- Konfiguration ---
define('MAIL_TO',         'julian.hoerst@gmail.com');
define('MAIL_CC',         'Dianamartin1112@gmail.com');
define('GMAIL_USER',      'sonjahoerst@gmail.com');
define('GMAIL_PASS',      'pjegdxcpvryxchrs');
define('CSV_FILE',        __DIR__ . '/anmeldungen.csv');
define('ALLOWED_ORIGIN',  'https://hochzeit.hoerst.org');

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

// --- Eingaben sanitizen ---
function clean(string $val): string {
    return htmlspecialchars(strip_tags(trim($val)), ENT_QUOTES, 'UTF-8');
}

$anwesenheit   = clean($_POST['anwesenheit']    ?? '');
$vorname       = clean($_POST['vorname']        ?? '');
$nachname      = clean($_POST['nachname']       ?? '');
$email         = filter_var(trim($_POST['email'] ?? ''), FILTER_SANITIZE_EMAIL);
$telefon       = clean($_POST['telefon']        ?? '–');
$begleitung    = clean($_POST['begleitung']     ?? '0');
$begleitNamen  = clean($_POST['begleit_namen']  ?? '–');
$unterkunft    = clean($_POST['unterkunft']     ?? '–');
$essen         = clean($_POST['essen']          ?? '–');
$essenSonst    = clean($_POST['essen_sonstiges']?? '–');
$zeitstempel   = date('d.m.Y H:i');

// --- Pflichtfelder prüfen ---
if (empty($anwesenheit) || empty($vorname) || empty($nachname) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Pflichtfelder fehlen.']);
    exit;
}

// --- Lesbarer Status ---
$status = ($anwesenheit === 'zusage') ? '✅ CHECK-IN (Zusage)' : '❌ CHECK-OUT (Absage)';

$begleitungLabel = match($begleitung) {
    '0' => 'Reist alleine',
    '1' => '+1 Person',
    '2' => '+2 Personen',
    '3' => '+3 Personen',
    '4' => '+4 Personen',
    '5' => '+5 Personen',
    default => $begleitung
};

$essenLabel = match($essen) {
    'allesser'    => 'Allesser',
    'vegetarisch' => 'Vegetarisch',
    'vegan'       => 'Vegan',
    'sonstiges'   => 'Sonstiges: ' . $essenSonst,
    default       => '–'
};

// --- CSV speichern (Backup) ---
$csvHeader = ['Zeitstempel','Status','Vorname','Nachname','E-Mail','Telefon','Begleitung','Namen Begleitung','Unterkunft','Essen'];
$csvRow    = [$zeitstempel, $status, $vorname, $nachname, $email, $telefon, $begleitungLabel, $begleitNamen, $unterkunft, $essenLabel];

$csvNeu = !file_exists(CSV_FILE);
$fh = fopen(CSV_FILE, 'a');
if ($fh) {
    if ($csvNeu) fputcsv($fh, $csvHeader, ';');
    fputcsv($fh, $csvRow, ';');
    fclose($fh);
}

// --- E-Mail zusammenbauen ---
$betreff = "=?UTF-8?B?" . base64_encode("Hochzeit RSVP: {$vorname} {$nachname} – " . ($anwesenheit === 'zusage' ? 'Zusage' : 'Absage')) . "?=";

$mailBody  = "Neue RSVP-Antwort für die Hochzeit von Diana & Julian\n";
$mailBody .= str_repeat('=', 54) . "\n\n";
$mailBody .= "Status:            {$status}\n\n";
$mailBody .= "Name:              {$vorname} {$nachname}\n";
$mailBody .= "E-Mail:            {$email}\n";
$mailBody .= "Telefon:           {$telefon}\n\n";
$mailBody .= "Begleitung:        {$begleitungLabel}\n";
if ($begleitNamen !== '–') {
    $mailBody .= "Namen Begleitung:  {$begleitNamen}\n";
}
$mailBody .= "\nUnterkunft:        {$unterkunft}\n";
$mailBody .= "Essenswunsch:      {$essenLabel}\n";
$mailBody .= "\n" . str_repeat('-', 54) . "\n";
$mailBody .= "Gesendet am: {$zeitstempel} Uhr\n";

// --- E-Mail via PHPMailer + Gmail SMTP senden ---
$mail = new PHPMailer(true);
try {
    $mail->isSMTP();
    $mail->Host       = 'smtp.gmail.com';
    $mail->SMTPAuth   = true;
    $mail->Username   = GMAIL_USER;
    $mail->Password   = GMAIL_PASS;
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port       = 587;
    $mail->CharSet    = 'UTF-8';

    $mail->setFrom(GMAIL_USER, 'RSVP Hochzeit');
    $mail->addAddress(MAIL_TO);
    $mail->addCC(MAIL_CC);
    $mail->addReplyTo($email, "{$vorname} {$nachname}");

    $mail->Subject = "Hochzeit RSVP: {$vorname} {$nachname} – " . ($anwesenheit === 'zusage' ? 'Zusage' : 'Absage');
    $mail->Body    = $mailBody;

    $mail->send();
    echo json_encode(['success' => true]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $mail->ErrorInfo]);
}
