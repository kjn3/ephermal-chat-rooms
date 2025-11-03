const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
require('dotenv').config();

const roomRoutes = require('./routes/rooms');
const authRoutes = require('./routes/auth');
const { initializeSocketHandlers } = require('./socket/socketHandlers');

const getCorsOrigin = () => {
  const corsOrigin = process.env.CORS_ORIGIN || "http://localhost:3000";
  
  if (corsOrigin.includes(',')) {
    return corsOrigin.split(',').map(origin => origin.trim());
  }
  return corsOrigin;
};

const corsOrigin = getCorsOrigin();

const app = express();

app.set('trust proxy', 2);

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: corsOrigin,
    methods: ["GET", "POST"],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  maxHttpBufferSize: 1e6, // 1MB
  transports: ['websocket', 'polling']
});

const PORT = process.env.PORT || 3001;

app.use(helmet({
  contentSecurityPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'", "ws:", "wss:", "http:", "https:"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'", "https:", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false
}));
app.use(compression());
app.use(cors({
  origin: corsOrigin,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  validate: {
    trustProxy: false
  },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/', limiter);

app.use('/api/rooms', roomRoutes);
app.use('/api/auth', authRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

async function startServer() {
  try {
    initializeSocketHandlers(io);
    
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

startServer();
