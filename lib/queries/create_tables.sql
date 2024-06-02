create table songs (
	id int not null auto_increment primary key,
	artist_id int not null,
	name_kana varchar(100) not null,
	name_rom varchar(100) not null,
	name_en varchar(100) not null,
	youtube_link varchar(50),
	spotify_link varchar(100),
	notes tinytext
);

create table artists (
	id int not null auto_increment primary key,
	name_kana varchar(50) not null,
	name_rom varchar(50) not null
);

create table lyrics (
	song_id int not null,
	paragraph_num tinyint not null,
	kana mediumtext not null,
	rom mediumtext not null,
	en mediumtext not null
);

create index lyric_song_id_index on lyrics (song_id);