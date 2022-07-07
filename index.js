const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const io = require('socket.io')(server, { cors: { origin: '*' } });
const { v4: uuidv4 } = require('uuid');
const dotenv = require('dotenv').config();

const db = require('./db');

app.set('view engine', 'ejs');

server.listen(3000, () => {
  console.log('listening on 3000');
});

//регулярка для проверки комнат
var regex = new RegExp('lobby-');

io.on('connection', (socket) => {
  console.log('user connected ');
  socket.on('joinQueue', async (user) => {
    console.log('user joined');

    var clients = await io.in('waitingRoom').fetchSockets();
    var players = await io.in('waitingRoom').allSockets();

    if (players.size >= 2) {
      let uniqueID = "lobby-" + uuidv4();

      clients.forEach((SOCKET) => {
        SOCKET.leave('waitingRoom');
        SOCKET.join(uniqueID);
      });

      console.log(io.in('waitingRoom').allSockets())

      //Создаем массив из SET, достаем 2х игроков
      let users = Array.from(players).splice(0, 2);
      //достаем из users 1 игрока и создаем объект этого игрока добавляя туда его команду
      let teamRed = users.splice(0, 1).map((Socket) => ({ socket: Socket, team: 'red' }));
      //достаем из users 1 игрока и создаем объект этого игрока добавляя туда его команду
      let teamBlue = users.splice(0, 1).map((Socket) => ({ socket: Socket, team: 'blue' }));
      //соединяем 2 команды в 1 чтобы скормить их монге
      let teams = teamRed.concat(teamBlue);

      if (teams) {
        await db.createLobby(uniqueID);
        await db.fillLobby(teams, uniqueID);
        console.log('Лобби с ID: ', uniqueID, 'Сформировано');
      } else {
        throw 'Команд нет';
        console.log('Команд нет');
      }

      io.to(uniqueID).emit('message', `new looby with id: ${uniqueID}`);
    } else {
      socket.join('waitingRoom');
      io.to('waitingRoom').emit('newUser', user);
    }
  });

  socket.on('disconnect', async () => {
    //получаем комнаты
    let lobbies = io.sockets.adapter.rooms;
    //проходимся по комнатам и если в комнате меньше 2х игроков удаляем комнату из бд
    for (const [key, value] of lobbies) {
      if (regex.test(key)) {
        if (value.size < 2) {
          await db.deleteLobby(key);
          console.log("Lobby:", key, "has less than 2 players, lobby deleted");
        }
      }
    }
    console.log('user diconnected');
  });
});
