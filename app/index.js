const env = process.env.NODE_ENV || "development";
const fs = require('fs');
const { Client, Collection, Intents } = require('discord.js');
const { token } = require('./config/config.json')[env];
const { sequelize, User } = require('./db/models');
const { Op } = require('sequelize');

// Keep DB in sync
sequelize.sync(env === 'development' ? { force: true } : { alter: true });

// Create a new client instance
const client = new Client({
	intents: [
		Intents.FLAGS.GUILDS,
		Intents.FLAGS.GUILD_MEMBERS,
		Intents.FLAGS.GUILD_BANS,
		Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS,
		Intents.FLAGS.GUILD_INTEGRATIONS,
		Intents.FLAGS.GUILD_WEBHOOKS,
		Intents.FLAGS.GUILD_INVITES,
		Intents.FLAGS.GUILD_VOICE_STATES,
		Intents.FLAGS.GUILD_PRESENCES,
		Intents.FLAGS.GUILD_MESSAGES,
		Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
		Intents.FLAGS.GUILD_MESSAGE_TYPING,
		Intents.FLAGS.DIRECT_MESSAGES,
		Intents.FLAGS.DIRECT_MESSAGE_REACTIONS,
		Intents.FLAGS.DIRECT_MESSAGE_TYPING
	]
});

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

setInterval(() => User.findAll({ where: { voiceActivity: { [Op.not]: null } } })
	.then(users => users.forEach(u => u.increment('balance'))),
	1000 * 60);

// Login to Discord with your client's token
client.login(token);