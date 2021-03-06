module.exports = {
	// hello and welcome to the most amazing config file ever <w< /s
	// Side note: some things might not immediately appear in here, they might not at all, but I'll try to keep this as full of feature tweaking options as possible

	// Enable Debug mode - your console will be full of  i n f o r m a t i o n  and  g n a w l e d g e
	debug_mode: true,

	// Set the prefix(es) the bot listens for color related queries. This prefix only works on the commands listed in color_commands!
	color_prefix: ['color me ', 'colour me '],

	// The keywords following the prefixes that trigger special commands. Make sure these aren't actual colors, or the color dictionary may make certain commands uncallable.
	color_commands: {
		help: '?',
		echo_color: 'intrigued',
		random_color: 'surprised',
		admin_ban_user: 'but not',
		admin_unban_user: 'but also',
		support: 'supportive',
	},

	// Set the prefix(es) the bot listens to for using advanced commands. This does NOT include color changes!
	general_prefix: ['='],

	// The keywords following the general prefixes that trigger advanced commands. Don't make two keywords be the same or shit will break.
	general_commands: {
		play: 'play',
		queue: 'queue',
		remove: 'remove',
		skip: 'skip',
		help: 'help',
		np: 'np',
		disconnect: 'disconnect',
		loop: 'loop',
		new_nick: 'new_nick',
		version: 'version',
		shuffle: 'shuffle',
		tumbledry: 'tumbledry',
	},

	// Sets the ratio of how many people in the vc need to vote for a skip to skip the song. Will always be overridden by the person who queued the song or admins.
	music_skip_ratio: 0.5,

	// Sets the amount of maximum tracks that are allowed to play before the shuffle command is blocked (to prevent fuckery)
	max_tracks_before_shuffle: 3,

	// The status messages the bot shows!
	activities: [
		{ name: 'with r a i n b o w s', type: 'PLAYING'},
		{ name: 'with all the heckin colors!', type: 'PLAYING'},
		{ type: 'PLAYING', name: 'with coloUrs, not colors'},
		{ name: 'probably another rick roll', type: 'LISTENING'},
		{ name: 'with discord.js v12.0!', type: 'PLAYING'} 
	],

	// The time interval in which the bot changes his activity message in milliseconds. Don't make this less than 30000 or you WILL be ratelimited all the time, trust me.
	activity_interval: 60000,

	// The frequency of saving server settings in it's json file in milliseconds. You can set this lower than 60000, but realistically, you only need to save once every few minutes.
	save_interval: 60000,

	// Determines whether the bot should complain if the prefix was triggered, but no valid command or color was found. Useful if your prefix is ambiguous.
	reply_on_invalid: true,

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
		pitch_black: 'changing your color to pitch black is disabled because Discord sees the color #000000 as the default color - this would cause lots of problems!',

		// music related replies
		not_in_voice: 'You\'re not connected to a voice channel! ;w;',
		nothing_to_play: 'What am I supposed to play..? ; w;',
		malformed_url: 'Sorry, I couldn\'t understand the link you sent me...',
		ytdl_error: 'Sorry, something went wrong... Maybe try again later? ; w;',
		added_to_queue: '📝 Added \"$title\" to the queue!',
		now_playing: '💽 Now playing \"$title\" in $voiceChannel',
		song_skipped: '⏭️ Skipped',
		song_voteskipped: '⏭️ Vote to skip has passed',
		skip_failed_not_in_channel: 'You\'re not connected to the current voice channel! ; w;',
		skip_vote_progress: '☝️ Vote to skip in progress. Votes: $progress',
		nothing_to_skip: 'There\'s nothing to skip! ; w;',
		queue_is_empty: 'The queue is empty... ;w;',
		queue_end: '// No further songs! //',
		remove_invalid_number: 'Hey, that\'s not a valid queue entry! ;w;',
		remove_queuepos_use_skip_instead: 'You can\'t remove the current playing song. Use skip instead!',
		remove_no_permission: 'You can\'t remove this entry - only the entree or an admin can remove this entry! ;w;',
		remove_successful: 'Removed $removed from the queue.',
		loop_enabled_single: '🔂 Looping of single track enabled',
		loop_enabled_queue: '🔁 Looping queue enabled',
		loop_disabled: '🛑 Looping disabled',
		lookup_yt_start: '🔍 Searching for $searchTerm on YouTube...',
		lookup_yt_error: 'Sorry, something went wrong while talking to YouTube\'s API... ;^;',
		youtube_playlist_searchStart: '🔍 Looking up the YouTube playlist with ID $playlistID...',
		youtube_playlist_failed: 'Sorry, I couldn\'t look up your playlist...',
		no_yotube_playlist_entries_found: 'Sorry, but it seems like your playlist is either empty, or something went wrong while I requested the data...',
		youtube_playlist_startedQueueing: 'Found $amount songs in your playlist. Starting to enqueue... (This might take a while.)',
		youtube_playlist_finished: 'Finished processing playlist and added $amount songs to the queue!',
		disconnect_areyousure: 'Are you sure? This will remove $amount entries from the queue and stop playback immediately!',
		disconnect_timedout: 'Disconnect/clear request has timed out.',
		disconnect_confirm: 'See you soon ; w;',
		disconnect_not_in_channel: 'You\'re not connected to the current voice channel! ; w;',
		disconnect_too_many_users: 'I won\'t listen to a disconnect while there\'s more than one person listening... vwv',
		caught_disconnect_with_entries_in_queue: 'Hey, i\'ve been disconnected and I still got work to do! ;w; If you want me to leave, use the disconnect command...',
		remote_file_http_err: 'Something went wrong while requesting this file (code $errCode)... I\'m sorry ;w;',
		shuffle_queue_pos_threshold: 'Sorry, I won\'t shuffle the entire playlist if too many songs have already been played in the current queue ($maxTracks) to prevent people from abusing this to get their entry to play first! ;w;',
		shuffle_not_in_channel: 'You\'re not connected to the current voice channel! ; w;',
		shuffle_all_success: '🎲 Queue has been shuffled! Restarting queue...',
		shuffle_nothing_left: 'There\'s nothing left to shuffle... ;w;', 
		shuffle_success: '🎲 $amount entries have been shuffled!',
	},

	// Roles that have any of these permissions are banned from being changed by this bot to avoid changing administrative colors.
	// If you need to add or remove permissions, check here: https://discord.js.org/#/docs/main/stable/class/Permissions?scrollTo=s-FLAGS
	permission_blacklist: [	
		'ADMINISTRATOR',
		'KICK_MEMBERS',
		'MANAGE_CHANNELS'
	],
	// Set these to yourself to allow access to the super sekrit commands owo
	bot_admin_ids: ["178470784984023040"],
};