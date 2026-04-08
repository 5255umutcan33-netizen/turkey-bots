const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unlock')
        .setDescription('🔓 Bulunduğunuz kanalın mesaj gönderim kilidini açar.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    async execute(interaction) {
        // @everyone rolünün yetkisini normale (varsayılana) döndürüyoruz
        await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
            SendMessages: null
        });

        // 💎 PREMİUM FORMAT EKRANI
        const embed = new EmbedBuilder()
            .setTitle('🔓 Ryphera OS | Kanal Kilidi Açıldı / Unlocked')
            .setColor('#57F287')
            .setDescription(
                `⚙️ **İşlem / Action -->** \`Kanal Kilidini Açma (Unlock)\`\n` +
                `✅ **Durum / Status -->** \`Mesaj Gönderimi Aktif (Unlocked)\`\n` +
                `📍 **Kanal / Channel -->** <#${interaction.channelId}>\n` +
                `👮 **Yetkili / Mod -->** <@${interaction.user.id}>\n` +
                `📅 **Zaman / Time -->** <t:${Math.floor(Date.now() / 1000)}:f>\n\n` +
                `✨ **Not / Note!! BU KANAL TEKRAR SOHBETE AÇILMIŞTIR / THIS CHANNEL IS NOW OPEN FOR CHAT**`
            )
            .setFooter({ text: 'Ryphera OS Moderation' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};