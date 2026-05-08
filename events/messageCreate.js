const { Events, EmbedBuilder } = require('discord.js');
const Tesseract = require('tesseract.js');

module.exports = {
    name: Events.MessageCreate,
    async execute(message, client) {
        if (message.author.bot || !message.guild) return;

        const TR_CHANNEL = '1500594950839075088';
        const EN_CHANNEL = '1500588822994358282';
        const LOG_CHANNEL_ID = '1500587963338326228';
        
        const isTR = message.channel.id === TR_CHANNEL;
        const isEN = message.channel.id === EN_CHANNEL;

        if (isTR || isEN) {
            // 1. SADECE FOTOĞRAF KURALI
            if (message.attachments.size === 0) {
                await message.delete().catch(() => {});
                const warnMsg = isTR ? "⚠️ Sadece fotoğraf gönderilebilir!" : "⚠️ Only photos allowed!";
                const warn = await message.channel.send(`<@${message.author.id}> ${warnMsg}`);
                return setTimeout(() => warn.delete().catch(() => {}), 3000);
            }

            const attachment = message.attachments.first();
            if (!attachment.contentType?.startsWith('image/')) return;

            // 2. HIZLI BİLGİ MESAJI
            const statusMsg = await message.channel.send(isTR ? "🔄 İnceleniyor..." : "🔄 Reviewing...");

            try {
                // 3. FOTOĞRAFI ZORLA İNDİR (TAKILMAYI ÖNLEYEN KISIM BURASI)
                const response = await fetch(attachment.url);
                if (!response.ok) throw new Error("Resim Discord'dan çekilemedi!");
                const arrayBuffer = await response.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);

                // 4. LOKAL OCR TARAMA (BUFFER İLE HIZLI VE KESİN TARAMA)
                const { data: { text } } = await Tesseract.recognize(
                    buffer, // URL yerine indirdiğimiz saf veriyi veriyoruz
                    'eng',
                    { logger: () => {} } 
                );

                // 5. GELİŞMİŞ FİLTRELEME (Boşluk, sembol, her şeyi temizle sadece harf kalsın)
                const cleanedText = text.toLowerCase().replace(/[^a-z0-9]/g, '');
                const target = "luawarescrpt"; 

                const logChannel = client.channels.cache.get(LOG_CHANNEL_ID);

                // 6. SONUÇLARI KONTROL ET
                if (cleanedText.includes(target)) {
                    // ✅ ONAY
                    const ROL_ABONE = '1500587633649127445';
                    const ROL_UNVERIFIED = '1500249403443908711';

                    const member = await message.guild.members.fetch(message.author.id);
                    await member.roles.add(ROL_ABONE).catch(() => {});
                    await member.roles.remove(ROL_UNVERIFIED).catch(() => {});

                    const ok = await message.channel.send(isTR ? `✅ <@${message.author.id}> Abone rolün verildi!` : `✅ <@${message.author.id}> Role granted!`);
                    
                    await message.author.send(isTR ? "🎉 Onaylandınız, rolünüz verildi!" : "🎉 Approved, role granted!").catch(() => {});

                    if (logChannel) {
                        const embed = new EmbedBuilder()
                            .setTitle('✅ SİSTEM ONAYI')
                            .setColor('#00FF00')
                            .addFields(
                                { name: 'Kullanıcı', value: `${message.author.tag}`, inline: true },
                                { name: 'ID', value: `${message.author.id}`, inline: true }
                            )
                            .setImage(attachment.url)
                            .setTimestamp();
                        logChannel.send({ embeds: [embed] }).catch(() => {});
                    }

                    setTimeout(async () => {
                        await message.delete().catch(() => {});
                        await statusMsg.delete().catch(() => {});
                        await ok.delete().catch(() => {});
                    }, 2000);

                } else {
                    // ❌ RED
                    const no = await message.channel.send(isTR ? `❌ <@${message.author.id}> Geçersiz ekran görüntüsü!` : `❌ <@${message.author.id}> Invalid screenshot!`);
                    
                    await message.author.send(isTR ? "❌ Gönderdiğiniz ekran görüntüsü kriterlere uymuyor." : "❌ Your screenshot does not meet the criteria.").catch(() => {});

                    if (logChannel) {
                        const embed = new EmbedBuilder()
                            .setTitle('❌ SİSTEM REDDİ')
                            .setColor('#FF0000')
                            .addFields(
                                { name: 'Kullanıcı', value: `${message.author.tag}`, inline: true },
                                { name: 'Durum', value: 'Geçersiz Görsel', inline: true }
                            )
                            .setImage(attachment.url)
                            .setTimestamp();
                        logChannel.send({ embeds: [embed] }).catch(() => {});
                    }

                    setTimeout(async () => {
                        await message.delete().catch(() => {});
                        await statusMsg.delete().catch(() => {});
                        await no.delete().catch(() => {});
                    }, 2000);
                }

            } catch (err) {
                console.error("Tarama Hatası:", err);
                // EĞER SİSTEM YİNE DE ÇÖKERSE İNCELENİYOR MESAJI ASILI KALMASIN DİYE TEMİZLİK:
                await statusMsg.edit(isTR ? "❌ Tarama sırasında bir hata oluştu, lütfen tekrar deneyin." : "❌ An error occurred during scanning, please try again.").catch(() => {});
                setTimeout(async () => {
                    await message.delete().catch(() => {});
                    await statusMsg.delete().catch(() => {});
                }, 4000);
            }
            return;
        }

        // DİĞER KOMUTLAR
        const prefix = '!';
        if (!message.content.startsWith(prefix)) return;
        const args = message.content.slice(prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();
        const command = client.commands?.get(commandName);
        if (command) command.execute(message, args, client);
    }
};