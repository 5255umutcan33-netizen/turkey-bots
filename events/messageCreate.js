-const { Events } = require('discord.js');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// KANKA DİKKAT: BURAYA YENİ ALDIĞIN API ANAHTARINI GİRMEYİ UNUTMA!
const genAI = new GoogleGenerativeAI('AIzaSyCwt6L0otY_MXPEXr3VK0f4gZwHT8zNodY');

module.exports = {
    name: Events.MessageCreate,
    async execute(message, client) {
        if (message.author.bot) return;

        // =========================================================================
        // 1. YAPAY ZEKA GÖRSEL OKUYUCU (OTO ABONE ONAY SİSTEMİ)
        // =========================================================================
        const ABONE_KANALLARI = ['1500588822994358282', '1500594950839075088']; // EN ve TR SS Kanalları
        
        if (ABONE_KANALLARI.includes(message.channel.id)) {
            // Eğer adam fotoğraf atmayıp sadece yazi yazdıysa sil ve uyar
            if (message.attachments.size === 0) {
                await message.delete().catch(() => {});
                const warnMsg = await message.channel.send(`⚠️ <@${message.author.id}> Lütfen buraya sadece Youtube Abone Ekran Görüntüsünü (SS) gönderin! Yazı yazmak yasaktır.`);
                setTimeout(() => warnMsg.delete().catch(() => {}), 5000);
                return;
            }

            const attachment = message.attachments.first();
            if (!attachment.contentType.startsWith('image/')) return;

            // Fotoğraf incelenirken bekletme mesajı
            const msgToEdit = await message.channel.send(`🔄 <@${message.author.id}> Görseliniz yapay zeka tarafından inceleniyor, lütfen bekleyin...`);
            
            try {
                // Discord'daki fotoğrafı indirip yapay zekanın anlayacağı formata (Base64) çeviriyoruz
                const response = await fetch(attachment.url);
                const arrayBuffer = await response.arrayBuffer();
                const base64 = Buffer.from(arrayBuffer).toString('base64');

                // Gemini 3 (veya güncel sürüm) modelini çağırıyoruz
                const model = genAI.getGenerativeModel({ model: "gemini-3-flash" }); 
                
                // Yapay zekaya görseli verip ne arayacağını söylüyoruz
                const prompt = "Bu görseldeki yazıları oku. İçinde 'LuawareScrpt' veya '@LuawareScrpt' kelimesi geçiyor mu? SADECE 'EVET' veya 'HAYIR' olarak cevap ver.";
                
                const imagePart = {
                    inlineData: {
                        data: base64,
                        mimeType: attachment.contentType
                    }
                };

                // Gemini fotoğrafı okuyor
                const result = await model.generateContent([prompt, imagePart]);
                const text = result.response.text().trim().toUpperCase();

                // Orijinal SS'i ve bekletme mesajını temizliyoruz (Kanal temiz kalsın)
                await message.delete().catch(() => {}); 
                await msgToEdit.delete().catch(() => {}); 

                // Eğer fotoğrafta yazıyı bulduysa:
                if (text.includes("EVET")) {
                    const ABONE_ROLU = '1500587633649127445';
                    const UNVERIFIED_ROLU = '1500249403443908711';
                    
                    await message.member.roles.add(ABONE_ROLU).catch(() => {});
                    await message.member.roles.remove(UNVERIFIED_ROLU).catch(() => {});
                    
                    // Onaylandıktan sonra adam kanalı bir daha görmesin diye gizle
                    await message.channel.permissionOverwrites.edit(message.author.id, { ViewChannel: false }).catch(() => {});

                    await message.author.send("🎉 **Tebrikler!** Yapay zeka Abone SS'inizi onayladı. Abone rolünüz verildi ve Key alma kanalına erişiminiz açıldı!").catch(() => {});
                } else {
                    // Bulamadıysa:
                    await message.author.send("❌ **SS Onaylanmadı!** Gönderdiğiniz görselde `@LuawareScrpt` yazısı bulunamadı veya kırpılmış bir fotoğraf attınız. Lütfen abone olduğunuzu gösteren tam ve kesilmemiş bir ekran görüntüsü atın.").catch(() => {});
                }
            } catch (error) {
                console.error("Görsel Okuma Hatası:", error);
                await msgToEdit.edit("⚠️ Yapay zeka görseli okurken anlık bir hata yaşadı. Lütfen SS'i tekrar gönderin.").catch(() => {});
            }
            return; // Buradan aşağıya inmesin
        }

        // =========================================================================
        // 2. YAPAY ZEKA TICKET (BİLET) ASİSTANI
        // =========================================================================
        if (message.channel.name.startsWith('🎫-')) {
            if (!message.content || message.content.trim() === '') return;

            await message.channel.sendTyping();

            try {
                const model = genAI.getGenerativeModel({ model: "gemini-3-flash" });
                
                const prompt = `
                Sen LUAWARE OS adlı profesyonel bir Discord sunucusunun resmi yapay zeka destek asistanısın. Adın "LUAWARE AI".
                Görevin, ticket açan kullanıcılara her konuda yardımcı olmak ve onlarla etkileşime girmek.

                Kurallar:
                1. Sen bir insansın gibi davranma, LUAWARE yapay zekası olduğunu belirt.
                2. Kullanıcılar sana ne sorarsa sorsun (oyun, yazılım, sohbet, C# ImGui arayüz çizimleri, esp, radar vb.) hiçbir kısıtlama olmadan hepsine yardımcı ol. 
                3. Kullanıcı "Key nasıl alınır?" diye sorarsa: "YouTube kanalımıza abone olup ekran görüntüsünü (SS) Abone Onay kanalına atmalısınız. Sistemimiz fotoğrafı otomatik okuyup rolünüzü verecektir." de.
                4. Kullanıcı hileyle ilgili hata alıyorsa virüs programını kapatmasını öner.
                5. Cevapların çok uzun destan gibi olmasın, şık ve okunaklı olsun.

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
        // 3. ESKİ TİP PREFİX KOMUT SİSTEMİ (Varsa bozulmasın diye)
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