const Discord = require('discord.js');
const config = require('../config.js');
const ytdl = require('ytdl-core');
const {google} = require('googleapis');
const youtube = google.youtube('v3');
const updateMusicPlayback = require('./updateMusicPlayback.js');
const moment = require('moment');

module.exports.play = play;
module.exports.skip = skip;
module.exports.remove = remove;
module.exports.queue = queue;
module.exports.np = np;
module.exports.help = help;
module.exports.disconnect = disconnect;
module.exports.loop = loop;

function createServerMusicObject(globals, id) {
	if (!(id in globals.serverMusic)) {
		globals.serverMusic[id] = {
			dispatcher: null,
			voiceConnection: null,
			queue: [],
			queue_pos: 0,
			skip_votes: [],
			loop: false,
		};
	}
}

function secondsToString(time) {
	let minutes = Math.floor(time/60);
	let secs = time % 60;
	return `${minutes}:${secs.toString().length == 1 ? "0" : ""}${secs}`;
}

class MusicQueueEntry {
	constructor(url, name, duration, msg){
		this.url = url;
		this.name = name;
		this.duration = {
			total_seconds: duration,
			string: secondsToString(duration)
		};
		this.user = msg.author;
		this.textChannel = msg.channel;
		this.voiceChannel = msg.member.voice.channel;
	}
}

function addToQueue(url, msg, globals) {
	createServerMusicObject(globals, msg.guild.id);
	ytdl.getInfo(url, {filter:"audioonly"}, (err, info)=>{
		if (err) {
			console.log(err);
			msg.channel.send(config.replies.ytdl_error)
				.then(reply => {if (config.debug_mode) console.log("Notified member of failed YTDL request");})
				.catch(err => console.log(`Failed to notify member of YTDL error, defails: ${err}`));
		} else {
			globals.serverMusic[msg.guild.id].queue.push(new MusicQueueEntry(info.video_url, info.title, parseInt(info.length_seconds), msg));
			if (globals.serverMusic[msg.guild.id].queue.length <= 1) {
				updateMusicPlayback(globals, msg.guild.id);
			}
			msg.channel.send(config.replies.added_to_queue.replace('$title', info.title))
				.then(reply => {if (config.debug_mode) console.log("Notified member of adding item to queue");})
				.catch(err => console.log(`Failed to notify member of queue addition, defails: ${err}`));
		}
	});
}

function getNextPlaylistPage(totalQueuedItems, playlistID, msg, globals, pageToken = null) {
	createServerMusicObject(globals, msg.guild.id);
	youtube.playlistItems.list({
		auth: globals.googleJWTClient,
		part: 'snippet,status',
		maxResults: 50,
		playlistId: playlistID,
		pageToken: pageToken,
	}, (err, response) => {
		if (err || response.status != 200) { // If something went wrong, don't issue any further requests
			msg.channel.send(config.replies.youtube_playlist_finished.replace("$amount", totalQueuedItems));
			updateMusicPlayback(globals, msg.guild.id);
			return;
		}
		let videoIDs = [];
		let playlistData = response.data.items;
		for (let i=0; i < playlistData.length; i++) {
			if (playlistData[i] && playlistData[i].status && playlistData[i].status.privacyStatus != 'private') {
				totalQueuedItems++;
				// Add entry to this extra array to call the duration update function later
				videoIDs.push(playlistData[i].snippet.resourceId.videoId);
				// enqueue every (valid) video
				globals.serverMusic[msg.guild.id].queue.push(new MusicQueueEntry("https://youtu.be/" + playlistData[i].snippet.resourceId.videoId, playlistData[i].snippet.title, 0, msg));
			}
		}

		// Start next API call to update the durations
		youtube.videos.list({
			auth: globals.googleJWTClient,
			part: 'contentDetails',
			maxResults: 50,
			id: videoIDs.join(","),
		}, (err, response) => {
			if (err || response.status != 200) return;
			let videoDurationData = response.data.items;
			for (let i = 0; i < videoDurationData.length; i++) {
				let durationInSeconds = moment.duration(videoDurationData[i].contentDetails.duration).asSeconds();
				globals.serverMusic[msg.guild.id].queue.find(queueEntry => queueEntry.url == "https://youtu.be/"+videoDurationData[i].id && queueEntry.duration.total_seconds == 0)
					.duration = {
						total_seconds: durationInSeconds,
						string: secondsToString(durationInSeconds)
					}
				;
			}
		});
		// End of duration update call (this should be able to run in the background)

		// If there is another page, do some recursion to continue on
		if (response.data.nextPageToken) {
			getNextPlaylistPage(totalQueuedItems, playlistID, msg, globals, response.data.nextPageToken);
		} else {
			msg.channel.send(config.replies.youtube_playlist_finished.replace("$amount", totalQueuedItems));
			updateMusicPlayback(globals, msg.guild.id);
		}
	});
}

function play(msg, params, globals) {
	if (!msg.member.voice.channel) { // User needs to be in a voice channel to play music
		msg.channel.send(config.replies.not_in_voice)
			.then(reply => {if (config.debug_mode) console.log("User attempted to play music, but wasn't connected to voice");})
			.catch(err => console.log(`Failed to notify member that he's not connected to voice, details: ${err}`));
		return;
	}
	if (!params[1]){
		msg.channel.send(config.replies.nothing_to_play);
		return;
	}

	let potentialURL = params[1].replace(/^<|>$/g,"");

	if (potentialURL.startsWith("https://www.youtube.com/playlist?list=")) { // Oooo, a youtube playlist! TIME TO QUEUE ALL OF IT.
		let playlistID = potentialURL.substring(38);
		msg.channel.send(config.replies.youtube_playlist_searchStart.replace("$playlistID", playlistID));
		//const youtube = google.youtube('v3');
		let playlistItems = []; // create an array of replies so we can store multiple pages
		getNextPlaylistPage(playlistItems, playlistID, msg, globals);
		return;
	}

	if (ytdl.validateURL(potentialURL)) addToQueue(potentialURL, msg, globals); // Youtube URL was found, go straight to addition
	else {
		let searchTerm = params.slice(1).join(" ");
		msg.channel.send(config.replies.lookup_yt_start.replace('$searchTerm', searchTerm));
		youtube.search.list({
			auth: globals.googleJWTClient,
			part: 'snippet',
			maxResults: 1,
			q: searchTerm
		}, (err, response) =>{
			if (err) {
				msg.channel.send(config.replies.lookup_yt_error);
				console.log('YouTube lookup encountered an API Error! Details:\n'+ err);
			} else {
				addToQueue(`https://youtu.be/${response.data.items[0].id.videoId}`, msg, globals);
			}
		});
	}
}

function skip(msg, params, globals) {
	if (!globals.serverMusic[msg.guild.id] || globals.serverMusic[msg.guild.id].queue.length == 0) {
		msg.channel.send(config.replies.nothing_to_skip);
		return;
	}
	let current_track = globals.serverMusic[msg.guild.id].queue[globals.serverMusic[msg.guild.id].queue_pos];
	if (msg.member.voice.channel != globals.serverMusic[msg.guild.id].voiceConnection.channel){
		msg.channel.send(config.replies.skip_failed_not_in_channel);
		return;
	}
	if (current_track.user == msg.author || msg.member.permissions.has("ADMINISTRATOR")) {
		msg.channel.send(config.replies.song_skipped);
		globals.serverMusic[msg.guild.id].queue_pos++;
		updateMusicPlayback(globals, msg.guild.id);
		//globals.serverMusic[msg.guild.id].dispatcher.destroy("Song forceskipped");
	} else {
		if (!(msg.author.id in globals.serverMusic[msg.guild.id].skip_votes)) {
			globals.serverMusic[msg.guild.id].skip_votes.push(msg.author.id);
		}
		let connectedMembersAmt = globals.serverMusic[msg.guild.id].voiceConnection.channel.members.size - 1;
		let requiredToSkip = Math.ceil(connectedMembersAmt * config.music_skip_ratio);
		let skipVoteAmt = globals.serverMusic[msg.guild.id].skip_votes.length;
		msg.channel.send(config.replies.skip_vote_progress.replace("$progress", `${skipVoteAmt}/${requiredToSkip}`));
		if (skipVoteAmt >= requiredToSkip) {
			msg.channel.send(config.replies.song_voteskipped);
			globals.serverMusic[msg.guild.id].queue_pos++;
			updateMusicPlayback(globals, msg.guild.id);
			//globals.serverMusic[msg.guild.id].dispatcher.destroy("Song voteskipped");
		}
	}
}

function remove(msg, params, globals) {
	if (!globals.serverMusic[msg.guild.id] || globals.serverMusic[msg.guild.id].queue.length == 0) {
		msg.channel.send(config.replies.queue_is_empty);
		return;
	}
	let entryNum = parseInt(params[1]);
	if (isNaN(entryNum) || entryNum < 0 || entryNum >= globals.serverMusic[msg.guild.id].queue.length) {
		msg.channel.send(config.replies.remove_invalid_number);
		return;
	}
	if (entryNum == globals.serverMusic[msg.guild.id].queue_pos) {
		msg.channel.send(config.replies.remove_queuepos_use_skip_instead);
		return;
	}
	if (globals.serverMusic[msg.guild.id].queue[entryNum].user != msg.author && !msg.member.permissions.has("ADMINISTRATOR")) {
		msg.channel.send(config.replies.remove_no_permission);
		return;
	}
	let removedEntry = globals.serverMusic[msg.guild.id].queue.splice(entryNum, 1);
	msg.channel.send(config.replies.remove_successful.replace("$removed", removedEntry[0].name));
}

function queue(msg, params, globals, offset = 0) {
	if (!globals.serverMusic[msg.guild.id] || globals.serverMusic[msg.guild.id].queue.length == 0) {
		msg.channel.send(config.replies.queue_is_empty);
		return;
	}
	let queue_pos = globals.serverMusic[msg.guild.id].queue_pos;
	let shownSongAmt = { before: 2, after: 5};
	let embedToSend = new Discord.MessageEmbed({
		title: `Currently handling ${globals.serverMusic[msg.guild.id].queue.length} song${globals.serverMusic[msg.guild.id].queue.length == 1 ? "":"s"}`,
		color: 0xf7069b,
		footer: {text: config.replies.queue_end},
	});
	for (let i = queue_pos + offset - shownSongAmt.before; i <= queue_pos + offset + shownSongAmt.after; i++) {
		if (i < 0) continue;
		if (i >= globals.serverMusic[msg.guild.id].queue.length) break;
		embedToSend.addField(`${i == queue_pos ? "**Now playing** 🎶" : "#"+i}`,
			`${i == queue_pos ? "**" : ""}${globals.serverMusic[msg.guild.id].queue[i].name}${i == queue_pos ? "**" : ""} | (${globals.serverMusic[msg.guild.id].queue[i].duration.string}) | ${globals.serverMusic[msg.guild.id].queue[i].user}`);
	}
	
	let remainingSongs = globals.serverMusic[msg.guild.id].queue.length - 1 - (queue_pos + offset + shownSongAmt.after);
	if (remainingSongs > 0) embedToSend.setFooter(`...and ${remainingSongs} more`);

	msg.channel.send(embedToSend).then((sentMessage) => {
		if (remainingSongs > 0) {
			sentMessage.react('⬇️');
			let reactionCollector = new Discord.ReactionCollector(sentMessage, (reaction, user) => user.id == msg.author.id && reaction.emoji.name == '⬇️', {time: 10000, limit: 1});
			reactionCollector.on("collect", (reaction, user) => {
				//reaction.remove();
				queue(msg, params, globals, offset+shownSongAmt.after+shownSongAmt.before);
			});

		}
		
	});
}

function np(msg, params, globals) {
	if (!globals.serverMusic[msg.guild.id] || globals.serverMusic[msg.guild.id].queue.length == 0) {
		msg.channel.send(config.replies.queue_is_empty);
		return;
	}
	let targeted_queue_entry = globals.serverMusic[msg.guild.id].queue[globals.serverMusic[msg.guild.id].queue_pos];
	let streamedTime = Math.floor(globals.serverMusic[msg.guild.id].dispatcher.streamTime/1000);
	let blockAmt = Math.floor((streamedTime / targeted_queue_entry.duration.total_seconds) * 20);
	if (blockAmt < 0) blockAmt = 0; if (blockAmt > 20) blockAmt = 20; // prevent fuckery
	let progress_bar = "█".repeat(blockAmt) + "▁".repeat(20-blockAmt);
	msg.channel.send(new Discord.MessageEmbed({
		author: {name: `Queued by ${targeted_queue_entry.user}`, iconURL: targeted_queue_entry.user.avatarURL},
		color: 0xf7069b,
		title: targeted_queue_entry.name,
		fields: [
			{name: "URL", value: targeted_queue_entry.url, inline: true},
			{name: "Duration", value: `[**${secondsToString(streamedTime)}**] ${progress_bar} [**${targeted_queue_entry.duration.string}**]`}
		]
	}));
}

function help(msg, params, globals) {
	msg.channel.send(new Discord.MessageEmbed({
		color: 0xf7069b,
		title: "Music help",
		fields: [
			{name: "help", value: "Shows this help text!"},
			{name: "np", value: "Shows what's playing"},
			{name: "play", value: "Adds a song to the queue"},
			{name: "skip", value: "Votes to skip or autoskips if you queued the song"},
			{name: "queue", value: "Shows (part of) the current queue"},
			{name: "remove", value: "Removes an entry at the numbered position from the queue if you queued the song"},
			{name: "loop", value: "Toggles between queue loop, single loop, or disables it"}
		],
		footer: {
			text: 'Made with ♡ by baa baa black goat',
			icon_url: 'https://i.imgur.com/EzUYnwC.png'
		}
	}));
}

function loop(msg, params, globals) {
	if (!globals.serverMusic[msg.guild.id] || globals.serverMusic[msg.guild.id].queue.length == 0) {
		msg.channel.send(config.replies.queue_is_empty);
		return;
	}
	switch (globals.serverMusic[msg.guild.id].loop) {
		case false:
			globals.serverMusic[msg.guild.id].loop = 'queue';
			msg.channel.send(config.replies.loop_enabled_queue);
			break;
		case 'queue':
			globals.serverMusic[msg.guild.id].loop = 'single';
			msg.channel.send(config.replies.loop_enabled_single);
			break;
		case 'single':
			globals.serverMusic[msg.guild.id].loop = false;
			msg.channel.send(config.replies.loop_disabled);
			break;
	}
}

function disconnect(msg, params, globals){
	if (globals.serverMusic[msg.guild.id] && globals.serverMusic[msg.guild.id].queue.length > 0) {
		msg.channel.send(config.replies.disconnect_areyousure.replace("$amount", globals.serverMusic[msg.guild.id].queue.length))
			.then(sentMessage => {
				sentMessage.react('🗑️');
				let collector = new Discord.ReactionCollector(sentMessage, (reaction, user) => reaction.emoji.name == '🗑️' && user.id == msg.author.id, {time: 10000, max: 1});
				collector.on("end", (collected, reason) => {
					if (reason == 'time') {
						msg.channel.send(config.replies.disconnect_timedout);
					} else if (reason == 'limit') {
						globals.serverMusic[msg.guild.id].loop = false;
						globals.serverMusic[msg.guild.id].queue_pos = Infinity;
						updateMusicPlayback(globals, msg.guild.id);
						msg.channel.send(config.replies.disconnect_confirm);
					}
				});
			});
	}
}

