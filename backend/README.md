# Backend API - Gimnasio Multiespacio

## Estructura del proyecto

```
backend/
├── src/
│   ├── config/          # Configuraciones (database, etc.)
│   ├── controllers/     # Lógica de controladores
│   ├── models/          # Modelos de MongoDB/Mongoose
│   ├── routes/          # Rutas de la API
│   ├── middleware/      # Middlewares personalizados
│   ├── utils/           # Utilidades y helpers
│   └── server.js        # Archivo principal del servidor
├── package.json
├── .env                 # Variables de entorno
├── .gitignore
└── README.md
```

## Instalación

```bash
cd backend
npm install
```

## Variables de entorno

Crea un archivo `.env` con las siguientes variables:

```
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/gimnasio_multiespacio
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:5173
```

## Ejecutar en desarrollo

```bash
npm run dev
```

## API Endpoints (a desarrollar)

- `GET /` - Estado de la API
- `POST /api/auth/register` - Registro de usuarios
- `POST /api/auth/login` - Login de usuarios
- `GET /api/users` - Lista de usuarios
- `GET /api/classes` - Lista de clases
- `POST /api/memberships` - Crear membresía

## Tecnologías

- **Express.js** - Framework web
- **MongoDB** - Base de datos
- **Mongoose** - ODM para MongoDB
- **JWT** - Autenticación
- **bcryptjs** - Encriptación de passwords
- **CORS** - Cross-Origin Resource Sharing
