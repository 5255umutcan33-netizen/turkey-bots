const { Events } = require('discord.js');
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
        // TR ve EN Abone SS kanalları
        const ABONE_KANALLARI = ['1500594950839075088', '1500588822994358282']; 
        
        if (ABONE_KANALLARI.includes(message.channel.id)) {
            // Hangi kanalda olduğumuza göre (TR mi EN mi) uyarı dili seçelim
            const isTR = message.channel.id === '1500594950839075088';

            // Adam yazı yazdıysa sil ve uyar
            if (message.attachments.size === 0) {
                await message.delete().catch(() => {});
                const warnTxt = isTR 
                    ? `⚠️ <@${message.author.id}> Lütfen buraya sadece Youtube Abone Ekran Görüntüsünü (SS) gönderin! Yazı yazmak yasaktır.` 
                    : `⚠️ <@${message.author.id}> Please only send your YouTube Subscription Screenshot (SS) here! Texting is forbidden.`;
                const warnMsg = await message.channel.send(warnTxt);
                setTimeout(() => warnMsg.delete().catch(() => {}), 5000);
                return;
            }

            const attachment = message.attachments.first();
            if (!attachment.contentType.startsWith('image/')) return;

            const waitTxt = isTR ? `🔄 <@${message.author.id}> Görseliniz yapay zeka tarafından inceleniyor, lütfen bekleyin...` : `🔄 <@${message.author.id}> Your image is being reviewed by AI, please wait...`;
            const msgToEdit = await message.channel.send(waitTxt);
            
            try {
                // Görseli indirip base64 formatına çeviriyoruz
                const response = await fetch(attachment.url);
                const arrayBuffer = await response.arrayBuffer();
                const base64 = Buffer.from(arrayBuffer).toString('base64');

                // Güncel Gemini 3 modelini çağırıyoruz
                const model = genAI.getGenerativeModel({ model: "gemini-3-flash" }); 
                
                const prompt = "Bu görseldeki yazıları oku. İçinde 'LuawareScrpt' veya '@LuawareScrpt' kelimesi geçiyor mu? SADECE 'EVET' veya 'HAYIR' olarak cevap ver.";
                
                const imagePart = {
                    inlineData: {
                        data: base64,
                        mimeType: attachment.contentType
                    }
                };

                const result = await model.generateContent([prompt, imagePart]);
                const text = result.response.text().trim().toUpperCase();

                await message.delete().catch(() => {}); 
                await msgToEdit.delete().catch(() => {}); 

                // Eğer fotoğrafta yazıyı bulduysa:
                if (text.includes("EVET")) {
                    const ABONE_ROLU = '1500587633649127445';
                    const UNVERIFIED_ROLU = '1500249403443908711';
                    
                    await message.member.roles.add(ABONE_ROLU).catch(() => {});
                    await message.member.roles.remove(UNVERIFIED_ROLU).catch(() => {});
                    
                    await message.channel.permissionOverwrites.edit(message.author.id, { ViewChannel: false }).catch(() => {});

                    const succTxt = isTR 
                        ? "🎉 **Tebrikler!** Yapay zeka Abone SS'inizi onayladı. Abone rolünüz verildi ve Key alma kanalına erişiminiz açıldı!"
                        : "🎉 **Congratulations!** The AI approved your Sub SS. Your Subscriber role has been given and you now have access to the Key channel!";
                    await message.author.send(succTxt).catch(() => {});
                } else {
                    // Bulamadıysa:
                    const failTxt = isTR
                        ? "❌ **SS Onaylanmadı!** Gönderdiğiniz görselde `@LuawareScrpt` yazısı bulunamadı veya kırpılmış bir fotoğraf attınız. Lütfen abone olduğunuzu gösteren tam bir ekran görüntüsü atın."
                        : "❌ **SS Not Approved!** The text `@LuawareScrpt` was not found in your image, or it was cropped. Please send a full screenshot showing your subscription.";
                    await message.author.send(failTxt).catch(() => {});
                }
            } catch (error) {
                console.error("Görsel Okuma Hatası:", error);
                const errTxt = isTR ? "⚠️ Yapay zeka görseli okurken anlık bir hata yaşadı. Lütfen SS'i tekrar gönderin." : "⚠️ The AI encountered an error while reading the image. Please send the SS again.";
                await msgToEdit.edit(errTxt).catch(() => {});
            }
            return; 
        }

        // =========================================================================
        // 2. YAPAY ZEKA TICKET (BİLET) ASİSTANI
        // =========================================================================
        if (message.channel.name.startsWith('🎫-')) {
            if (!message.content || message.content.trim() === '') return;

            await message.channel.sendTyping();

            try {
                // Güncel Gemini 3 modelini çağırıyoruz
                const model = genAI.getGenerativeModel({ model: "gemini-3-flash" });
                
                const prompt = `
                Sen LUAWARE OS adlı profesyonel bir Discord sunucusunun resmi yapay zeka destek asistanısın. Adın "LUAWARE AI".
                Görevin, ticket açan kullanıcılara her konuda yardımcı olmak ve onlarla etkileşime girmek.

                Kurallar:
                1. Sen bir insansın gibi davranma, LUAWARE yapay zekası olduğunu belirt.
                2. Kullanıcılar sana ne sorarsa sorsun hiçbir kısıtlama olmadan hepsine yardımcı ol. 
                3. Kullanıcı "Key nasıl alınır?" diye sorarsa: "YouTube kanalımıza abone olup ekran görüntüsünü (SS) Abone Onay kanalına atmalısınız. Sistemimiz fotoğrafı otomatik okuyup rolünüzü verecektir." de.
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
                await message.reply("⚠️ *Sistemde anlık bir yoğunluk var veya API anahtarı geçersiz, yetkililerimiz en kısa sürede sizinle ilgilenecektir.*");
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