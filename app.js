const path = require('path');
const express = require('express');
const schedule = require('node-schedule');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
// const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const compression = require('compression');
const cors = require('cors');
const moment = require('moment');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const userRouter = require('./routes/userRoutes');

const User = require('./models/userModel');
// const Chat = require('./models/chatModel');
// const Room = require('./models/roomModel');

const {
  getFileStream,
  uploadUserImage,
  deleteOldStorage,
  deleteImage,
  uploadbase64File,
} = require('./utils/s3');

const {
  featuredListingExpire,
} = require('./utils/cronFns');

// Start express app
const app = express();
const http = require('http').Server(app);

app.enable('trust proxy');

// Serving static files
app.use(express.static(path.join(__dirname, 'public')));

// PUG CONFIG
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// EJS CONFIG
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/public', '/templates'));

// 1) GLOBAL MIDDLEWARES
app.use(cors());

app.options('*', cors());
// app.options('/api/v1/tours/:id', cors());

// Serving static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static('uploads'));

// Set security HTTP headers
app.use(helmet());

// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

app.use(compression());

// Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.cookies);
  next();
});

// 3) ROUTES
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Welcome to KokoRanch APIs',
  });
});

// AWS READ FILES

app.get(
  '/api/pdf/:key',
  // protect,
  // restrictTo( 'super-admin', 'admin'),
  async (req, res, next) => {
    const key = req.params.key;

    let _err = 1;

    // Content-type: application/pdf
    res.header('Content-type', 'application/pdf');
    const readStream = getPDFFileStream(key).on('error', (e) => {
      _err = 0;
      return res.status(404).json({
        message: 'Image not Found.',
      });
    });

    if (_err) readStream.pipe(res);
  }
);

// uploading images
app.post('/api/test/images', uploadUserImage, function (req, res) {
  const files = req.files;
  let r = null;

  let data = null;
  r = req.body.images;
  const TT = files;
  console.log({ CMS: files.cms });
  if (files.images) data = files.images.map((img) => img.key);
  if (files.photo) req.body.photo = files.photo[0].key;

  res.status(201).json({
    message: 'uploaded',
    data,
    photo: req.body.photo,
  });
});

// read images
app.get('/api/images/:key', async (req, res) => {
  try {
    const key = req.params.key;

    if (req?.query?.type == 'pdf' || key?.split('.')[1] == 'pdf')
      res.header('Content-type', 'application/pdf');
    else if (key?.split('.')[1] == 'svg')
      res.set('Content-type', 'image/svg+xml');
    else res.set('Content-type', 'image/gif');

    // const readStream = await
    await getFileStream(key)
      .on('error', (e) => {
        // return res.status(404).json({
        //   message: 'Image not Found.',
        // });
      })
      .pipe(res);
  } catch (e) {
    return res.status(404).json({
      message: 'Image not found',
    });
  }
});

app.delete('/api/images/delete/:key', (req, res) => {
  console.log(req.params);
  const key = req.params.key;
  const data = deleteImage(key);

  res.status(202).json({
    message: 'deleted',
    data,
  });
});

app.use('/api/v1/users', userRouter);

app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

// setting up
const io = require('./utils/socket').init(http);

io.on('connection', (socket) => {
  console.log(chalk.bgBlueBright.bold("New Socket Connection Established "));
  const users = [];
  for (let [id, socket] of io.of("/").sockets) {
    // console.log(">>>>",username)

    users.push({
      userID: id,
      username: socket.username,
    });
  }
  socket.emit("users", users);

  // allClients.push({
  //   id: socket.id,
  //   user_id: socket.handshake.query.user_id,
  //   post_id: socket.handshake.query.chat_id,
  //   socket,
  // })
  // console.log(socket.handshake.auth.testing)

  socket.on("join", ({ name, room }, callback) => {
    console.log(room, name);
  });

  socket.on("private message", ({ content, to }) => {
    socket.to(to).emit("private message", {
      content,
      from: socket.id,
    });
  });

  // SOCKET DISCONNECTION
  socket.on("disconnect", () => {
    console.log(chalk.bgRedBright.bold(" Socket Connection Disconnected"));
  });
});

// schedule.scheduleJob('0 * * * *', async () => {
//   // RUNNING ON EVERY HOUR
//   try {
//     await Promise.all([
//       featuredListingExpire()
//     ]);
//   } catch (error) {
//     // console.log(error);
//   }
// });

module.exports = http;
