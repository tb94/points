// Require the necessary discord.js classes
const fs = require('fs');
const { Client, Collection, Intents } = require('discord.js');
const { token } = require('./config.json');

// Create a new client instance
const client = new Client({ intents: [Intents.FLAGS.GUILDS] });
currency = new Collection();

// Helper methods
Reflect.defineProperty(currency, 'add', {
	/* eslint-disable-next-line func-name-matching */
	value: async function add(id, amount) {
		const user = currency.get(id);
		if (user) {
			user.balance += Number(amount);
			return user.save();
		}
		const newUser = await Users.create({ user_id: id, balance: amount });
		currency.set(id, newUser);
		return newUser;
	},
});

Reflect.defineProperty(currency, 'getBalance', {
	/* eslint-disable-next-line func-name-matching */
	value: function getBalance(id) {
		const user = currency.get(id);
		return user ? user.balance : 0;
	},
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

// Login to Discord with your client's token
client.login(token);
