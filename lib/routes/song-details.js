'use strict';

const Boom = require('@hapi/boom');
const _ = require('lodash');

async function updateLyrics(client, songId, lines) {
  // could make this into one query but whatever
  _.forEach(lines, async (line, i) => {
    await client.awaitQuery(`DELETE FROM lyrics WHERE song_id = ${songId}`);
    await client.awaitQuery(
      `INSERT INTO lyrics (
        song_id, 
        paragraph_num, 
        kana, 
        rom, 
        en)
      VALUES (?, ?, ?, ?, ?)
    `, [songId, i+1, line.kana, line.rom, line.en])
  });
}

const routesSongDetails = {
  name: 'routes-song-details',
  version: '1.0.0',
  register: async function (server, options) {
    const client = server.plugins.jawsdb.client;

    server.route({
      method: 'GET',
      path: '/song_details/{id}',
      config: {
        description: 'Get song details by id.'
      },
      handler: async (request, h) => {
        const songId = request.params.id;
        try {
          const songMetadata = await client.awaitQuery(`
            SELECT
              songs.name_kana song_name_kana,
              songs.name_rom song_name_rom,
              songs.name_en song_name_en,
              songs.youtube_link youtube_link,
              songs.spotify_link spotify_link,
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
              songs.id = ?
          `, [songId]);
          const lyrics = await client.awaitQuery(`
            SELECT
              kana,
              rom,
              en
            FROM
              lyrics
            WHERE
              song_id = ?
            ORDER BY
              paragraph_num
          `, [songId]);
          const result = {
            lines: lyrics, 
            metadata: songMetadata[0]
          };
          console.log('asdfasdf', result);
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
          const { song_name_kana, song_name_rom, song_name_en, youtube_link, spotify_link, notes, artist_id} = p.metadata;
          const lines = p.lines;
          await client.awaitBeginTransaction()
          const songId = await client.awaitQuery(
            `INSERT INTO
                songs (
                  name_kana, 
                  name_rom, 
                  name_en, 
                  youtube_link, 
                  spotify_link, 
                  notes, 
                  artist_id
                )
              VALUES (?, ?, ?, ?, ?, ?, ?);
            `, [song_name_kana, song_name_rom, song_name_en, youtube_link, spotify_link, notes, artist_id]
          );
          await updateLyrics(client, songId.insertId, lines);
          await client.awaitCommit();
          return true;
        } catch (e) {
          await client.awaitRollback();
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
          const { song_name_kana, song_name_rom, song_name_en, youtube_link, spotify_link, notes, artist_id} = p.metadata;
          const lines = p.lines;
          await client.awaitBeginTransaction();
          await client.awaitQuery(`
            UPDATE 
              songs
            SET
              name_kana=?, name_rom=?, name_en=?, youtube_link=?, spotify_link=?, notes=?, artist_id=?
            WHERE
              id = ?
          `, [song_name_kana, song_name_rom, song_name_en, youtube_link, spotify_link, notes, artist_id, request.params.id]);
          await updateLyrics(client, request.params.id, lines);
          await client.awaitCommit();
          return true;
        } catch (e) {
          await client.awaitRollback();
          console.log(e);
          return Boom.badImplementation('Error editing song!');
        }
      }
    });
  }
};

module.exports = routesSongDetails;