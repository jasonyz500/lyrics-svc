'use strict';

const Boom = require('@hapi/boom');
const _ = require('lodash');

const routesArtists = {
  name: 'routes-artists',
  version: '1.0.0',
  register: async function (server, options) {
    const client = server.plugins.jawsdb.client;

    server.route({
      method: 'GET',
      path: '/artists',
      config: {
        description: 'Get all artists.' // of course will paginate and implement prefix searching "later"
      },
      handler: async (request, h) => {
        try {
          const artists = await client.awaitQuery(`
            SELECT
              id,
              name_kana,
              name_rom
            FROM
              artists
            ORDER BY
              id asc
            LIMIT
              100
          `);
          return artists;
        } catch (e) {
          console.log(e);
          return Boom.badImplementation('Error getting artists!');
        }
      }
    });
  }
};

module.exports = routesArtists;