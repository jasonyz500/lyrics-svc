'use strict';

const db = {
  name: 'jawsdb',
  version: '1.0.0',
  register: async function (server, options) { 
    const mysql = require('mysql-await');
    var connection = mysql.createConnection(process.env.JAWSDB_URL);
    await connection.awaitConnect();
    server.expose('client', connection);
  }
};

module.exports = db;