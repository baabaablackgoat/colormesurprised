const Discord = require('discord.js');
const config = require('../config.js');
const changeMemberColor = require('./changeMemberColor.js');
const colorList = require('../data/colorList.js');
module.exports.help = help;
module.exports.echo_color = echo_color;
module.exports.random_color = random_color;
module.exports.admin_ban_user = admin_ban_user;
module.exports.admin_unban_user = admin_unban_user;
module.exports.support = support;

const helpEmbed = new Discord.RichEmbed({
	author: {name: 'Color me surprised', icon_url: 'https://i.imgur.com/40ynGjv.png', url: 'https://baabaablackgoat.com'},
	color: 0xf7069b,
	description: `Hi! I'm a small discord bot that allows you to change your role color! Just call me with \`${config.color_prefix[0]}\your_color\` and I'll be there to assist you~\nI support hexadecimal values (like \`#fff\` or \`#123aac\`), rgb values (like \`(255,125,0)\`), and css color codes!`,
	footer: {
		text: 'Made with ♡ by baa baa black goat',
		icon_url: 'https://i.imgur.com/EzUYnwC.png'
	}
});

function help(msg) {
	msg.channel.send(helpEmbed)
		.then(reply => {
			if (config.debug_mode) {
				console.log(`Sent help embed on behalf of ${msg.author.tag} in ${msg.guild.name}`);
			}
		}).catch(err => {
			console.log(`Failed to send help embed on behalf of ${msg.author.tag} in ${msg.guild.name}:\n${err}`);
		});	
}

function echo_color(msg) {
	if (msg.member.colorRole != null) {
		msg.reply(config.replies.echo_color.replace('$roleColor',msg.member.colorRole.hexColor).replace('$roleName',msg.member.colorRole.name))
			.then(reply => {
				if (config.debug_mode) {
					console.log(`Echoed color to ${msg.author.tag} in ${msg.guild.name}`);
				}
			}).catch(err => {
				console.log(`Failed to echo color to ${msg.author.tag} in ${msg.guild.name}:\n${err}`);
			});
	} else {
		msg.reply(config.replies.echo_color_failed)
			.then(reply => {
				if (config.debug_mode) {
					console.log(`Echoed to user ${msg.author.tag} in ${msg.guild.name} that their role has no color.`);
				}
			}).catch(err => {
				console.log(`Failed to tell ${msg.author.tag} in ${msg.guild.name} that their role has no color:\n${err}`);
			});
	}
}

function random_color(msg) {
	// To avoid getting ugly colors, random_color takes the colorList and picks one out of there
	changeMemberColor(msg, colorList[Object.keys(colorList)[Math.floor(Math.random() * Object.keys(colorList).length)]]);
}

function admin_ban_user(msg) {
	msg.channel.send('Banning and unbanning has not been implemented yet - soon though, maybe... ;w;');
}

function admin_unban_user(msg) {
	msg.channel.send('Banning and unbanning has not been implemented yet - soon though, maybe... ;w;');
}

function support(msg) {
	msg.channel.send('Awh, shucks... I appreciate the sentiment, but all I could really ask for is a hug ;w; ♡');
}