module.exports = {
	// hello and welcome to the most amazing config file ever <w< /s

	// Enable Debug mode - your console will be full of  i n f o r m a t i o n  and  g n a w l e d g e
	debug_mode: true,

	// Set the prefix(es) the bot listens to. Messages that don't have this prefix are skipped entirely.
	prefix: 'color me ',

	// The status messages the bot shows! Will eventually maybe cycle through a few~
	presence: 'with all the heckin colors!',
	
	// Basically the dictionary of replies. 
	replies: {
		wrong_channel: 'Hey! I appreciate you giving me attention, but I really can\'t work outside of a server channel ;w;\nYou can have a big hug from me though, instead... *huggles*',
		no_role: 'you don\'t seem to have any roles assigned to you... ;w;\nYou need at least one role (that isn\'t administrative) to be able to change your color!',
		not_a_color: 'that doesn\'t look like a color to me... Please give me your requested color in a hexadecimal format! (Like this: #420420)' ,
		role_permission_blacklisted: 'the role that defines your color has one or more permissions that are blacklisted from being changed.',
		no_color_role: 'even though you have roles, I couldn\'t find a role that sets your color! To prevent me from changing an important role, I won\'t change your color... for now. In a future update, I\'ll try my best to do that for you!',
		same_color: 'you already have this color... ;w; If it doesn\'t show up, you might need to ask your administrator about this xwx',
		no_permission: 'I couldn\'t change your color because I dont have the permission to do that... ;w; Ask your local administrator to look into this!',
		generic_error: 'something went wrong... I\'m so sorry ;^; Please try again later...',
		change_successful: 'I have changed the color of role "$roleName" to $requestedColor! *hugs*',
	},

	// Roles that have any of these permissions are banned from being changed by this bot to avoid changing administrative colors.
	// If you need to add or remove permissions, check here: https://discord.js.org/#/docs/main/stable/class/Permissions?scrollTo=s-FLAGS
	permission_blacklist: [	
		'ADMINISTRATOR',
		'KICK_MEMBERS',
		'MANAGE_CHANNELS'
	]
}