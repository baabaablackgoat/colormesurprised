const Discord = require('discord.js');
const fs = require('fs');
const client = new Discord.Client();
const token = fs.readFileSync('token.txt', 'utf8').trim();
const serverSettingsPath = './data/serverSettings.json';
let config = require('./config.js');
const getColor = require('./func/getColor.js');
const commands = require('./func/commands.js');
const changeMemberColor = require('./func/changeMemberColor.js');
let serverSettings;

if (fs.existsSync(serverSettingsPath)) {
	serverSettings = JSON.parse(fs.readFileSync(serverSettingsPath));
} else {
	serverSettings = {};
	fs.writeFileSync(serverSettingsPath, '{}');
}

function saveServerSettings() {
	fs.writeFile(serverSettingsPath, JSON.stringify(serverSettings), (err)=>{
		if (err) {console.log('Failed to save serverSettings:\n'+err);}
		else if (config.debug_mode){console.log('serverSettings have been saved.');}
	});
}

// Message handler
client.on('message', msg => {
	// Check if the message was sent by a bot (including the bot themselves!). If so, just skip it.
	if (msg.author.bot || msg.author == client.id) {
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

	// Check if the sent message has the configured prefix. If not, skip. 
	if (msg.content.startsWith(config.prefix)) {

		if (msg.guild.id in serverSettings == false) { // the targeted server isn't represented in the settings yet, create and save
			serverSettings[msg.guild.id] = {
				"channel_options": {"whitelist":false, "channels":[]},
				"banned_users":[],
				"color_restrictions":[]
			};
			saveServerSettings();
		}

		// check if the sent message was sent in either a not whitelisted channel or a blacklisted channel
		if (serverSettings[msg.guild.id].channel_options.channels.includes(msg.channel.id)) { // channel is present in the list of channels for the server
			if (serverSettings[msg.guild.id].channel_options.whitelist) { // If the server operates on blacklist mode, since the channel is noted, block execution
				if (config.debug_mode) {console.log(`Ignored command in channel ${msg.channel.name} on ${msg.guild.name} - channel is blacklisted`);}
				return;
			}
		} else if (serverSettings[msg.guild.id].channel_options.whitelist) { // because the channel is NOT present in the list of channels, whitelist blocks execution
			if (config.debug_mode) {console.log(`Ignored command in channel ${msg.channel.name} on ${msg.guild.name} - channel is not whitelisted`);}
			return;
		}

		// check if the user was banned from using the color changes on this server
		if (serverSettings[msg.guild.id].banned_users.includes(msg.member.id)) {
			if (config.debug_mode) {console.log(`Blocked ${msg.member.tag} on ${msg.guild.name} from accessing commands - user has been banned on this server`);}
			return;
		}

		// Check if the user's message contains a valid color (in hexadecimal format). If not, alert and skip.
		let msgContTrimmed = msg.content.replace(config.prefix, '').trim();
		let requestedColor = getColor(msgContTrimmed);
		if (requestedColor == false){
			// If match fails, check if a command was supposed to be invoked instead
			let requestedCommand = Object.keys(config.commands).filter((key)=>{return config.commands[key] == msgContTrimmed.toLowerCase();});
			if (requestedCommand.length == 1) { // Found one command and one command only
				commands[requestedCommand[0]](msg);
				return;
			} else if (requestedCommand.length > 1) {
				console.log(`User requested to run command ${msgContTrimmed} but multiple commands matched the filter. Double check your config.js`);
			}


			// if neither a color nor a command were supplied, raise the not_a_color  (if not disabled through config)
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

	}
});


let presenceInterval;
client.on('ready', () => { // This event fires once the client has successfully logged into Discord.
	console.log(`Connected to Discord as ${client.user.tag}`);
	// Set the bot user's status (the playing status) and changes it on a regular basis ("interval")
	if (!presenceInterval) { // bit of an afterthought - avoid creating multiple intervals in case the bot accidentally disconnects or something
		presenceInterval = client.setInterval(() => {
			let presence_index = Math.floor(Math.random() * config.presences.length);
			client.user.setPresence({
				game: {
					name: config.presences[presence_index].name,
					type: config.presences[presence_index].type
				}
			}).then(promise => {
				if (config.debug_mode) {
					console.log('Successfully set presence status.');
				}
			})
			.catch(err => `Failed to set presence status. More details: \n${err}`);
		}, config.presence_interval);
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