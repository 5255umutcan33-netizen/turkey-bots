const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('verifykur')
        .setDescription('Sunucu girişindeki bayraklı doğrulama sistemini kurar.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        
        // 💎 KULLANICILARIN GÖRECEĞİ PREMIUM DOĞRULAMA EKRANI
        const embed = new EmbedBuilder()
            .setTitle('💎 Ryphera OS | Verification / Doğrulama')
            .setColor('#2B2D31')
            .setDescription(
                `👋 **Welcome to Ryphera OS! / Hoş Geldiniz!**\n\n` +
                `📌 **Status -->** \`🟢 Online\`\n` +
                `🌍 **Language -->** \`TR / EN\`\n` +
                `📝 **Action -->** \`Select your language to verify / Dilinizi seçerek doğrulayın.\`\n\n` +
                `━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
                `⚠️ **Note!!** By verifying, you agree to our server rules.\n` +
                `⚠️ **Not!!** Doğrulanarak sunucu kurallarımızı kabul etmiş sayılırsınız.`
            )
            .setFooter({ text: 'Ryphera OS System' });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('verify_tr')
                .setLabel('Türkçe')
                .setEmoji('🇹🇷')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('verify_en')
                .setLabel('English')
                .setEmoji('🇬🇧')
                .setStyle(ButtonStyle.Secondary)
        );

        await interaction.channel.send({ embeds: [embed], components: [row] });

        // 💎 SADECE SANA GÖRÜNECEK PREMIUM ONAY MESAJI
        const successEmbed = new EmbedBuilder()
            .setTitle('✅ Kurulum Başarılı')
            .setColor('#57F287')
            .setDescription(
                `⚙️ **İşlem -->** \`Giriş Doğrulama Sistemi Kurulumu\`\n` +
                `✅ **Durum -->** \`Sistem mermi gibi aktif edildi\`\n` +
                `📍 **Kurulan Kanal -->** <#${interaction.channelId}>\n` +
                `👮 **İşlemi Yapan -->** <@${interaction.user.id}>`
            )
            .setTimestamp();

        await interaction.reply({ embeds: [successEmbed], ephemeral: true });
    },
};