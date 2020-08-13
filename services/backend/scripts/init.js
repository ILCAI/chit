const mysql = require('mysql');
const { DB_HOST, DB_USER, DB_PASS, DB_NAME } = process.env;

const connection = mysql.createConnection({
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASS,
  database: DB_NAME,
});

connection.connect(function (error) {
  if (error) {
    return console.error('error: ' + error.message);
  }

  const sql = `CREATE TABLE IF NOT EXISTS message (
    id int primary key auto_increment,
    user varchar(255) not null,
    message mediumtext not null,
    date datetime DEFAULT NULL,
    channel varchar(255) not null
)`;

  connection.query(sql, function (error) {
    if (error) {
      console.error('error: ' + error.message);
    }
  });

  connection.end(function (error) {
    if (error) {
      return console.error('error: ' + error.message);
    }
  });
});
