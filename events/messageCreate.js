const { Events } = require('discord.js');
const AboneChannel = require('../models/aboneChannel'); // Senin veritabanı modelin

module.exports = {
    name: Events.MessageCreate,
    async execute(message, client) {
        if (message.author.bot || !message.guild) return;

        // 1. VERİTABANINDAN BU SUNUCU İÇİN AYARLANMIŞ KANALI ÇEK
        const channelData = await AboneChannel.findOne({ guildId: message.guild.id });
        
        // Eğer mesaj yazılan kanal, /abonekur ile ayarlanan kanalsa:
        if (channelData && message.channel.id === channelData.channelId) {
            
            // Eğer fotoğraf yoksa (sadece yazı yazdıysa)
            if (message.attachments.size === 0) {
                await message.delete().catch(() => {});
                
                const warnMsg = await message.channel.send({
                    content: `⚠️ <@${message.author.id}> Lütfen buraya sadece **Ekran Görüntüsü (SS)** gönderin! Yazı yazmak yasaktır.`
                });

                // 5 saniye sonra uyarıyı sil
                setTimeout(() => warnMsg.delete().catch(() => {}), 5000);
            }
            // Fotoğraf varsa hiçbir şey yapma, Ryphera/Kendi sistemin okusun.
            return;
        }

        // =========================================================================
        // 2. ESKİ TİP PREFİX KOMUT SİSTEMİ (!yardım vs.)
        // =========================================================================
        const prefix = '!'; 
        if (!message.content.startsWith(prefix)) return;

        const args = message.content.slice(prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();

        const command = client.commands?.get(commandName) || client.commands?.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
        if (!command) return;

        try {
            await command.execute(message, args, client);
        } catch (error) {
            console.error("Komut çalıştırılırken hata:", error);
        }
    }
};