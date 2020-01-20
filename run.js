const Discord = require('discord.js');
const fs = require('fs');
const client = new Discord.Client();
const token = fs.readFileSync('token.txt', 'utf8');
let config = require('./config.js');


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
	else if (msg.content.startsWith(config.prefix)) {
		// Check if the user who sent the message has any roles at all. (Note: @everyone is a role, too)
		if (msg.member.roles.size <= 1) {
			msg.reply(config.replies.no_role)
				.then(reply => {
					if (config.debug_mode) {
						console.log(`User requested to change color, but had no roles, issued by ${msg.author.tag} in ${msg.guild.name}`);
					}
				})
				.catch(err => {
					console.log(`Failed to reply to a message requesting a color change that failed because the user had no roles. Error details: \n${err}`);
				});
			return;
		}

		// Check if the user's message contains a valid color (in hexadecimal format). If not, alert and skip.
		let requestedColor = msg.content.replace(config.prefix, '').trim();
		if (/^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/.test(requestedColor) == false){ // If match fails, alert the user
			msg.reply(config.replies.not_a_color)
				.then(reply => {
					if (config.debug_mode) {
						console.log(`User requested to change color, but supplied invalid color ${requestedColor}, issued by ${msg.author.tag} in ${msg.guild.name}`);
					}
				})
				.catch(err => {
					console.log(`Failed to reply to a message requesting a color change that failed because invalid color ${requestedColor} was supplied. Error details: \n${err}`);
				});
			return;
		}

		// Check if the user who sent the message has a role that defines their color already.
		let foundRole;
		if (msg.member.colorRole) { // User has a role that defines their color. Check if it has blacklisted permissions.
			foundRole = msg.member.colorRole;
			let blocked_for_permission = false;
			config.permission_blacklist.forEach(permission => {
				if (!blocked_for_permission && foundRole.hasPermission(permission)) { // that first check exists to prevent overworking the bot ;w;
					blocked_for_permission = true;
				}
			});
			if (blocked_for_permission) {
				msg.reply(config.replies.role_permission_blacklisted)
					.then(reply => {
						if (config.debug_mode) {
							console.log(`User requested to change color, but their color role has a blacklisted permission, issued by ${msg.author.tag} in ${msg.guild.name}`);
						}
					})
					.catch(err => {
						console.log(`Failed to reply to a message requesting a color change that failed because the user's color role has a blacklisted permission. Error details: \n${err}`);
					});
				return;
			}
		} else { // User has no roles that define their color. Check if their highest role has blacklisted permissions.
			msg.reply(config.replies.no_color_role)
				.then(reply => {
					if (config.debug_mode) {
						console.log(`User requested to change color, but had no role that sets their color, issued by ${msg.author.tag} in ${msg.guild.name}`);
					}
				})
				.catch(err => {
					console.log(`Failed to reply to a message requesting a color change that failed because the user has no role that sets their color. Error details: \n${err}`);
				});
			return;
		}

		// Check if the found role already has this color. If so, notify the user.
		if (foundRole.hexColor == requestedColor) {
			msg.reply(config.replies.same_color)
				.then(reply => {
					if (config.debug_mode) {
						console.log(`User requested to change color, but already has this color, issued by ${msg.author.tag} in ${msg.guild.name}`);
					}
				})
				.catch(err => {
					console.log(`Failed to reply to a message requesting a color change that failed because the user already has this color. Error details: \n${err}`);
				});
			return;
		}

		// This is the part where we actually change the color of the role!
		msg.member.roles.get(foundRole.id).setColor(requestedColor)
			.then(role => {
				let to_send = config.replies.change_successful;
				to_send = to_send.replace('$roleName', role.name);
				to_send = to_send.replace('$requestedColor', requestedColor);
				msg.reply(to_send)
					.then(reply => {
						if (config.debug_mode) {
							console.log(`User color change successful, issued by ${msg.author.tag} in ${msg.guild.name}`);
						}
					})
					.catch(err => {
						console.log(`Failed to reply to a message after successfully changing their color. Error details: \n${err}`);
					});
			})
			.catch(err => {	// Something went wrong, should we end up down here.
				switch (err.code) {
					case 50013:	// The bot has no permissions to change the role
						msg.reply(config.replies.no_permission)
							.then(reply => {
								console.log(`Failed to change color for ${msg.author.tag} in ${msg.guild.name} because of missing permissions. Detailed error: \n${err}`);	
							})
							.catch(err => {
								console.log(`Failed to notify ${msg.author.tag} the bot user is missing permissions in ${msg.guild.name}. Error details: \n${err}`);
							});
						break;
					default: // something else went wrong - I'll have to fill this out some day
						msg.reply(config.replies.generic_error)
							.then(reply => {
								console.log(`Failed to change color for ${msg.author.tag} in ${msg.guild.name} because something else went wrong. Detailed error: \n${err}`);
							})
							.catch(err => {
								console.log(`Failed to notify ${msg.author.tag} that something went wrong changing colors in ${msg.guild.name}. Error details: \n${err}`);
							});
						break;
				}			
				console.log(err);
			});
	}
});

client.on('ready', () => {
	console.log(`Connected to Discord as ${client.user.tag}`);
});

client.on('reconnecting', ()=>{
	console.log(`Attempting to reconnect...`);
});

client.on('disconnect', (event) => {
	console.log(`Disconnected from Discord. Restart the script to reconnect. Details:\n${event}`);
});

client.on('rateLimit', (rateLimit) => {
	console.log(`Rate limit reached. Details:\n${rateLimit}`);
});

client.on('warn', (warning) => {
	console.log(warning);
});

client.on('error', (error) => {
	console.log(`Encountered a connection error. Details:\n${error}`);
});

// Log in to Discord once the important stuff is done
client.login(token);