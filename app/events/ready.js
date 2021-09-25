const { User } = require('../db/models');
const { Collection, OAuth2Guild } = require('discord.js');

module.exports = {
    name: 'ready',
    once: true,
    async execute(client) {
        // fetching guilds returns Collection of OAuth2Guilds which don't contain members
        let oauth2Guilds = await client.guilds.fetch({ force: true });

        // oauth2guild can fetch the full Guild object, then fetch all users in the guild and populate the database
        oauth2Guilds.forEach(pg => pg.fetch()
            .then(g => g.members.fetch({ force: true }))
            .then(members => {
                members.filter(m => !m.user.bot).forEach(member => {
                    populateDB(member.user, member.guild).then();
                });
            }));

        console.log(`Ready! Logged in as ${client.user.tag}`);
    },
};

function populateDB(user, guild) {
    return User.findOrCreate({
        where: { username: user.tag, guild: guild.id }
    });
}
