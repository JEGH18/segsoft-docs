# Registro de usuarios

Cualquier persona puede crear su propia cuenta desde la aplicación: en el login, el enlace
**"Crear cuenta"** abre `/register`. La cuenta nueva entra directo al Dashboard.

## Qué rol recibe

**Siempre DEVELOPER**, el rol de menor privilegio: subir proyectos, seleccionar políticas,
analizar y revisar los hallazgos de sus propios análisis. Desde la API pública nadie puede
crearse una cuenta AUDITOR o SECURITY_ADMIN: esas son las del despliegue
(`SEGSOFT_ACCOUNTS` en `segsoft-backend/deploy/.env`, ver `segsoft-backend/deploy/README.md`).
Para dar un rol privilegiado a alguien hay que agregar su cuenta ahí y reiniciar el backend.

## Reglas

| Campo | Regla |
|---|---|
| Usuario | 3 a 50 caracteres; empieza por una letra; solo letras, números, `.`, `_` y `-`. Se guarda en minúsculas y es único sin distinguir mayúsculas (`Admin` no puede suplantar a `admin`) |
| Nombres reservados | `admin`, `administrador`, `administrator`, `root`, `system`, `sistema`, `soporte`, `support`, `seguridad`, `security`, `segsoft`, `auditor`, `dev`, `usuario` |
| Contraseña | La política existente (`PasswordPolicyValidator`): 12 caracteres o más, una mayúscula, una minúscula, un número, un carácter especial y que no esté en la lista de contraseñas comunes |

El formulario muestra los requisitos de la contraseña y los marca a medida que se cumplen.
Las contraseñas se guardan con Argon2, igual que las demás.

## API

| Método y ruta | Respuesta |
|---|---|
| `POST /api/v1/auth/register` `{username, password}` | `201` con `accessToken` y `roles: ["DEVELOPER"]`, y la cookie `refresh_token` (inicia sesión, igual que el login) |
| | `400 VALIDATION_ERROR` con `errors.username` o `errors.password` si no cumple las reglas; también para un nombre reservado |
| | `409 CONFLICT` "Ese nombre de usuario ya está en uso" |
| | `403 REGISTRATION_DISABLED` si el registro está apagado |
| | `429 TOO_MANY_REQUESTS` si se supera un límite |
| `GET /api/v1/auth/registration` | `{"enabled": true\|false}`; el formulario lo usa para mostrar un aviso si el registro está apagado |

Ambas rutas son públicas. Cada registro queda en la auditoría como `USER_REGISTERED`.

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
| `RegistrationServiceTest` | Rol DEVELOPER, minúsculas, hash, auditoría, nombre ocupado sin importar mayúsculas, duplicado concurrente, reservados, registro apagado, límite antes de calcular el hash |
| `RegistrationRateLimiterTest` | Límite por IP y global |
| `RegistrationIntegrationTest` (PostgreSQL) | Flujo HTTP completo: 201 con cookie, rol único DEVELOPER en la base, `/me`, 403 en reportes, renovación de sesión, login posterior, 409, 400 de contraseña y usuario, reservados, estado público y login rechazado de una cuenta deshabilitada |
| `RegistrationDisabledIntegrationTest` | Con el registro apagado: 403 y `enabled: false` |
| `RegisterForm.test.tsx` | Formulario: requisitos en vivo, validaciones, minúsculas, inicio de sesión y navegación, errores 409/400/429 y registro apagado |

Las suites de registro corren en el `Jenkinsfile` y en el workflow de GitHub del backend.

## Pendiente

No hay gestión de usuarios en la interfaz (cambiar roles, deshabilitar o borrar cuentas,
recuperar contraseñas). Hoy se hace en el servidor: roles privilegiados con `SEGSOFT_ACCOUNTS`
y lo demás con SQL sobre la tabla `users`.
