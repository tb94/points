const { User } = require('../db/models');
const { Collection } = require('discord.js');

module.exports = {
    name: 'ready',
    once: true,
    async execute(client) {
        // fetching guilds returns OAuth2Guild which doesn't contain members
        let partialGuilds = await client.guilds.fetch({ force: true });
        // getting all servers was being weird (pg.forEach())
        let firstGuild = partialGuilds.first();
        let testServer = await firstGuild.fetch();
        // poppulate db with any new or missing users (not bots)
        let members = await testServer.members.fetch({ force: true });

        members.filter(m => !m.user.bot)
            .forEach(m => populateDB(m.user));

        console.log(`Ready! Logged in as ${client.user.tag}`);
    },
};

async function populateDB(user) {
    await User.findOrCreate({
        where: { username: user.tag }
    });
}
