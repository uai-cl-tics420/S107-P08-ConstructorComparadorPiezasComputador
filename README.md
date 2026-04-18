# S107-P08-ConstructorComparadorPiezasComputador

### Descripción

&emsp;Esta aplicación busca ser una herramienta donde los usuarios puedan armar un computador, previsualizando las piezas que desean comprar, para luego entregarles una vista de comparación de precios disponibles para las piezas que busca, así el usuario puede encontrar los mejores precios para el computador que quiere armar.

---

### Requerimientos

&emsp;Necesita tener instalada la última verisón de docker:

- [Docker install](https://www.docker.com/get-started/)

---

### Ejecución

&emsp;Asegurarse de crear un archivo .env en el directorio raíz a partir del archivo .env.example proporcionado como template.

&emsp;El secreto para la variable BETTER_AUTH_SECRET necesitara al menos 32 caracteres.

&emsp;Para montar el sistema de base de datos y la aplicación web ejecutar en terminal:

```bash
docker-compose up -d --build
```

&emsp;Por último, para visualizar la app web visitar la dirección:

[localhost:3000](http://localhost:3000)

---

### Funcionalidades adicionales:

#### Base de datos:

&emsp;Para insertar datos a la base de datos ejecutar en terminal:

```bash
pip install -r scraper/requirements.txt
python scraper/fetch_data.py
```

#### Google SSO con OAuth:

1. Se debe utilizar una cuenta de google para crear un proyecto de google cloud y habilitar OAuth.
2. Se debe generar credenciales de cliente OAuth desde google cloud.
3. Copiar `ID de cliente` y `Secreto de cliente` en las variables de entorno de `.env` en los campos faltantes de Google OAuth según el formato de `.env.example`
4. Volver a montar los contenedores de docker ejecutando en terminal:

```bash
docker-compose down -v
docker-compose up -d --build
```

#### Ingreso con email OTP:

1. Se debe ingresar a https://resend.com/ y crear una cuenta.
2. En el dashboard crear una nueva API key y copiarla en la variable de entorno `RESEND_API_KEY`, reemplazando el valor <KEY_HERE>, en el archivo `.env` según el formato descrito en el archivo `.env.example`.
