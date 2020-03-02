const Discord = require('discord.js');
const config = require('../config.js');
const ytdl = require('ytdl-core');
const updateMusicPlayback = require('./updateMusicPlayback.js');

module.exports.play = play;
module.exports.skip = skip;
module.exports.remove = remove;
module.exports.queue = queue;
module.exports.search = search;
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

class MusicQueueEntry {
	constructor(url, name, msg){
		this.url = url;
		this.name = name;
		this.user = msg.author;
		this.textChannel = msg.channel;
		this.voiceChannel = msg.member.voice.channel;
	}
}


function getURL(input, api_key){ // This should be expanded to autosearch for also just text
	if (ytdl.validateURL(input)) return input;

	/* Deprecated. Will use request instead.
	return youtube_search(input, {maxResults: 1, key: api_key}, (err, results) => {
		if (err) {
			if (config.debug_mode) console.log("Youtube Search Lookup failed: " + err);
			return false;
		}
		if (results.length >= 1) {
			if (ytdl.validateURL(results[0].link)) return results[0].link;
			else {
				console.log("youtube-search returned result "+ results[0].link +" that was not understood by ytdl-core.");
				return false;
			}
		} else {
			if (config.debug_mode) console.log("Youtube Search returned no results. " + results);
			return false;
		}
	});
	*/
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
			globals.serverMusic[msg.guild.id].queue.push(new MusicQueueEntry(info.video_url, info.title, msg));
			if (globals.serverMusic[msg.guild.id].queue.length <= 1) {
				updateMusicPlayback(globals, msg.guild.id);
			}
			msg.channel.send(config.replies.added_to_queue.replace('$title', info.title))
				.then(reply => {if (config.debug_mode) console.log("Notified member of adding item to queue");})
				.catch(err => console.log(`Failed to notify member of queue addition, defails: ${err}`));
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
	let requestedURL = getURL(params[1].replace(/^<|>$/g,""), globals.google_api_key);
	if (requestedURL){ // The passed parameters are valid. Let's rock
		addToQueue(requestedURL, msg, globals); // Add to queue
	} else {
		msg.channel.send(config.replies.malformed_url)
			.then(reply => {if (config.debug_mode) console.log(`User passed invalid URL ${params[1]}`);})
			.catch(err => console.log(`Failed to notify member of malformed URL, details: ${err}`));
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

function queue(msg, params, globals) {
	if (!globals.serverMusic[msg.guild.id] || globals.serverMusic[msg.guild.id].queue.length == 0) {
		msg.channel.send(config.replies.queue_is_empty);
		return;
	}
	let queue_pos = globals.serverMusic[msg.guild.id].queue_pos;
	let to_send = "";
	let shownSongAmt = { before: 2, after: 5};
	for (let i = queue_pos - shownSongAmt.before; i <= queue_pos + shownSongAmt.after; i++) {
		if (i < 0) continue;
		if (i >= globals.serverMusic[msg.guild.id].queue.length) {
			to_send += config.replies.queue_end;
			break;
		}
		to_send += `${i == queue_pos ? "🎶" : i}) ${globals.serverMusic[msg.guild.id].queue[i].name} ** queued by ${globals.serverMusic[msg.guild.id].queue[i].user.username}\n`;
	}
	let remainingSongs = globals.serverMusic[msg.guild.id].queue.length - 1 - (queue_pos + shownSongAmt.after);
	if (remainingSongs > 0) to_send += `...and ${remainingSongs} more`;
	msg.channel.send("```nimrod\n"+to_send+"```");
}

function np(msg, params, globals) {
	if (!globals.serverMusic[msg.guild.id] || globals.serverMusic[msg.guild.id].queue.length == 0) {
		msg.channel.send(config.replies.queue_is_empty);
		return;
	}
	let targeted_queue_entry = globals.serverMusic[msg.guild.id].queue[globals.serverMusic[msg.guild.id].queue_pos];
	msg.channel.send(new Discord.MessageEmbed({
		author: {name: `Queued by ${targeted_queue_entry.user.username}`, icon_url: targeted_queue_entry.user.avatarURL},
		color: 0xf7069b,
		description: targeted_queue_entry.name,
		url: targeted_queue_entry.url,
		footer: {
			text: 'Made with ♡ by baa baa black goat',
			icon_url: 'https://i.imgur.com/EzUYnwC.png'
		}
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
			{name: "search", value: "Not yet done - youtube returns 403's atm"}
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

function search(msg, params, globals) {
	msg.channel.send("Sorry, search doesn't work yet cause of youtube-search being borked xwx");
}

function disconnect(msg, params, globals){
	msg.channel.send("Coming soon! ;w;");
}

