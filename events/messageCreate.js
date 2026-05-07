const { Events } = require('discord.js');

module.exports = {
    name: Events.MessageCreate,
    async execute(message, client) {
        if (message.author.bot) return;

        // =========================================================================
        // 1. SS KANALLARI KORUMASI (SADECE YAZI YAZMAYI ENGELLER)
        // =========================================================================
        const ABONE_KANALLARI = ['1500594950839075088', '1500588822994358282']; 
        
        if (ABONE_KANALLARI.includes(message.channel.id)) {
            // Eğer adam fotoğraf eklemeden sadece düz yazı yazdıysa:
            if (message.attachments.size === 0) {
                await message.delete().catch(() => {});
                
                const isTR = message.channel.id === '1500594950839075088';
                const warnTxt = isTR 
                    ? `⚠️ <@${message.author.id}> Lütfen buraya sadece Youtube Abone Ekran Görüntüsünü (SS) gönderin! Yazı yazmak yasaktır.` 
                    : `⚠️ <@${message.author.id}> Please only send your YouTube Subscription Screenshot (SS) here! Texting is forbidden.`;
                
                const warnMsg = await message.channel.send(warnTxt);
                // 5 saniye sonra uyarı mesajını da siler ki kanal temiz kalsın
                setTimeout(() => warnMsg.delete().catch(() => {}), 5000);
            }
            return; // Adam fotoğraf attıysa hiçbir şeye karışmaz, diğer sistemlerin halleder.
        }

        // =========================================================================
        // 2. ESKİ TİP PREFİX KOMUT SİSTEMİ
        // =========================================================================
        const prefix = '!'; 
        if (!message.content.startsWith(prefix)) return;

        const args = message.content.slice(prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();

        const command = client.commands?.get(commandName) || client.commands?.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
        if (!command) return;

        try {
            command.execute(message, args, client);
        } catch (error) {
            console.error(error);
        }
    }
};