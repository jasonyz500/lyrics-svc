'use strict';

const Boom = require('@hapi/boom');
const _ = require('lodash');

const routesSongs = {
  name: 'routes-songs',
  version: '1.0.0',
  register: async function (server, options) {
    const client = server.plugins.jawsdb.client;

    server.route({
      method: 'GET',
      path: '/songs',
      config: {
        description: 'Get all songs.'
      },
      handler: async (request, h) => {
        try {
          const songs = await client.awaitQuery(`
            SELECT
              songs.id song_id,
              songs.name_kana song_name_kana,
              songs.name_rom song_name_rom,
              songs.name_en song_name_en,
              artists.id artist_id,
              artists.name_kana artist_name_kana,
              artists.name_rom artist_name_rom
            FROM
              songs
            INNER JOIN
              artists
            ON
              songs.artist_id = artists.id
            ORDER BY
              songs.id desc
            LIMIT
              100
          `);
          return songs;
        } catch (e) {
          console.log(e);
          return Boom.badImplementation('Error getting songs!');
        }
      }
    });
  }
};

module.exports = routesSongs;