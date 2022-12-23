const { Events } = require('discord.js');
const { User } = require('../db/models');

module.exports = {
    name: Events.UserUpdate,
    async execute(oldUser, newUser) {
        if (oldUser.bot || newUser.bot) return;
        User.update({ username: newUser.tag }, { where: { snowflake: oldUser.id } });
    }
}