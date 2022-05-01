const { User, Blackjack, sequelize, Op } = require('../db/models');
const { Collection, OAuth2Guild } = require('discord.js');
const { BlackjackGame } = require('../games/blackjack');

module.exports = {
    name: 'ready',
    once: true,
    async execute(client) {
        // fetching guilds returns Collection of OAuth2Guilds which don't contain members
        // let oauth2Guilds = await client.guilds.fetch({ force: true });

        // oauth2guild can fetch the full Guild object, then fetch all users in the guild and populate the database
        // oauth2Guilds.forEach(pg => pg.fetch()
        //     .then(g => g.members.fetch({ force: true }))
        //     .then(members => {
        //         return Promise.all(members.filter(m => !m.user.bot).map(async (member) => {
        //             return User.findCreateFind({
        //                 where: { username: member.user.tag, guild: member.guild.id, balance: 1000 }
        //             });
        //         }));
        //     })
        //     .then(() => console.log("Database populated"))
        //     .catch(err => console.error(err)));

        // await oauth2Guilds.forEach(pg => pg.fetch()
        // .then(g => g.members.fetch({ force: true }))
        // .then(members => {
        //     return Promise.all(members.filter(m => m.user.bot).map(async (member) => {
        //         return User.destroy({
        //             where: { username: member.user.tag, guild: member.guild.id }
        //         });
        //     }));
        // }));

        client.user.setPresence({ activities: [{ name: 'Keeping score', type: 'CUSTOM' }]});
        await Blackjack.afterCreate(async (table, options) => new BlackjackGame(table, client))
        console.log(`Ready! Logged in as ${client.user.tag}`);
    },
};
