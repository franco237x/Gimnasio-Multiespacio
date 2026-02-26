<?php
/**
 * send-token.php — Email Token Mailer for Gimnasio Fortaleza
 *
 * Upgraded from the original plain-text mailer.
 * Now sends branded HTML emails and accepts a dynamic frontendUrl
 * so links work in both localhost and production.
 *
 * Deploy: upload this file to your Hostinger hosting.
 * Compatible with PHP 7+ and the built-in mail() function.
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Método no permitido']);
    exit;
}

// ─── RECEIVE PAYLOAD ─────────────────────────────────────
$raw = file_get_contents('php://input');
$data = json_decode($raw, true);

$email = $data['email'] ?? '';
$token = $data['token'] ?? '';
$type = $data['type'] ?? '';
$expiresAt = $data['expiresAt'] ?? '';
// frontendUrl comes from backend (process.env.FRONTEND_URL)
// Falls back to WEB_APP_URL env var, then to production URL
$frontendUrl = rtrim($data['frontendUrl'] ?? (getenv('WEB_APP_URL') ?: 'https://blue-pitanga.com'), '/');

if (!filter_var($email, FILTER_VALIDATE_EMAIL) || empty($token) || empty($type)) {
    http_response_code(400);
    echo json_encode(['error' => 'Parámetros inválidos']);
    exit;
}

// ─── BUILD LINK & CONTENT ────────────────────────────────
$linkPath = $type === 'reset' ? '/reset-password' : '/verify-email';
$link = $frontendUrl . $linkPath . '?' . http_build_query(['token' => $token]);

if ($type === 'reset') {
    $subject = '🔑 Recupera tu contraseña — Fortaleza Gym';
    $heading = 'Recuperación de Contraseña';
    $intro = 'Recibimos una solicitud para restablecer la contraseña de tu cuenta. Hacé click en el siguiente botón:';
    $btnText = 'Restablecer Contraseña';
    $footer = 'Si no solicitaste este cambio, podés ignorar este correo. Tu contraseña no será modificada.';
} else {
    $subject = '✅ Verificá tu cuenta — Fortaleza Gym';
    $heading = '¡Bienvenido a Fortaleza!';
    $intro = 'Tu cuenta fue creada exitosamente. Hacé click en el siguiente botón para verificar tu correo electrónico:';
    $btnText = 'Verificar mi Cuenta';
    $footer = 'Si no creaste esta cuenta, podés ignorar este correo.';
}

// Expiry text
$expiresText = '';
if ($expiresAt) {
    $ts = strtotime($expiresAt);
    if ($ts) {
        // Argentina timezone
        $expiresText = 'Este enlace expira el ' . date('d/m/Y \a \l\a\s H:i', $ts - 10800) . ' hs.';
    }
}

// ─── HTML EMAIL TEMPLATE ─────────────────────────────────
$html = <<<HTML
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0d0d0d;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0d0d0d;padding:40px 20px;">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#1a1a1a;border-radius:16px;border:1px solid rgba(255,255,255,0.06);overflow:hidden;">

  <!-- Header -->
  <tr><td style="background:linear-gradient(135deg,#dc2626,#ef4444);padding:28px 30px;text-align:center;">
    <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;letter-spacing:-0.3px;">$heading</h1>
  </td></tr>

  <!-- Body -->
  <tr><td style="padding:32px 30px;">
    <p style="color:rgba(255,255,255,0.7);font-size:15px;line-height:1.6;margin:0 0 24px;">$intro</p>

    <!-- Button -->
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center" style="padding:8px 0 24px;">
        <a href="$link" target="_blank" style="display:inline-block;background:linear-gradient(135deg,#dc2626,#ef4444);color:#fff;text-decoration:none;padding:14px 36px;border-radius:12px;font-weight:600;font-size:15px;letter-spacing:0.3px;">$btnText</a>
      </td></tr>
    </table>

    <!-- Token fallback -->
    <p style="color:rgba(255,255,255,0.4);font-size:13px;margin:0 0 8px;">Si el botón no funciona, copiá y pegá este token en la app:</p>
    <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:12px 14px;word-break:break-all;">
      <code style="color:#fecaca;font-size:13px;font-family:'Courier New',monospace;">$token</code>
    </div>

    <!-- Link fallback -->
    <p style="color:rgba(255,255,255,0.3);font-size:12px;margin:14px 0 0;">O copiá este enlace en tu navegador:</p>
    <p style="color:rgba(220,38,38,0.7);font-size:12px;word-break:break-all;margin:4px 0 0;">
      <a href="$link" style="color:rgba(220,38,38,0.8);text-decoration:underline;">$link</a>
    </p>

    <!-- Expiry -->
    <p style="color:rgba(255,255,255,0.3);font-size:12px;margin:20px 0 0;text-align:center;">$expiresText</p>
  </td></tr>

  <!-- Footer -->
  <tr><td style="padding:20px 30px 28px;border-top:1px solid rgba(255,255,255,0.05);">
    <p style="color:rgba(255,255,255,0.3);font-size:12px;margin:0;line-height:1.5;text-align:center;">$footer</p>
    <p style="color:rgba(255,255,255,0.15);font-size:11px;margin:12px 0 0;text-align:center;">© Fortaleza Gym — Gimnasio Multiespacio</p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>
HTML;

// ─── PLAIN TEXT FALLBACK (for email clients that don't support HTML) ───
$plainText = ($type === 'reset'
    ? "Hola,\n\nRecibimos una solicitud para restablecer tu contraseña.\n"
    : "Hola,\n\nPor favor validá tu correo para activar tu cuenta.\n")
    . "\nUsá el siguiente enlace antes de $expiresText:\n\n"
    . "$link\n\n"
    . "Token: $token\n\n"
    . "$footer\n\n"
    . "Fortaleza Gym — Gimnasio Multiespacio";

// ─── SEND EMAIL ──────────────────────────────────────────
// Build multipart MIME so both HTML and plain text are included
$boundary = md5(uniqid(time()));

$headers = "From: Fortaleza Gym <no-reply@gimnasio-multiespacio.com>\r\n";
$headers .= "Reply-To: soporte@gimnasio-multiespacio.com\r\n";
$headers .= "MIME-Version: 1.0\r\n";
$headers .= "Content-Type: multipart/alternative; boundary=\"$boundary\"\r\n";
$headers .= "X-Mailer: PHP/" . phpversion();

$body = "--$boundary\r\n";
$body .= "Content-Type: text/plain; charset=UTF-8\r\n\r\n";
$body .= $plainText . "\r\n\r\n";
$body .= "--$boundary\r\n";
$body .= "Content-Type: text/html; charset=UTF-8\r\n\r\n";
$body .= $html . "\r\n\r\n";
$body .= "--$boundary--";

$sent = mail($email, $subject, $body, $headers);

if (!$sent) {
    http_response_code(500);
    echo json_encode(['error' => 'No se pudo enviar el correo']);
    exit;
}

echo json_encode(['ok' => true, 'delivered' => true, 'link' => $link]);
