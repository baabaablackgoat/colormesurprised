# Color Me Surprised

A small discord bot project that was originally only intended for small servers where users can pick their own color using this bot but then escalated into a music bot and oh god why did I bring this upon myself why must I torture myself with this stuff aaaaaaAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA

## Setup
- If you haven't already, install node.js on the machine you want this to run on. Get it here: https://nodejs.org/en/
- Clone this repository.
- Run `npm install` in the cloned directory. This will fetch discord.js and all the other smaller npm packages.
- Create a Discord Bot user on the official Discord Developers website.
- To add the bot to your Discord server, modify the link below to match your bot ID. The permissions flag will automatically create a role that has "Manage Roles" enabled.
- Put your bot user token and nothing else in a new file called 'token.txt' in the root directory of the cloned bot.
- **Create a Google Service Account with YouTube API Scopes.**
- Place your Service account token file in the root directory as google_service_secret.json.
- Start the bot with `node run.js`.

`https://discordapp.com/api/oauth2/authorize?client_id=YOUR_BOT_ID_NOT_THE_TOKEN&permissions=268435456&scope=bot`
