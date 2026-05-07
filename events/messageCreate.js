const { Events } = require('discord.js');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// YENİ ALDIĞIN GİZLİ API ANAHTARINI BURAYA YAPIŞTIR
const genAI = new GoogleGenerativeAI('AIzaSyCwt6L0otY_MXPEXr3VK0f4gZwHT8zNodY');

module.exports = {
    name: Events.MessageCreate,
    async execute(message, client) {
        // Kural 1: Bot kendi kendine veya başka botlara cevap vermesin
        if (message.author.bot) return;

        // --- YAPAY ZEKA TICKET DESTEK SİSTEMİ ---
        // Eğer mesaj yazılan kanal bir ticket kanalıysa (Adı 🎫- ile başlıyorsa) yapay zeka devreye girer
        if (message.channel.name.startsWith('🎫-')) {
            await message.channel.sendTyping();

            try {
                const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
                const prompt = `
                Sen LUAWARE OS adlı profesyonel bir Discord sunucusunun resmi yapay zeka destek asistanısın. Adın "LUAWARE AI".
                Görevin, ticket açan kullanıcılara saygılı, kısa, net ve çözüm odaklı yardımcı olmak. 
                
                Kurallar:
                1. Sen bir insansın gibi davranma, LUAWARE yapay zekası olduğunu belirt.
                2. Sadece Roblox, script, exploit (Solara, Wave, Celery vb.) ve Key (Anahtar) sistemi hakkında yardım et. Başka konulardan başlarlarsa konuyu kibarca LUAWARE'e getir.
                3. Kullanıcı "Key nasıl alınır?" diye sorarsa: "YouTube kanalımıza abone olup SS alarak Abone Onay kanalına atmalısınız. Ardından Get Key kanalından key üretebilirsiniz." de.
                4. Kullanıcı hata alıyorsa virüs programını kapatmasını veya exploit'i yönetici olarak çalıştırmasını öner.
                5. Cevapların çok uzun olmasın, Discord mesajına uygun kısa ve şık olsun.
                
                Kullanıcının mesajı şudur: "${message.content}"
                `;

                const result = await model.generateContent(prompt);
                const response = await result.response;
                const text = response.text();

                await message.reply(`🤖 **[LUAWARE AI]:** ${text}`);
            } catch (error) {
                console.error("Yapay Zeka Hatası:", error);
                await message.reply("⚠️ *Sistemde anlık bir yoğunluk var, yetkililerimiz en kısa sürede sizinle ilgilenecektir.*");
            }
            return; // Yapay zeka cevap verdikten sonra aşağıdaki kodlara (eski komutlara) geçmesin diye durduruyoruz.
        }

        // --- ESKİ TİP PREFİX KOMUT SİSTEMİ (Eğer kullanıyorsan) ---
        // Eğer sunucunda hala !ping, !yardım gibi ünlemli komutlar varsa burası onların bozulmamasını sağlar.
        const prefix = '!'; // Kendi prefixin neyse onu yazabilirsin
        if (!message.content.startsWith(prefix)) return;

        const args = message.content.slice(prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();

        // Eğer eski tip prefix komut koleksiyonun varsa çalıştırır (Slash komutlar zaten interactionCreate'de çalışıyor)
        const command = client.commands?.get(commandName) || client.commands?.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
        if (!command) return;

        try {
            command.execute(message, args, client);
        } catch (error) {
            console.error(error);
        }
    }
};