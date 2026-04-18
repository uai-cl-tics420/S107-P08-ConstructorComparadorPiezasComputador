# S107-P08-ConstructorComparadorPiezasComputador

### Descripción

&emsp;Esta aplicación busca ser una herramienta donde los usuarios puedan armar un computador, previsualizando las piezas que desean comprar, para luego entregarles una vista de comparación de precios disponibles para las piezas que busca, así el usuario puede encontrar los mejores precios para el computador que quiere armar.

---

### Ejecución

#### Requerimientos

&emsp;Necesita tener instalada la última verisón de docker:

- [Docker](https://www.docker.com/get-started/)

#### Pasos

&emsp;Asegurarse de crear un archivo [.env](.env) en el directorio raíz a partir del archivo [.env.example](.env.example) proporcionado como template y **completar los campos `POSTGRES_PASSWORD` y `MONGO_PASSWORD`**.

&emsp;Para montar el sistema de base de datos y la aplicación web ejecutar en terminal:

```bash
docker-compose up -d --build
```

&emsp;Por último, para visualizar la app web visitar la dirección:

[localhost:3000](http://localhost:3000)

---

### Funcionalidades adicionales:

#### Requisitos:

&emsp;Necesita tener instalada la última verisón de docker, bun y python.

- [Docker](https://www.docker.com/get-started/)
- [bun](https://bun.com/docs/installation)
- [python](https://www.python.org/downloads/)

#### Base de datos:

&emsp;Para insertar datos scrapeados a la base de datos ejecutar en terminal:

```bash
bun run scrape
```

&emsp;Para insertar datos de demostración a la base de datos ejecutar en terminal:

```bash
bun run populate
```

#### Better Auth secret:

&emsp;Según está configurado el proyecto, Better Auth arrojará warning al iniciar la aplicación por formato de la variable de entorno `BETTER_AUTH_SECRET` en [.env](.env).

&emsp;Para evitar esto generar un secreto ejecutando en terminal:

```bash
bunx auth secret
```

&emsp;Luego copiar este secreto en la variable de entorno `BETTER_AUTH_SECRET` del archivo [.env](.env).

#### Google SSO con OAuth:

1. Se debe utilizar una cuenta de google para crear un proyecto en la [consola de google cloud](https://console.cloud.google.com/) y habilitar OAuth.
2. Se debe generar credenciales de cliente OAuth desde la [consola de google cloud](https://console.cloud.google.com/).
3. Copiar `ID de cliente` y `Secreto de cliente` en las variables de entorno de [.env](.env) en los campos faltantes de Google OAuth según el formato de [.env.example](.env.example)
4. Volver a montar los contenedores de docker ejecutando en terminal:

```bash
docker-compose down -v
docker-compose up -d --build
```

#### Ingreso con email OTP:

1. Se debe ingresar a [resend](https://resend.com/) y crear una cuenta.
2. En el dashboard crear una nueva API key y copiarla en la variable de entorno `RESEND_API_KEY`, reemplazando el valor <KEY_HERE>, en el archivo [.env](.env) según el formato descrito en el archivo [.env.example](.env.example).

#### Edición de la app web:

1. Parar la ejecución del contenedor de Docker **"bun"** ejecutando:

```bash
docker stop bun
```

2. Ejecutar la app en modo desarrollador ejecutando:

```bash
bun run dev
```

3. Esperar hasta que bun indiquie que la app está lista y visitar la dirección [localhost:3000](http://localhost:3000/).
