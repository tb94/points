const { User } = require('../db/models');

module.exports = {
    name: 'userUpdate',
    async execute(oldUser, newUser) {
        if (oldUser.bot || newUser.bot) return;
        User.update({ username: newUser.tag }, { where: { snowflake: oldUser.id } });
    }
}