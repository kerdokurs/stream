import fs from 'fs';
import express from 'express';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const PORT = 9000;

const app = express();

app.use(express.static(path.join(__dirname, '..', 'build')));

app.get('/view', (req, res) => {
  const range = req.headers.range;
  if (!range) return res.status(400).send('Range header is required!');

  const videoPath = path.join(__dirname, '..', 'videos', 'video1.mkv');
  const videoSize = fs.statSync(videoPath).size;

  const CHUNK_SIZE = 10 ** 6;
  const start = Number(range?.replace(/\D/g, ''));
  const end = Math.min(start + CHUNK_SIZE, videoSize - 1);

  const contentLength = end - start + 1;

  const headers = {
    'Content-Range': `bytes ${start}-${end}/${videoSize}`,
    'Accept-Ranges': 'bytes',
    'Content-Length': contentLength,
    'Content-Type': 'video/mp4',
  };

  res.writeHead(206, headers);

  const videoStream = fs.createReadStream(videoPath, { start, end });

  return videoStream.pipe(res);
});

const http = require('http').Server(app);
const io = require('socket.io')(http, {
  cors: {
    origin: '*',
  },
});

io.on('connection', (socket: any) => {
  console.log('Connection');

  socket.emit('message', {
    author: 'Server',
    message: 'Hi',
  });

  socket.emit('welcome', uuidv4());

  socket.on('disconnect', (param: any) => {
    console.log('Disconnect:', param);
  });

  socket.on('sync-time', (data: any) => {
    io.emit('sync-time', data);
  });

  socket.on('play-pause', (data: any) => {
    io.emit('play-pause', data);
  });

  socket.on('seek', (data: number) => {
    io.emit('seek', data);
  });
});

http.listen(PORT, () => console.log('Running on port %s', PORT));
