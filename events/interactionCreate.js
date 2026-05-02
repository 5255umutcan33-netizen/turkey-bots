const { Events } = require('discord.js');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        // --- 1. BUTON ETKİLEŞİMLERİ ---
        if (interaction.isButton()) {
            const trRole = "1500268780037607544";
            const enRole = "1500268646545756392";
            const logChannelId = "1500269916304052364";

            // LUAWARE VERIFY SİSTEMİ
            if (interaction.customId === 'verify_tr' || interaction.customId === 'verify_en') {
                const logChannel = interaction.guild.channels.cache.get(logChannelId);
                try {
                    if (interaction.customId === 'verify_tr') {
                        await interaction.member.roles.add(trRole);
                        if (interaction.member.roles.cache.has(enRole)) await interaction.member.roles.remove(enRole);
                        if (logChannel) logChannel.send(`✅ **${interaction.user.tag}** Türkçe doğrulandı. 🇹🇷`);
                        return interaction.reply({ content: 'Başarıyla doğrulandın!', ephemeral: true });
                    } 
                    else {
                        await interaction.member.roles.add(enRole);
                        if (interaction.member.roles.cache.has(trRole)) await interaction.member.roles.remove(trRole);
                        if (logChannel) logChannel.send(`✅ **${interaction.user.tag}** English verified. 🇬🇧`);
                        return interaction.reply({ content: 'Successfully verified!', ephemeral: true });
                    }
                } catch (error) {
                    console.error("Verify Hatası:", error);
                    return interaction.reply({ content: '❌ Rol yetkisi hatası!', ephemeral: true });
                }
            }

            // BURASI DİĞER BUTONLAR İÇİN (Ticket, Abone vb.)
            // Eğer buton verify butonu değilse, botun diğer dosyalarındaki mantığı burada çalıştırabilirsin.
            // Genelde diğer sistemlerin butonları kendi komut dosyalarında handle edilir ama
            // eğer bir "button handler"ın varsa buraya eklemelisin.
        }

        // --- 2. SLASH KOMUTLARI ( /komutlar ) ---
        if (interaction.isChatInputCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);
            if (!command) return;

            try {
                await command.execute(interaction);
            } catch (error) {
                console.error("Komut Hatası:", error);
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ content: 'Komut çalışırken hata oluştu!', ephemeral: true });
                } else {
                    await interaction.reply({ content: 'Komut çalışırken hata oluştu!', ephemeral: true });
                }
            }
        }
    },
};