const env = process.env.NODE_ENV || "development";
const fs = require('fs');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { clientId, guildId, token } = require('./config/config.json')[env];

const commands = [];
const commandFiles = fs.readdirSync('./commands')
					// .filter(f => f.endsWith('.js'));

for (const c of commandFiles) {
	const command = require(`./commands/${c}`);
	commands.push(command.data.toJSON());
}
const rest = new REST({ version: '9' }).setToken(token);

(async () => {
	try {
		await rest.put(
			env === "development" ? Routes.applicationGuildCommands(clientId, guildId) : Routes.applicationCommands(clientId),
			{ body: commands },
		);

		console.log('Successfully registered application commands.');
	} catch (error) {
		console.error(error);
	}
})();
