# S101-P08-ConstructorComparadorPiezasComputador

### Descripción

&emsp;Esta aplicación busca ser una herramienta donde los usuarios puedan armar un computador, previsualizando las piezas que desean comprar, para luego entregarles una vista de comparación de precios disponibles para las piezas que busca, así el usuario puede encontrar los mejores precios para el computador que quiere armar.

---

### Ejecución

&emsp;Primero, asegurarse de crear un archivo .env en el directorio raíz a partir del archivo .env.example proporcionado como template, el secreto para la variable BETTER_AUTH_SECRET puede ser generado en terminal utilizando:

```bash
npx auth secret
```

De esta manera BetterAuth no arrojará un aviso al iniciar la app debido a las características de BETTER_AUTH_SECRET.

&emsp;Para montar el sistema de base de datos y la aplicación web ejecutar en terminal:

```bash
docker-compose up -d --build
```

&emsp;Por último, para visualizar la app web visitar la dirección:

http://localhost:3000

---

### Funcionalidades adicionales:

#### Base de datos:

&emsp;Para insertar datos demostrativos a la base de datos ejecutar en terminal:

```bash
bun run populate
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
