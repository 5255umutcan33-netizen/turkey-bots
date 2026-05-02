const { Events } = require('discord.js');

module.exports = {
    name: Events.InteractionCreate,
    // BAŞINDAKİ 'async' KELİMESİ ÇOK KRİTİK!
    async execute(interaction) {
        // GÜNCEL ID'LER
        const trRole = "1500268780037607544";
        const enRole = "1500268646545756392";
        const logChannelId = "1500269916304052364";

        if (interaction.isButton()) {
            const logChannel = interaction.guild.channels.cache.get(logChannelId);

            try {
                // TÜRKÇE BUTONU
                if (interaction.customId === 'verify_tr') {
                    // 'rols' değil 'roles' olmalı!
                    await interaction.member.roles.add(trRole);
                    if (interaction.member.roles.cache.has(enRole)) {
                        await interaction.member.roles.remove(enRole);
                    }
                    
                    if (logChannel) logChannel.send(`✅ **${interaction.user.tag}** Türkçe doğrulandı. 🇹🇷`);
                    return interaction.reply({ content: 'Başarıyla doğrulandın!', ephemeral: true });
                }

                // ENGLISH BUTTON
                if (interaction.customId === 'verify_en') {
                    await interaction.member.roles.add(enRole);
                    if (interaction.member.roles.cache.has(trRole)) {
                        await interaction.member.roles.remove(trRole);
                    }
                    
                    if (logChannel) logChannel.send(`✅ **${interaction.user.tag}** English verified. 🇬🇧`);
                    return interaction.reply({ content: 'Successfully verified!', ephemeral: true });
                }
            } catch (error) {
                console.error("Yetki Hatası:", error);
                return interaction.reply({ 
                    content: '❌ Rol verilirken bir hata oluştu! Botun rolü yukarıda mı ve yetkisi var mı kontrol edin.', 
                    ephemeral: true 
                });
            }
        }

        // SLASH KOMUTLARI İÇİN MANTIK (Botun diğer komutları çalışsın diye)
        if (interaction.isChatInputCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);
            if (!command) return;
            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(error);
                await interaction.reply({ content: 'Komut çalıştırılırken bir hata oluştu!', ephemeral: true });
            }
        }
    },
};