'use strict';

const Hapi = require('@hapi/hapi');

const init = async () => {

  const server = Hapi.server({
    port: 3000,
    host: 'localhost',
    routes: { cors: {"headers": ["Accept", "Authorization", "Content-Type", "If-None-Match", "Accept-language"]}}
  });

  server.route({
    method: 'GET',
    path: '/song_details/1',
    config: {
      auth: false,
      description: 'Hello Hapi'
    },
    handler: async (request, h) => {
      return {
        'lines': [{
          'kana': 'kana',
          'rom': 'rom',
          'en': 'en'
        }]
      };
    }
  });

  server.route({
    method: 'GET',
    path: '/',
    handler: async (request, h) => {
      return 'hello hapi';
    }
  });

  await server.start();
  console.log('Server running on %s', server.info.uri);
};

process.on('unhandledRejection', (err) => {

    console.log(err);
    process.exit(1);
});

init();
