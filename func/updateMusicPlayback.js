const ytdl = require('ytdl-core');
const Discord = require('discord.js');
const config = require('./../config.js');
//const Discord = require('discord.js');

// ----------------------
// Music handler
// ----------------------
// Updates the music playback for that server only.
// This function should be called when:
// - The queue was empty before, and a track was added.
// - A stream has finished playing. (A track is over.)
// 

module.exports = function updateMusicPlayback(globals, server_id) {
	globals.serverMusic[server_id].skip_votes = [];
	queue_pos = globals.serverMusic[server_id].queue_pos;
	if (globals.serverMusic[server_id].queue_pos >= globals.serverMusic[server_id].queue.length) {
		globals.serverMusic[server_id].queue_pos = queue_pos = 0;
		if (globals.serverMusic[server_id].loop != 'queue') { // If queue looping is enabled, skip this block - music will continue
			globals.serverMusic[server_id].queue = [];
			globals.serverMusic[server_id].loop = false;
			if (globals.serverMusic[server_id].voiceConnection) {
				globals.serverMusic[server_id].voiceConnection.disconnect();
			}
			globals.serverMusic[server_id].voiceConnection = globals.serverMusic[server_id].dispatcher = null;
			return;
		}
	}
	globals.serverMusic[server_id].queue[queue_pos].voiceChannel.join()
		.then(connection => {
			globals.serverMusic[server_id].voiceConnection = connection;
			globals.serverMusic[server_id].dispatcher = connection.play(ytdl(globals.serverMusic[server_id].queue[queue_pos].url, {filter:"audioonly", quality: "highestaudio", highWaterMark: 1<<25}), {highWaterMark: 1, passes: 3, bitrate: 256000});
			if (globals.serverMusic[server_id].loop_amt == 0) { 
				globals.serverMusic[server_id].queue[queue_pos].textChannel.send(new Discord.MessageEmbed({
					author: {name: `Queued by ${globals.serverMusic[server_id].queue[queue_pos].user.tag}`, iconURL: globals.serverMusic[server_id].queue[queue_pos].user.avatarURL()},
					color: 0xf7069b,
					description: `💽 Now playing ${globals.serverMusic[server_id].queue[queue_pos].name} in ${globals.serverMusic[server_id].queue[queue_pos].voiceChannel.name}`
				}));
			}
			
			
			globals.serverMusic[server_id].voiceConnection.on("disconnect", () => {
				// this fires on forceful channel switching too, right...?	
			});

			globals.serverMusic[server_id].dispatcher.on("error", (err) =>{
				console.log("error in dispatcher: \n" + err);
			});

			globals.serverMusic[server_id].dispatcher.on("finish", (reason)=>{ // Stream has ended.
				if (globals.serverMusic[server_id].loop == 'single') globals.serverMusic[server_id].loop_amt += 1;
				else {
					globals.serverMusic[server_id].loop_amt = 0;
					globals.serverMusic[server_id].queue_pos++;
				}
				if (config.debug_mode) {console.log(`Dispatcher has ended, ${reason}`);}
				updateMusicPlayback(globals, server_id); 
			});

			globals.serverMusic[server_id].dispatcher.on("error", (err) => {
				console.log(`Dispatcher has encountered an error: ${err}`);
			});
		})
		.catch(err => {
			console.log(`Failed to connect to voice channel. Error: ${err}. Attempting to connect to voice...`);
			updateMusicPlayback(globals, server_id);
		});
	
};