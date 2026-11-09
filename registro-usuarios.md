# Registro de usuarios

Cualquier persona puede crear su propia cuenta desde la aplicación: en el login, el enlace
**"Crear cuenta"** abre `/register`. La cuenta nueva **no puede iniciar sesión hasta verificar
su correo**: el registro envía un enlace, y al abrirlo la cuenta queda verificada y entra al
Dashboard.

## Verificación del correo

1. `/register` pide usuario, **correo** y contraseña. El backend crea la cuenta sin verificar y
   envía un correo con el enlace `https://www.segsoft.website/verify-email?token=...`. La pantalla
   muestra "Revisa tu correo" y un botón para reenviarlo.
2. El enlace abre `/verify-email`, que envía el token al backend con un `POST` (no con `GET`:
   los antivirus y las vistas previas del correo abren los enlaces y gastarían el token). Si es
   válido, el correo queda verificado y se inicia la sesión.
3. Mientras no se verifique, el login con la contraseña correcta responde
   `403 EMAIL_NOT_VERIFIED` y la pantalla ofrece reenviar el enlace. Con una contraseña
   incorrecta responde el `401` de siempre, así que no revela qué cuentas están sin verificar.

| Regla | Detalle |
|---|---|
| Vigencia del enlace | 24 horas; se usa una sola vez. Pedir uno nuevo invalida los anteriores |
| Reenvío | Como mínimo un minuto entre enlaces por cuenta, y cuenta para el límite por IP. Responde lo mismo exista o no la cuenta |
| Token | 32 bytes aleatorios (`SecureRandom`). En la base solo se guarda su SHA-256 (`email_verification_tokens`) |
| Cuentas sin verificar | Se borran a los 7 días (tarea diaria a las 03:30), y así liberan el usuario y el correo |
| Cuentas sin correo | Las de `SEGSOFT_ACCOUNTS` y las registradas antes de este cambio no tienen correo y entran como siempre |
| Enlace | Se arma con `APP_PUBLIC_URL`, nunca con la cabecera `Host` de la petición |
| Sin SMTP configurado | El registro y el reenvío responden `503 EMAIL_DELIVERY_UNAVAILABLE` sin crear nada. En desarrollo (`application-dev.yml`) el enlace se escribe en el log |

El correo sale por SMTP con **Brevo** (plan gratuito: 300 correos al día). La configuración está
en `segsoft-backend/deploy/README.md`, sección "Correo de verificación (Brevo)".

## Qué rol recibe

**Siempre DEVELOPER**, el rol de menor privilegio: subir proyectos, seleccionar políticas,
analizar y revisar los hallazgos de sus propios análisis. Desde la API pública nadie puede
crearse una cuenta AUDITOR o SECURITY_ADMIN: esas son las del despliegue
(`SEGSOFT_ACCOUNTS` en `segsoft-backend/deploy/.env`, ver `segsoft-backend/deploy/README.md`).
Para dar un rol privilegiado a alguien hay que agregar su cuenta ahí y reiniciar el backend.

## Bloqueo por intentos fallidos

| Situación | Respuesta del login |
|---|---|
| Contraseña incorrecta | `401` "Credenciales inválidas. Te quedan N intentos antes de que la cuenta se bloquee durante 30 minutos." y `attemptsLeft` |
| Usuario inexistente o cuenta deshabilitada | `401` "Credenciales inválidas. Después de 5 intentos fallidos, la cuenta se bloquea durante 30 minutos." (sin `attemptsLeft`) |
| Quinto intento fallido en 10 minutos | `423 ACCOUNT_LOCKED`: la cuenta queda bloqueada 30 minutos y, si tiene un **correo verificado**, recibe un enlace para desbloquearla |
| Cualquier intento mientras está bloqueada | `423 ACCOUNT_LOCKED` con `minutesLeft`, aunque la contraseña sea correcta |
| Renovar una sesión iniciada antes del bloqueo, o abrir un enlace de verificación sin usar | También `423 ACCOUNT_LOCKED`: el bloqueo cierra todas las entradas. La cookie de sesión no se revoca y el enlace de verificación no se gasta, así que vuelven a servir cuando termina el bloqueo |
| Abrir el enlace de desbloqueo o de verificación | La página no hace nada hasta que se pulsa **Desbloquear mi cuenta** o **Verificar mi correo**: algunos revisores de correo abren los enlaces y ejecutan la página, y en producción uno desbloqueó una cuenta segundos después del correo. Cada enlace sirve una sola vez aunque se abra varias veces a la vez (la fila del token se bloquea con `SELECT ... FOR UPDATE`) |
| Cualquier petición con un token de acceso emitido antes del bloqueo | `423 ACCOUNT_LOCKED` desde la siguiente petición, sin esperar a que venza el token (15 minutos). Si la cuenta se deshabilita o se elimina, `401 SESSION_REVOKED`. El frontend cierra la sesión y el login muestra el motivo. Login, desbloqueo y demás rutas públicas de `/api/v1/auth` siguen funcionando aunque el navegador envíe ese token |

- El enlace (`https://www.segsoft.website/unlock-account?token=...`) se usa una sola vez y vence
  cuando termina el bloqueo. `/unlock-account` lo envía con `POST /api/v1/auth/unlock`, que
  levanta el bloqueo y reinicia el contador **sin iniciar sesión**: después hay que entrar con la
  contraseña. Solo se guarda el SHA-256 del token (`account_unlock_tokens`, migración V35).
- Se envía un solo correo por bloqueo. Las cuentas sin correo (`SEGSOFT_ACCOUNTS`) esperan los 30
  minutos o se desbloquean en el servidor (ver `segsoft-backend/deploy/README.md`).
- Auditoría: `LOGIN_FAILURE` por cada intento rechazado (con `reason`), `ACCOUNT_LOCKED` al
  bloquear y `ACCOUNT_UNLOCKED` al usar el enlace.
- El número de intentos restantes revela que el usuario existe. El registro ya lo revela con su
  `409`, así que no agrega una filtración nueva.

## Recuperación de contraseña

1. En el login, **¿Olvidaste tu contraseña?** lleva a `/forgot-password`, donde se escribe el correo.
2. `POST /api/v1/auth/forgot-password` responde siempre `202` con el mismo mensaje, exista o no la
   cuenta, para no revelar qué correos están registrados. Solo las cuentas **habilitadas y con el
   correo verificado** reciben el enlace; las de `SEGSOFT_ACCOUNTS`, que no tienen correo, no.
3. El enlace (`/reset-password?token=...`) vence a los **30 minutos** (`auth.password-reset.token-ttl`),
   sirve una sola vez aunque se abra varias veces a la vez, y pedir otro invalida los anteriores. Entre
   dos pedidos de la misma cuenta debe pasar un minuto. Solo se guarda el SHA-256 del token
   (`password_reset_tokens`, migración V36).
4. La página pide la contraseña nueva dos veces, con los mismos requisitos del registro. El token se
   envía solo junto con la contraseña, así que un revisor de correo que abra el enlace no lo gasta.
5. `POST /api/v1/auth/reset-password` cambia la contraseña y:
   - **cierra todas las sesiones abiertas**: cada token lleva el `token_version` de la cuenta, que el
     cambio incrementa. Los tokens anteriores reciben `401 SESSION_REVOKED` desde la siguiente
     petición, y su renovación también se rechaza;
   - levanta un bloqueo por intentos fallidos, porque el enlace demuestra que el correo es del dueño;
   - envía un correo avisando del cambio, con un enlace para recuperar la cuenta si no fue el dueño;
   - **no inicia sesión**: después se entra con la contraseña nueva.

| Respuesta de `reset-password` | Cuándo |
|---|---|
| `200` | La contraseña cambió |
| `400 VALIDATION_ERROR` con `errors.password` | No cumple los requisitos o es demasiado común; el enlace sigue sirviendo |
| `400 VALIDATION_ERROR` "La contraseña nueva debe ser distinta de la actual." | Es igual a la actual; el enlace sigue sirviendo |
| `400 INVALID_RESET_TOKEN` | El enlace no existe, ya se usó o venció |

Auditoría: `PASSWORD_RESET_REQUESTED` al enviar el enlace y `PASSWORD_RESET` al cambiarla. El pedido
cuenta contra el mismo límite por IP del registro, y responde `503` si el envío de correos no está
configurado.

## Reglas

| Campo | Regla |
|---|---|
| Usuario | 3 a 50 caracteres; empieza por una letra; solo letras, números, `.`, `_` y `-`. Se guarda en minúsculas y es único sin distinguir mayúsculas (`Admin` no puede suplantar a `admin`) |
| Correo | Obligatorio, hasta 254 caracteres, con `@` y un punto en el dominio. Se guarda en minúsculas y es **único sin distinguir mayúsculas**: lo revisa el servicio y, para dos registros simultáneos, el índice único `ux_users_email_lower` de la migración V34 |
| Nombres reservados | `admin`, `administrador`, `administrator`, `root`, `system`, `sistema`, `soporte`, `support`, `seguridad`, `security`, `segsoft`, `auditor`, `dev`, `usuario` |
| Contraseña | La política existente (`PasswordPolicyValidator`): 12 caracteres o más, una mayúscula, una minúscula, un número, un carácter especial y que no esté en la lista de contraseñas comunes |

El formulario muestra los requisitos de la contraseña y los marca a medida que se cumplen.
Las contraseñas se guardan con Argon2, igual que las demás.

## API

| Método y ruta | Respuesta |
|---|---|
| `POST /api/v1/auth/register` `{username, email, password}` | `201` con `{username, email, message}`. **No inicia sesión**: envía el enlace de verificación |
| | `400 VALIDATION_ERROR` con `errors.username`, `errors.email` o `errors.password` si no cumple las reglas; también para un nombre reservado |
| | `409 CONFLICT` "Ese nombre de usuario ya está en uso" o "Ese correo ya está registrado en otra cuenta" |
| | `503 EMAIL_DELIVERY_UNAVAILABLE` si el envío de correos no está configurado |
| | `403 REGISTRATION_DISABLED` si el registro está apagado |
| | `429 TOO_MANY_REQUESTS` si se supera un límite |
| `GET /api/v1/auth/registration` | `{"enabled": true\|false}`; el formulario lo usa para mostrar un aviso si el registro está apagado |

| `POST /api/v1/auth/verify-email` `{token}` | `200` con `accessToken` y la cookie `refresh_token` (inicia sesión) |
| | `400 INVALID_VERIFICATION_TOKEN` si el token no existe, venció o ya se usó ("Tu correo ya está verificado. Inicia sesión." si ya se usó con éxito) |
| `POST /api/v1/auth/resend-verification` `{email}` | `202` exista o no la cuenta; `429` o `503` como el registro |
| `POST /api/v1/auth/login` | Además de lo de siempre: `403 EMAIL_NOT_VERIFIED` con `email` si la contraseña es correcta y el correo no está verificado |
| `GET /api/v1/auth/me` | Incluye `email` (`null` en las cuentas sin correo) |

Las rutas de registro y verificación son públicas. La auditoría registra `USER_REGISTERED`,
`EMAIL_VERIFIED`, `VERIFICATION_EMAIL_RESENT` y los logins rechazados con
`reason: email_not_verified`.

## Protección contra abuso

| Variable | Por defecto | Qué hace |
|---|---|---|
| `SEGSOFT_REGISTRATION_ENABLED` | `true` | `false` apaga el registro: el endpoint responde 403 y el formulario muestra un aviso |
| `REGISTRATION_MAX_PER_IP_PER_HOUR` | `20` | Intentos de registro por IP y hora (cuenta también los rechazados, porque cada intento calcula un hash costoso y revela si un nombre existe) |
| `REGISTRATION_MAX_PER_HOUR` | `100` | Cuentas nuevas por hora en total |

La IP sale de `X-Forwarded-For`, que un cliente puede falsificar; por eso el límite global es
el que realmente acota cuántas cuentas se crean. Los contadores viven en memoria y se
reinician con el backend.

En el despliegue las variables se pasan desde `deploy/.env` (`docker-compose.yml` ya las
declara con esos valores por defecto). Para apagar el registro:

```bash
echo "SEGSOFT_REGISTRATION_ENABLED=false" >> /opt/segsoft/segsoft-backend/deploy/.env
cd /opt/segsoft/segsoft-backend/deploy && docker compose up -d backend
```

## Cambios relacionados

- **El login rechaza las cuentas deshabilitadas** (`users.enabled = false`). Antes solo lo
  hacía la renovación de la sesión, así que una cuenta deshabilitada todavía podía iniciar
  sesión. Esto también afecta a las cuentas de demostración que `ProdAccountsInitializer`
  deshabilita en producción.
- `RoleRepository.findByName` recibe el enum `RoleType`; con `String` fallaba, porque la
  columna es un enum (por eso `RepositoryControllerIntegrationTest` no llegaba a ejecutarse).

## Pruebas

| Prueba | Qué verifica |
|---|---|
| `RegistrationServiceTest` | Rol DEVELOPER, minúsculas, hash, auditoría, envío del enlace, nombre y correo ocupados sin importar mayúsculas, duplicados concurrentes de nombre y de correo, reservados, registro apagado, sin SMTP, límite antes de calcular el hash |
| `EmailVerificationServiceTest` | Solo se guarda el hash del token, vigencia, verificación e inicio de sesión, token desconocido, vencido, usado o de cuenta deshabilitada, reenvío, espera entre reenvíos y respuesta igual para correos desconocidos |
| `VerificationMailerTest` | El enlace usa `APP_PUBLIC_URL`, destinatario y contenido del correo, sin SMTP no se envía y una falla de SMTP no se propaga |
| `RegistrationRateLimiterTest` | Límite por IP y global |
| `AuthServiceTest` | Intentos restantes, aviso para usuarios inexistentes, bloqueo al quinto intento con y sin correo, mensaje mientras dura el bloqueo |
| `AccountAccessServiceTest` | Cada petición con token revisa la cuenta: bloqueada (423 con minutos y aviso del correo), bloqueo vencido, deshabilitada o eliminada |
| `PasswordResetServiceTest` | El enlace solo va a cuentas habilitadas con el correo verificado, se guarda su hash y respeta la espera; cambiar la contraseña sube `token_version`, levanta el bloqueo y avisa por correo; la actual se rechaza sin gastar el enlace; enlaces desconocidos, usados, vencidos o de cuentas deshabilitadas |
| `PasswordResetIntegrationTest` (PostgreSQL) | Flujo completo: reglas de la contraseña, sesiones anteriores cerradas (acceso y renovación), contraseña vieja rechazada, enlace de un solo uso, misma respuesta sin cuenta, enlace nuevo que invalida el anterior, espera, enlace vencido, bloqueo levantado y 8 envíos simultáneos con un solo cambio |
| `ClientIpResolverTest` | La IP enviada por el middleware de Vercel solo se acepta con el secreto compartido; sin él, o si no es una IP, se usa la que vio Caddy |
| `AccountUnlockServiceTest` | El enlace vence con el bloqueo y solo se guarda su hash; sin correo verificado o sin SMTP no se envía; desbloqueo y enlaces inválidos |
| `LoginLockoutIntegrationTest` (PostgreSQL) | Intentos y auditoría guardados, `attemptsLeft`, bloqueo 423 con correo, enlace que desbloquea una sola vez, cuenta sin correo, enlace vencido, reinicio del contador, enlace de verificación usado o sin usar y renovación de sesión durante el bloqueo, token de acceso rechazado al bloquear o deshabilitar la cuenta, enlaces de desbloqueo y de verificación abiertos 8 veces a la vez (solo uno funciona) |
| `RegistrationIntegrationTest` (PostgreSQL) | Flujo HTTP completo: 201 sin sesión, correo sin verificar en la base, solo el hash del token, login 403 hasta verificar (401 con contraseña incorrecta), verificación con sesión, `/me` con correo, 403 en reportes, renovación de sesión, enlace de un solo uso, 409 de usuario y de correo, índice único de la base, 400 de correo, contraseña y usuario, reservados, reenvío con espera e invalidación del enlace anterior, enlace vencido, cuentas sin correo, limpieza de cuentas sin verificar y login rechazado de una cuenta deshabilitada |
| `RegistrationDisabledIntegrationTest` | Con el registro apagado: 403 y `enabled: false` |
| `RegisterForm.test.tsx` | Formulario: requisitos en vivo, validaciones (incluido el correo), minúsculas, pantalla "Revisa tu correo" sin iniciar sesión, errores 409 de usuario y de correo, 400, 429 y registro apagado |
| `LoginForm.test.tsx` | Con `EMAIL_NOT_VERIFIED` muestra el correo y permite reenviar el enlace; con otros errores no |
| `UnlockAccount.test.tsx` | No envía nada hasta pulsar el botón; envía el token una vez y confirma el desbloqueo; enlace inválido; enlace sin token |
| `VerifyEmail.test.tsx` | No envía nada hasta pulsar el botón; verifica el token una sola vez, inicia sesión y va al Dashboard; enlace inválido con reenvío; enlace sin token |
| `ForgotPassword.test.tsx` | Envía el correo normalizado y muestra la misma respuesta; no llama a la API con un correo inválido; muestra los errores del servidor |
| `ResetPassword.test.tsx` | Envía el token con la contraseña nueva; requisitos en vivo; contraseña débil o distinta en la confirmación; error de contraseña sin perder el enlace; enlace usado o vencido con opción de pedir otro; enlace sin token |
| `middleware.test.ts` | El middleware de Vercel envía la IP real y el secreto al backend, reemplaza lo que mande el navegador en esos encabezados y, sin `PROXY_SECRET`, deja la petición a `vercel.json` |

Las suites de registro corren en el `Jenkinsfile` y en el workflow de GitHub del backend.

## Pendiente

No hay gestión de usuarios en la interfaz (cambiar roles, deshabilitar o borrar cuentas,
recuperar contraseñas, cambiar el correo). Hoy se hace en el servidor: roles privilegiados con `SEGSOFT_ACCOUNTS`
y lo demás con SQL sobre la tabla `users`.
