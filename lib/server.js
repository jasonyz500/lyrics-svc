'use strict';

const Hapi = require('@hapi/hapi');
const Blipp = require('blipp');

const init = async () => {

  const server = Hapi.server({
    port: 3000,
    host: 'localhost',
    routes: { cors: {"headers": ["Accept", "Authorization", "Content-Type", "If-None-Match", "Accept-language"]}}
  });

  await server.route({
    method: 'GET',
    path: '/',
    handler: async (request, h) => {
      return 'Hello World';
    }
  });

  await server.register([  
    { 
      plugin: Blipp
    },
    {
      plugin: require('./db')
    },
    {
      plugin: require('./routes/song-details')
    }
  ]);

  await server.start();
  console.log('Server running on %s', server.info.uri);
};

process.on('unhandledRejection', (err) => {

    console.log(err);
    process.exit(1);
});

init();
