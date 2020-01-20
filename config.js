module.exports = {
	// hello and welcome to the most amazing config file ever <w< /s
	// Side note: some things might not immediately appear in here, they might not at all, but I'll try to keep this as full of feature tweaking options as possible

	// Enable Debug mode - your console will be full of  i n f o r m a t i o n  and  g n a w l e d g e
	debug_mode: true,

	// Set the prefix(es) the bot listens to. Messages that don't have this prefix are skipped entirely.
	prefix: 'color me ',

	// The keywords following the prefixes that trigger special commands. Make sure these aren't actual colors, or the color dictionary may make certain commands uncallable.
	commands: {
		help: '?',
		echo_color: 'intrigued',
		random_color: 'surprised',
		admin_ban_user: 'but not',
		admin_unban_user: 'but also',
		support: 'supportive'
	},

	// The status messages the bot shows!
	presences: [
		{ name: 'with all the heckin colors!', type: 'PLAYING'},
		{ name: 'https://github.com/baabaablackgoat/colormesurprised for new issues', type: 'WATCHING'},
		{ name: 'probably another rick roll', type: 'LISTENING'},
		{ name: 'nothing uwu weave me awone am angy', type: 'STREAMING'} 
	],

	// The time interval in which the bot changes his presence message in milliseconds. Don't make this less than 30000 or you WILL be ratelimited all the time, trust me.
	presence_interval: 60000,

	// Basically the dictionary of replies. 
	replies: {
		wrong_channel: 'Hey! I appreciate you giving me attention, but I really can\'t work outside of a server channel ;w;\nYou can have a big hug from me though, instead... *huggles*',
		no_role: 'you don\'t seem to have any roles assigned to you... ;w;\nYou need at least one role (that isn\'t administrative) to be able to change your color!',
		not_a_color: 'that doesn\'t look like a color to me... I understand hexadecimal (`#fff` or `#420420`), RGB (`(255,128,0)`) and the css color list (`pink`, `lightblue` ...)' ,
		role_permission_blacklisted: 'the role that defines your color has one or more permissions that are blacklisted from being changed.',
		no_color_role: 'even though you have roles, I couldn\'t find a role that sets your color! To prevent me from changing an important role, I won\'t change your color... for now. In a future update, I\'ll try my best to do that for you!',
		same_color: 'you already have this color... ;w; If it doesn\'t show up, you might need to ask your administrator about this xwx',
		no_permission: 'I couldn\'t change your color because I dont have the permission to do that... ;w; Ask your local administrator to look into this!',
		generic_error: 'something went wrong... I\'m so sorry ;^; Please try again later...',
		change_successful: 'I have changed the color of role "$roleName" to $requestedColor! *hugs*',
		echo_color: 'you currently have the color $roleColor on your role $roleName! *huggles*',
		echo_color_failed: 'you don\'t seem to have any role that gives you a color... ;w;',
	},

	// Roles that have any of these permissions are banned from being changed by this bot to avoid changing administrative colors.
	// If you need to add or remove permissions, check here: https://discord.js.org/#/docs/main/stable/class/Permissions?scrollTo=s-FLAGS
	permission_blacklist: [	
		'ADMINISTRATOR',
		'KICK_MEMBERS',
		'MANAGE_CHANNELS'
	]
};