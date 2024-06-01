'use strict';

const Hapi = require('@hapi/hapi');
const Blipp = require('blipp');
require('dotenv').config();

const init = async () => {

  const server = Hapi.server({
    port: +process.env.PORT || 5123,
    host: '0.0.0.0',
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
    },
    {
      plugin: require('./routes/songs')
    },
    {
      plugin: require('./routes/artists')
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
