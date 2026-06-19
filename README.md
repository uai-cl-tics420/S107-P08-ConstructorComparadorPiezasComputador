# PC Builder & Price Comparator

[![Docker](https://img.shields.io/badge/Docker-Enabled-blue.svg)](https://www.docker.com/)
[![Bun](https://img.shields.io/badge/Bun-Ready-black.svg)](https://bun.sh/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Supported-blue.svg)](https://www.typescriptlang.org/)

Esta aplicación busca ser una herramienta donde los usuarios puedan armar un computador, previsualizando las piezas que desean comprar, para luego entregarles una vista de comparación de precios disponibles. De esta manera, el usuario puede encontrar las mejores ofertas y precios para el computador que quiere armar.

---

### 🚀 Ejecución

#### Requerimientos

Necesita tener instalada la última versión de Docker:
- [Docker](https://www.docker.com/get-started/)

#### Pasos

1. Asegúrese de crear un archivo `.env` en el directorio raíz a partir del archivo `.env.example` proporcionado como template. 
2. **Complete los campos `POSTGRES_PASSWORD` y `MONGO_PASSWORD`** en su nuevo archivo `.env`.
3. Para montar el sistema de bases de datos, la aplicación web y el script de scraping, ejecute en su terminal:

```bash
docker-compose up -d --build
```

*(💡 Usuarios de **Windows**: Pueden ejecutar el script `build.bat` para construir y levantar los contenedores, o `run.bat` para solo levantarlos).*

4. Por último, para visualizar la app web, visite la siguiente dirección en su navegador:
👉 [http://localhost:3000](http://localhost:3000)

#### 🛑 Detener la ejecución

Para detener y apagar los contenedores, ejecute en su terminal:

```bash
docker-compose down
```

*(💡 Usuarios de **Windows**: Pueden ejecutar el script `stop.bat` para apagar los contenedores).*

---

### 🛠️ Funcionalidades adicionales

#### Requisitos para desarrollo

Además de haber montado los contenedores como se indicó en [Ejecución](#ejecución), necesita tener instaladas las últimas versiones de Bun y Python.

- [Bun](https://bun.sh/docs/installation)
- [Python](https://www.python.org/downloads/)

#### 🔑 Better Auth Secret

Según está configurado el proyecto, Better Auth arrojará un *warning* al iniciar la aplicación por el formato de la variable de entorno `BETTER_AUTH_SECRET` en su `.env`.

Para evitar esto, genere un secreto seguro ejecutando:

```bash
bunx auth secret
```

Luego, copie este secreto en la variable de entorno `BETTER_AUTH_SECRET` de su archivo `.env`.

#### 🌐 Google SSO con OAuth

1. Utilice una cuenta de Google para crear un proyecto en la [Consola de Google Cloud](https://console.cloud.google.com/) y habilite la API de OAuth.
2. Genere credenciales de cliente OAuth desde la consola.
3. Copie el `ID de cliente` y el `Secreto de cliente` en las variables de entorno de su `.env`, completando los campos faltantes de Google OAuth según el formato de `.env.example`.
4. Vuelva a montar los contenedores de Docker ejecutando:

```bash
docker-compose down -v
docker-compose up -d --build
```

*(💡 Usuarios de **Windows**: Pueden usar el script `build.bat` el cual ejecuta ambos comandos automáticamente).*

#### ✉️ Ingreso con Email OTP

1. Ingrese a [Resend](https://resend.com/) y cree una cuenta.
2. En el *dashboard*, cree una nueva API key y cópiela en la variable de entorno `RESEND_API_KEY`, reemplazando el valor `<KEY_HERE>` en su archivo `.env` según el formato descrito en `.env.example`.

#### 💻 Edición de la App Web (Desarrollo local)

1. Detenga la ejecución del contenedor de Docker **"bun"** ejecutando:

```bash
docker stop bun
```

2. Ejecute la app en modo desarrollador con:

```bash
bun run dev
```

3. Espere hasta que Bun indique que la app está lista y visite [localhost:3000](http://localhost:3000/).
