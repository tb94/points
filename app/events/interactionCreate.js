const { User } = require("../db/models");

module.exports = {
    name: 'interactionCreate',
    async execute(interaction) {
        if (interaction.user.bot) return;

        User.findCreateFind({ where: { username: interaction.user.tag, guild: interaction.guild.id } });

        switch (true) {
            case interaction.isCommand():
                const command = interaction.client.commands.get(interaction.commandName);

                if (!command) return;

                try {
                    // this should take a user object
                    await command.execute(interaction);
                } catch (err) {
                    console.error(err);
                    await interaction.reply({ content: `There was an error executing command: ${command.name}`, ephemeral: true });
                }
                break;
            case interaction.isButton():
                break;
            case interaction.isSelectMenu():
            default:
                console.log(interaction);
                await interaction.reply({ content: "Can't do that yet!", ephemeral: true });
                break;
        }
    }
};