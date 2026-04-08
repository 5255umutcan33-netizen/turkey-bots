const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('lock')
        .setDescription('🔒 Bulunduğunuz kanalı mesaj gönderimine kapatır.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    async execute(interaction) {
        // @everyone rolünün mesaj atma yetkisini kapatıyoruz
        await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
            SendMessages: false
        });

        // 💎 PREMİUM FORMAT EKRANI
        const embed = new EmbedBuilder()
            .setTitle('🔒 Ryphera OS | Kanal Kilitlendi / Locked')
            .setColor('#ED4245')
            .setDescription(
                `⚙️ **İşlem / Action -->** \`Kanal Kilitleme (Lock)\`\n` +
                `✅ **Durum / Status -->** \`Mesaj Gönderimine Kapatıldı (Locked)\`\n` +
                `📍 **Kanal / Channel -->** <#${interaction.channelId}>\n` +
                `👮 **Yetkili / Mod -->** <@${interaction.user.id}>\n` +
                `📅 **Zaman / Time -->** <t:${Math.floor(Date.now() / 1000)}:f>\n\n` +
                `⚠️ **Not / Note!! BU KANAL GEÇİCİ OLARAK SOHBETE KAPATILMIŞTIR / THIS CHANNEL IS TEMPORARILY LOCKED**`
            )
            .setFooter({ text: 'Ryphera OS Moderation' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};