const fs = require('fs');
const { Client, Collection, Intents } = require('discord.js');
const { token } = require('./config/config.json');
const sequelize = require('./db/models').sequelize;

// Keep DB in sync
sequelize.sync({ force: true });

// Create a new client instance
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MEMBERS] });

// Events handlers
const events = fs.readdirSync('./events').filter(f => f.endsWith('.js'));

for (const e of events) {
	const event = require(`./events/${e}`);

	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args));
	} else {
		client.on(event.name, (...args) => event.execute(...args));
	}

	console.log(`Registered event: ${event.name}`);
}

// Command handlers
client.commands = new Collection();
const commands = fs.readdirSync('./commands').filter(f => f.endsWith('.js'));

for (const c of commands) { 
	const command = require(`./commands/${c}`);
	client.commands.set(command.data.name, command);
	console.log(`Registered command: ${command.data.name}`)
}

// Login to Discord with your client's token
client.login(token);