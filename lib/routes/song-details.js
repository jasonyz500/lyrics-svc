'use strict';

const Boom = require('@hapi/boom');
const _ = require('lodash');

async function updateLyrics(client, songId, lines) {
  // could make this into one query but whatever
  _.forEach(lines, async (line, i) => {
    await client.query(`DELETE FROM lyrics WHERE song_id = $1`, [songId]);
    await client.query(`
      INSERT INTO
        lyrics(song_id, paragraph_num, kana, rom, en)
      VALUES
        ($1,$2,$3,$4,$5)
    `, [songId, i+1, line.kana, line.rom, line.en]);
  });
}

const routesSongDetails = {
  name: 'routes-song-details',
  version: '1.0.0',
  register: async function (server, options) {
    const client = server.plugins.pg.client;

    server.route({
      method: 'GET',
      path: '/song_details/{id}',
      config: {
        description: 'Get song details by id.'
      },
      handler: async (request, h) => {
        const songId = request.params.id;
        try {
          const songMetadata = await client.query(`
            SELECT
              songs.name_kana song_name_kana,
              songs.name_rom song_name_rom,
              songs.name_en song_name_en,
              songs.link link,
              songs.notes notes,
              artists.id artist_id,
              artists.name_kana artist_name_kana,
              artists.name_rom artist_name_rom
            FROM
              songs
            INNER JOIN
              artists
            ON
              songs.artist_id = artists.id
            WHERE
              songs.id = $1
          `, [songId]);
          const lyrics = await client.query(`
            SELECT
              kana,
              rom,
              en
            FROM
              lyrics
            WHERE
              song_id = $1
            ORDER BY
              paragraph_num
          `, [songId]);
          const result = {
            lines: lyrics.rows, 
            metadata: songMetadata.rows[0]
          };
          return result;
        } catch (e) {
          console.log(e);
          return Boom.badImplementation('Error getting song details!');
        }
      }
    });

    server.route({
      method: 'POST',
      path: '/song_details/new',
      config: {
        description: 'Add new song.'
      },
      handler: async (request, h) => {
        try {
          const p = request.payload;
          if (p.secret != process.env.TOP_SECRET_LMAO) {
            return Boom.unauthorized('Wrong secret!');
          }
          const metadata = p.metadata;
          const lines = p.lines;
          await client.query('BEGIN');
          const songId = await client.query(`
            INSERT INTO
              songs(name_kana, name_rom, name_en, link, notes, artist_id)
            VALUES
              ($1,$2,$3,$4,$5,$6)
            RETURNING id
          `, [metadata.song_name_kana, metadata.song_name_rom, metadata.song_name_en, metadata.link, metadata.notes, metadata.artist_id]);
          await updateLyrics(client, songId, lines);
          await client.query('COMMIT');
          return true;
        } catch (e) {
          await client.query('ROLLBACK');
          console.log(e);
          return Boom.badImplementation('Error adding new song!');
        }
      }
    });

    server.route({
      method: 'PUT',
      path: '/song_details/{id}',
      config: {
        description: 'Edit song.'
      },
      handler: async (request, h) => {
        try {
          const p = request.payload;
          if (p.secret != process.env.TOP_SECRET_LMAO) {
            return Boom.unauthorized('Wrong secret!');
          }
          const metadata = p.metadata;
          const lines = p.lines;
          await client.query('BEGIN');
          await client.query(`
            UPDATE 
              songs
            SET
              name_kana=$1, name_rom=$2, name_en=$3, link=$4, notes=$5, artist_id=$6
            WHERE
              id = $7
          `, [metadata.song_name_kana, metadata.song_name_rom, metadata.song_name_en, metadata.link, metadata.notes, metadata.artist_id, request.params.id]);
          await updateLyrics(client, request.params.id, lines);
          await client.query('COMMIT');
          return true;
        } catch (e) {
          await client.query('ROLLBACK');
          console.log(e);
          return Boom.badImplementation('Error editing song!');
        }
      }
    });
  }
};

module.exports = routesSongDetails;