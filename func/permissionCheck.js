const config = require('../config.js');

module.exports = function permissionCheck(msg, checkFor){
	// Bot admins should always have access to all commands.
	if (config.bot_admin_ids.includes(msg.author.id)) return true;
	// checkFor
	switch (checkFor) {
		case "botAdmin":
			return false; // This check has already been performed. It's just here for reasons
		case "serverAdmin":
			return msg.member.hasPermission('ADMINISTRATOR');
		case "serverManager": // This uses the roles set in the config!
			for (let i = 0; i < config.permission_blacklist.length; i++){
				if (msg.member.hasPermission(config.permission_blacklist[i])) return true;
			}
			return false;
	}
	return false;
};