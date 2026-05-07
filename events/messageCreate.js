const { Events } = require('discord.js');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// KANKA DİKKAT: AŞAĞIDAKİ TIRNAK İŞARETLERİNİN İÇİNE KENDİ API ANAHTARINI YAPIŞTIR! TIRNAKLARI SİLME!
const genAI = new GoogleGenerativeAI('AIzaSyCwt6L0otY_MXPEXr3VK0f4gZwHT8zNodY');

module.exports = {
    name: Events.MessageCreate,
    async execute(message, client) {
        // Kural 1: Bot kendi kendine veya başka botlara cevap vermesin
        if (message.author.bot) return;

        // --- YAPAY ZEKA TICKET DESTEK SİSTEMİ ---
        // Eğer mesaj yazılan kanal bir ticket kanalıysa (Adı 🎫- ile başlıyorsa) yapay zeka devreye girer
        if (message.channel.name.startsWith('🎫-')) {
            
            // Eğer adam sadece fotoğraf attıysa ve yazı yazmadıysa bot hata vermesin diye durduruyoruz
            if (!message.content || message.content.trim() === '') return;

            // Bot "Yazıyor..." efekti göstersin
            await message.channel.sendTyping();

            try {
                // Hızlı ve ücretsiz olan Gemini 1.5 Flash modelini kullanıyoruz
                const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
                
                // SINIRSIZ MUHABBET VE LUAWARE DESTEK EMRİ (PROMPT)
                const prompt = `
                Sen LUAWARE OS adlı profesyonel bir Discord sunucusunun resmi yapay zeka destek asistanısın. Adın "LUAWARE AI".
                Görevin, ticket açan kullanıcılara her konuda yardımcı olmak ve onlarla etkileşime girmek.

                Kurallar:
                1. Sen bir insansın gibi davranma, LUAWARE yapay zekası olduğunu belirt.
                2. Kullanıcılar sana ne sorarsa sorsun (oyun, yazılım, sohbet, günlük hayattan sorular vb.) hiçbir kısıtlama olmadan hepsine yardımcı ol ve sohbet et. Konuyu sınırlandırma.
                3. Kullanıcı "Key nasıl alınır?" diye sorarsa: "YouTube kanalımıza abone olup SS alarak Abone Onay kanalına atmalısınız. Ardından Get Key kanalından key üretebilirsiniz." de.
                4. Kullanıcı hileyle ilgili hata alıyorsa virüs programını kapatmasını veya exploit'i yönetici olarak çalıştırmasını öner.
                5. Cevapların çok uzun destan gibi olmasın, Discord okuma deneyimine uygun, kısa, net ve şık olsun. Emoji kullanabilirsin.

                Kullanıcının mesajı şudur: "${message.content}"
                `;

                // Yapay zekaya soruyu sorup cevabı bekliyoruz
                const result = await model.generateContent(prompt);
                const response = await result.response;
                const text = response.text();

                // Çıkan cevabı biletin içine gönderiyoruz
                await message.reply(`🤖 **[LUAWARE AI]:** ${text}`);

            } catch (error) {
                // Eğer hata alırsak terminale kırmızı yazıyla asıl hatanın ne olduğunu yazdırsın ki sorunu görelim
                console.error("🚨 YAPAY ZEKA HATASI DETAYI:", error);
                await message.reply("⚠️ *Sistemde anlık bir yoğunluk var veya API anahtarı hatalı, yetkililerimiz en kısa sürede sizinle ilgilenecektir.*");
            }
            return; // Yapay zeka cevap verdikten sonra aşağıdaki eski komutlara geçmesini engelliyoruz.
        }

        // --- ESKİ TİP PREFİX KOMUT SİSTEMİ (Eğer kullanıyorsan) ---
        // Sunucunda hala !ping, !yardım gibi ünlemli eski komutlar varsa burası onların bozulmamasını sağlar.
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