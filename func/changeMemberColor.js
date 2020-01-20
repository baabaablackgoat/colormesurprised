const config = require('./../config.js');
module.exports = function(msg, color) {
	// This function will handle whether the user's color can be changed, and if it can, change it to the supplied color.

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
	} else { // User has no roles that define their color.
		// TODO Issue #3: Picking a color role.
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
	if (foundRole.hexColor == color) {
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
	msg.member.roles.get(foundRole.id).setColor(color)
		.then(role => {
			let to_send = config.replies.change_successful;
			to_send = to_send.replace('$roleName', role.name);
			to_send = to_send.replace('$requestedColor', color);
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