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

&emsp;Para insertar datos de demostración al sistema de base de datos ejecutar en terminal:

```bash
bun run populate
```

&emsp;Para visualizar la app web visitar la dirección:

http://localhost:3000
