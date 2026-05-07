const { Events } = require('discord.js');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// ANAHTARIN KODA DİREKT GÖMÜLDÜ KANKA, DOKUNMA BURAYA
const genAI = new GoogleGenerativeAI('AIzaSyCwt6L0otY_MXPEXr3VK0f4gZwHT8zNodY');

module.exports = {
    name: Events.MessageCreate,
    async execute(message, client) {
        if (message.author.bot) return;

        // =========================================================================
        // 1. SS KANALLARI (YAPAY ZEKA İPTAL - SADECE YAZI YAZMAYI ENGELLER)
        // =========================================================================
        const ABONE_KANALLARI = ['1500594950839075088', '1500588822994358282']; 
        
        if (ABONE_KANALLARI.includes(message.channel.id)) {
            if (message.attachments.size === 0) {
                await message.delete().catch(() => {});
                
                const isTR = message.channel.id === '1500594950839075088';
                const warnTxt = isTR 
                    ? `⚠️ <@${message.author.id}> Lütfen buraya sadece Youtube Abone Ekran Görüntüsünü (SS) gönderin! Yazı yazmak yasaktır.` 
                    : `⚠️ <@${message.author.id}> Please only send your YouTube Subscription Screenshot (SS) here! Texting is forbidden.`;
                
                const warnMsg = await message.channel.send(warnTxt);
                setTimeout(() => warnMsg.delete().catch(() => {}), 5000);
            }
            return; 
        }

        // =========================================================================
        // 2. YAPAY ZEKA TICKET (BİLET) ASİSTANI (HATA VERMEYEN SÜRÜM)
        // =========================================================================
        if (message.channel.name.startsWith('🎫-')) {
            if (!message.content || message.content.trim() === '') return;

            await message.channel.sendTyping();

            try {
                // HATA VERMEYEN, EN TEMEL MODEL KULLANILDI:
                const model = genAI.getGenerativeModel({ model: "gemini-pro" });
                
                const prompt = `
                Sen LUAWARE OS adlı profesyonel bir Discord sunucusunun resmi yapay zeka destek asistanısın. Adın "LUAWARE AI".
                Görevin, ticket açan kullanıcılara her konuda yardımcı olmak ve onlarla etkileşime girmek.

                Kurallar:
                1. Sen bir insansın gibi davranma, LUAWARE yapay zekası olduğunu belirt.
                2. Kullanıcılar sana ne sorarsa sorsun hiçbir kısıtlama olmadan hepsine yardımcı ol. 
                3. Kullanıcı "Key nasıl alınır?" diye sorarsa: "YouTube kanalımıza abone olup ekran görüntüsünü (SS) Abone Onay kanalına atmalısınız." de.
                4. Kullanıcı hileyle ilgili hata alıyorsa virüs programını kapatmasını öner.
                5. Cevapların kısa, net ve şık olsun. Emoji kullan.

                Kullanıcının mesajı şudur: "${message.content}"
                `;

                const result = await model.generateContent(prompt);
                const response = await result.response;
                const text = response.text();

                await message.reply(`🤖 **[LUAWARE AI]:** ${text}`);

            } catch (error) {
                console.error("🚨 TICKET YAPAY ZEKA HATASI:", error);
                await message.reply("⚠️ *Sistemde anlık bir yoğunluk var, yetkililerimiz en kısa sürede sizinle ilgilenecektir.*");
            }
            return; 
        }

        // =========================================================================
        // 3. ESKİ TİP PREFİX KOMUT SİSTEMİ
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