import { format } from 'date-fns';
import * as http from 'http';
import * as mysql from 'mysql';
import {
  IMessage,
  request as WebsocketRequest,
  server as WebsocketServer,
} from 'websocket';

const port = 3000;
const clients = {};

async function saveMessage(
  user: string,
  message: string,
  date: Date,
  channel: string
) {
  return new Promise((resolve, reject) => {
    dbConnection.query(
      'INSERT INTO message SET ?',
      { user, message, date: format(date, 'yyyy-MM-dd HH:mm:ss'), channel },
      function (error) {
        if (error) {
          reject(error);
        }
        resolve(true);
      }
    );
  });
}

async function getMessages(channel: string) {
  return new Promise((resolve, reject) => {
    dbConnection.query(
      'SELECT * FROM message WHERE channel = ? LIMIT 400',
      [channel],
      function (error, results, fields) {
        if (error) {
          reject(error);
        }
        resolve(results);
      }
    );
  });
}

const dbConnection = mysql.createConnection({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  charset: 'utf8mb4',
});

dbConnection.connect();

function htmlEntities(input?: string) {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const server = http.createServer();
server.listen(port, function () {});

const websocketServer = new WebsocketServer({
  httpServer: server,
});

websocketServer.on('request', async function (request: WebsocketRequest) {
  const channel = request.resourceURL.path.substring(1);
  const connection = request.accept(null, request.origin);
  if (!clients[channel]) {
    clients[channel] = [];
  }
  const index = clients[channel].push(connection) - 1;
  let userName: string;

  try {
    const messageHistory: any = await getMessages(channel);

    if (messageHistory.length > 0) {
      connection.sendUTF(
        JSON.stringify({
          type: 'history',
          data: messageHistory.map((row) => {
            return {
              author: row.user,
              text: row.message,
              color: 'black',
              time: new Date(row.date),
            };
          }),
        })
      );
    }
  } catch (e) {
    console.log(e);
  }

  // user sent a message
  connection.on('message', async function (message: IMessage) {
    if (message.type === 'utf8') {
      if (!userName) {
        userName = htmlEntities(message.utf8Data);
        connection.sendUTF(JSON.stringify({ type: 'color', data: 'black' }));
      } else {
        const obj = {
          time: new Date(),
          text: htmlEntities(message.utf8Data),
          author: userName,
        };
        try {
          await saveMessage(obj.author, obj.text, obj.time, channel);

          const json = JSON.stringify({ type: 'message', data: obj });
          for (var i = 0; i < clients[channel].length; i++) {
            clients[channel][i].sendUTF(json);
          }
        } catch (e) {
          console.log(e);
        }
      }
    }
  });

  // user disconnected
  connection.on('close', function () {
    if (userName) {
      clients[channel].splice(index, 1);
    }
  });
});
