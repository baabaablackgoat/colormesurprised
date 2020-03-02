const Discord = require('discord.js');
const fs = require('fs');
const ytdl = require('ytdl-core');
const client = new Discord.Client();
const token = fs.readFileSync('token.txt', 'utf8').trim();
const serverSettingsPath = './data/serverSettings.json';
let config = require('./config.js');
const getColor = require('./func/getColor.js');
const color_commands = require('./func/color_commands.js');
const general_commands = require('./func/general_commands.js');
const changeMemberColor = require('./func/changeMemberColor.js');
const parametrize = require('./func/parametrize.js');
let globals = {
	serverSettings: {},
	serverMusic: {},
	google_api_key: fs.readFileSync('google_token.txt', 'utf8').trim(),
};

if (fs.existsSync(serverSettingsPath)) {
	globals.serverSettings = JSON.parse(fs.readFileSync(serverSettingsPath));
} else {
	globals.serverSettings = {};
	fs.writeFileSync(serverSettingsPath, '{}');
}

// Message handler
client.on('message', msg => {

	// Check if the message was sent by a bot (including the bot themselves!). If so, just skip it.
	if (msg.author.bot || msg.author == client.id) { // second check should probably be redundant but eh
		return;
	}

	// Check if the message was sent outside of a server. If yes, skip message and reply nicely <w<
	if (msg.channel.type != 'text') {
		msg.channel.send(config.replies.wrong_channel)
			.then(reply => {
				if (config.debug_mode) {
					console.log(`Replied to a message in a wrong channel, issued by ${msg.author.tag}`);
				}})
			.catch(err => console.log(`Failed to reply to a message issued in a wrong channel. Error details: \n${err}`));
		return;
	}

	/*
	TODO IMPLEMENT CHANNEL BLACKLISTS/WHITELISTS AND BANNING USERS - COMMENTED OUT UNTIL IMPLEMENTED 
	// check if the sent message was sent in either a not whitelisted channel or a blacklisted channel
	if (globals.serverSettings[msg.guild.id].channel_options.channels.includes(msg.channel.id)) { // channel is present in the list of channels for the server
		if (globals.serverSettings[msg.guild.id].channel_options.whitelist) { // If the server operates on blacklist mode, since the channel is noted, block execution
			if (config.debug_mode) {console.log(`Ignored command in channel ${msg.channel.name} on ${msg.guild.name} - channel is blacklisted`);}
			return;
		}
	} else if (globals.serverSettings[msg.guild.id].channel_options.whitelist) { // because the channel is NOT present in the list of channels, whitelist blocks execution
		if (config.debug_mode) {console.log(`Ignored command in channel ${msg.channel.name} on ${msg.guild.name} - channel is not whitelisted`);}
		return;
	}

	// check if the user was banned from using the bot on this server
	if (globals.serverSettings[msg.guild.id].banned_users.includes(msg.member.id)) {
		if (config.debug_mode) {console.log(`Blocked ${msg.member.tag} on ${msg.guild.name} from accessing commands - user has been banned on this server`);}
		return;
	}
	*/

	// Color command handling starts here
	let msgNoColorPrefix = checkForPrefixAndTrim(msg.content, 'color');
	if (msgNoColorPrefix) {
		// Create server settings if required
		initServerSettings(msg);

		// Check if the user's message contains a valid color (in hexadecimal format). If not, alert and skip.
		let requestedColor = getColor(msgNoColorPrefix);
		if (requestedColor == false){
			// If color match fails, check if a color command was supposed to be invoked instead
			let requestedCommand = Object.keys(config.color_commands).filter((key)=>{return config.color_commands[key] == msgNoColorPrefix.toLowerCase();});
			if (requestedCommand.length == 1) { // Found one command and one command only
				color_commands[requestedCommand[0]](msg);
				return;
			} else if (requestedCommand.length > 1) {
				console.log(`User requested to run color command ${msgNoColorPrefix} but multiple commands matched the filter. Double check your config.js`);
			}

			// if neither a color nor a command were supplied, raise not_a_color (if not disabled through config)
			if (config.reply_on_invalid){
				msg.reply(config.replies.not_a_color)
					.then(reply => {
						if (config.debug_mode) {
							console.log(`User requested to change color, but supplied invalid color ${requestedColor}, issued by ${msg.author.tag} in ${msg.guild.name}`);
						}
					})
					.catch(err => {
						console.log(`Failed to reply to a message requesting a color change that failed because invalid color ${requestedColor} was supplied. Error details: \n${err}`);
					});
			}
			return;
		} else {
			changeMemberColor(msg, requestedColor);
		}

	// General Command handling starts here (if color handling failed)
	} else {
		let msgNoGeneralPrefix = checkForPrefixAndTrim(msg.content, 'general');
		if (msgNoGeneralPrefix){
			let params = parametrize(msgNoGeneralPrefix);
			let requestedCommand = Object.keys(config.general_commands).filter((key) => {return config.general_commands[key] == params[0];});
			if (requestedCommand.length == 1) {
				general_commands[requestedCommand[0]](msg, params, globals); // Call the command
				return;
			} else if (requestedCommand.length > 1) {
				console.log(`User requested to run general command ${msgNoColorPrefix} but multiple commands matched the filter. Double check your config.js`);
			}
		}
	}

});


// ----------------------
// Helper functions that probably should be put in /func but heck u it's my code
// ----------------------

// Checks for the color prefixes. If found, returns the rest of the message w/o the prefix. If not, returns false.
function checkForPrefixAndTrim(msgstring, type) {
	if (type == 'color') {
		for (var i = 0; i < config.color_prefix.length; i++) {
			if (msgstring.startsWith(config.color_prefix[i])) return msgstring.replace(config.color_prefix[i],'').trim();
		}
	}
	else if (type == 'general'){
		for (var j = 0; j < config.general_prefix.length; j++) {
			if (msgstring.startsWith(config.general_prefix[j])) return msgstring.replace(config.general_prefix[j],'').trim();
		}
	}
	return false;
}

// Save server settings.
function saveServerSettings() {
	fs.writeFile(serverSettingsPath, JSON.stringify(globals.serverSettings), (err)=>{
		if (err) {console.log('Failed to save serverSettings:\n'+err);}
		else if (config.debug_mode){console.log('serverSettings have been saved.');}
	});
}

// Creates server settings if non-existant.
function initServerSettings(msg) {
	if (msg.guild.id in globals.serverSettings == false) { // the targeted server isn't represented in the settings yet, create and save
		globals.serverSettings[msg.guild.id] = {
			"channel_options": {"whitelist":false, "channels":[]},
			"banned_users":[],
			"color_restrictions":[]
		};
		saveServerSettings();
	}
}

// ----------------------
// More client events
// ----------------------

let activityInterval;
let saveSettingsInterval;
client.on('ready', () => { // This event fires once the client has successfully logged into Discord.
	console.log(`Connected to Discord as ${client.user.tag}`);

	// Set the bot user's status (the playing status) and changes it on a regular basis ("interval")
	if (!activityInterval) { // bit of an afterthought - avoid creating multiple intervals in case the bot accidentally disconnects or something
		activityInterval = client.setInterval(() => {
			let activity_index = Math.floor(Math.random() * config.activities.length);
			client.user.setActivity(config.activities[activity_index].name, {type: config.activities[activity_index].type})
				.then(promise => {
				if (config.debug_mode) {
					console.log('Successfully set activity.');
				}
			})
			.catch(err => `Failed to set activity. More details: \n${err}`);
		}, config.activity_interval);
	}

	if (!saveSettingsInterval) {
		saveSettingsInterval = client.setInterval(saveServerSettings, config.save_interval);
	}
});

client.on('reconnecting', ()=>{	// This should fire when something goes wrong inbetween connections.
	console.log(`Attempting to reconnect...`);
});

client.on('disconnect', (event) => { // This event only fires if the client has been disconnected and is not supposed to attempt reconnections (e.g. wrong token provided)
	console.log(`Disconnected from Discord. Restart the script to reconnect. Details:\n${event}`);
});

client.on('rateLimit', (rateLimit) => { // Well, this fires once the ratelimit for the bot was reached (discord-side)
	console.log(`Rate limit reached. Details:\n${rateLimit}`);
});

client.on('warn', (warning) => { // Generic warnings that discord.js fires off are caught by this
	console.log(warning);
});

client.on('error', (error) => { // This fires on connection errors (like your ip changing from your internet disconnecting again for fucks sake MOM STOP CALLING WHEN I'M PLAYING VIDEO GAMES SHEESH)
	console.log(`Encountered a connection error. Details:\n${error}`);
});

// Actually log in to Discord - do this at the end as soon as all events have been created or at least marked for creation
client.login(token);