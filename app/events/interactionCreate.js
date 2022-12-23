const { Events } = require("discord.js");
const { User } = require("../db/models");

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        if (interaction.user.bot) return;

        let [user] = await User.findCreateFind({
            where: { snowflake: interaction.user.id, guild: interaction.guild.id },
            defaults: { username: interaction.user.tag }
        });

        switch (true) {
            case interaction.isCommand():
                const command = interaction.client.commands.get(interaction.commandName);

                if (!command) return;

                try {
                    await command.execute(interaction, user);
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