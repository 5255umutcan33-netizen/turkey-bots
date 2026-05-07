const { Events } = require('discord.js');

module.exports = {
    name: Events.MessageCreate,
    async execute(message, client) {
        if (message.author.bot) return;

        // VERDİĞİN ID'LER: TR VE ENG ABONE SS KANALLARI
        const SS_KANALLARI = ['1500594950839075088', '1500588822994358282'];

        if (SS_KANALLARI.includes(message.channel.id)) {
            
            // 1. DURUM: FOTOĞRAF VAR MI?
            if (message.attachments.size > 0) {
                const ROL_ABONE = '1500587633649127445';
                const ROL_UNVERIFIED = '1500249403443908711';

                // Rolü ver, eskisini al
                await message.member.roles.add(ROL_ABONE).catch(() => {});
                await message.member.roles.remove(ROL_UNVERIFIED).catch(() => {});

                // Kullanıcıya bilgi ver (5 saniye sonra silinir)
                const ok = await message.channel.send(`✅ <@${message.author.id}> Abone rolün verildi!`);
                
                // KANALI TEMİZLE: Hem atılan SS'i hem botun mesajını siler
                setTimeout(() => {
                    message.delete().catch(() => {});
                    ok.delete().catch(() => {});
                }, 3000); 

                return;
            }

            // 2. DURUM: FOTOĞRAF YOKSA (SADECE YAZI YAZDIYSA)
            if (message.attachments.size === 0) {
                await message.delete().catch(() => {});
                const warn = await message.channel.send(`⚠️ <@${message.author.id}> Sadece fotoğraf gönderebilirsin!`);
                setTimeout(() => warn.delete().catch(() => {}), 4000);
            }
            return;
        }

        // =========================================================================
        // NORMAL KOMUTLAR (!yardım vs.)
        // =========================================================================
        const prefix = '!';
        if (!message.content.startsWith(prefix)) return;
        const args = message.content.slice(prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();
        const command = client.commands?.get(commandName);
        if (command) command.execute(message, args, client);
    }
};