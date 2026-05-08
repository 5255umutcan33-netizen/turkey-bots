const { Events, EmbedBuilder } = require('discord.js');
const Tesseract = require('tesseract.js');
const fs = require('fs');
const path = require('path');

// --- VERİTABANI VE HAFIZA AYARLARI ---
const dbPath = path.join(__dirname, '../spam-db.json');
const spamMap = new Map();

module.exports = {
    name: Events.MessageCreate,
    async execute(message, client) {
        // Botları ve Özel Mesajları (DM) Devre Dışı Bırak
        if (message.author.bot || !message.guild) return;

        // --- BÖLÜM 1: LUAWARE GUARD (GÜVENLİK KALKANI) ---
        
        // Yönetici yetkisi olanları kalkanlardan muaf tut
        if (!message.member.permissions.has('Administrator')) {

            // 1. GLOBAL ANTİ-LİNK (REKLAM ENGELLEME)
            const linkRegex = /(https?:\/\/)?(www\.)?(discord\.(gg|io|me|li)|discordapp\.com\/invite|discord\.com\/invite)\/.+[a-z]/g;
            if (linkRegex.test(message.content)) {
                if (message.deletable) await message.delete().catch(() => {});
                const warnLink = await message.channel.send(`🛡️ **LUAWARE Guard:** <@${message.author.id}>, bu sunucuda reklam yapmak kesinlikle yasaktır!`);
                setTimeout(() => warnLink.delete().catch(() => {}), 5000);
                return;
            }

            // 2. GLOBAL MENTİON SPAM (ETİKET KORUMASI)
            // Bir mesajda 5'ten fazla kullanıcıyı etiketleyenleri susturur.
            if (message.mentions.users.size > 5) {
                if (message.deletable) await message.delete().catch(() => {});
                await message.member.timeout(10 * 60 * 1000, 'LUAWARE: Çoklu etiket spamı.').catch(() => {});
                return message.channel.send(`🛡️ **LUAWARE Guard:** <@${message.author.id}>, çok fazla kişiyi etiketlediğin için **10 dakika** susturuldun!`);
            }

            // 3. KANAL BAZLI KORUMALAR (SPAM & EVERYONE)
            if (!fs.existsSync(dbPath)) fs.writeFileSync(dbPath, JSON.stringify([]));
            const protectedChannels = JSON.parse(fs.readFileSync(dbPath));

            if (protectedChannels.includes(message.channel.id)) {
                const timeoutDuration = 5 * 60 * 1000; // 5 Dakika (300.000 ms)
                const now = Date.now();

                // @everyone & @here Koruması
                if (message.mentions.everyone) {
                    if (message.deletable) await message.delete().catch(() => {});
                    await message.member.timeout(timeoutDuration, 'LUAWARE: İzinsiz everyone kullanımı.').catch(() => {});
                    const m = await message.channel.send(`🛡️ <@${message.author.id}>, LUAWARE Guard kalkanına çarptın! \`@everyone\` yasak olduğu için **5 dakika** susturuldun.`);
                    setTimeout(() => m.delete().catch(() => {}), 5000);
                    return;
                }

                // Hızlı Mesaj (Spam/Flood) Koruması
                if (!spamMap.has(message.author.id)) {
                    spamMap.set(message.author.id, []);
                }
                
                const userMessages = spamMap.get(message.author.id);
                userMessages.push(now);

                // Sadece son 5 saniyeyi kontrol et
                const recentMessages = userMessages.filter(time => now - time < 5000);
                spamMap.set(message.author.id, recentMessages);

                if (recentMessages.length >= 5) {
                    if (message.deletable) await message.delete().catch(() => {});
                    await message.member.timeout(timeoutDuration, 'LUAWARE: Spam/Flood yapıldı.').catch(() => {});
                    spamMap.delete(message.author.id); // Susturulduğu için hafızayı temizle
                    
                    const m = await message.channel.send(`🛡️ <@${message.author.id}>, LUAWARE Guard kalkanına çarptın! \`Spam\` yaptığın için **5 dakika** susturuldun.`);
                    setTimeout(() => m.delete().catch(() => {}), 5000);
                    return;
                }
            }
        }

        // --- BÖLÜM 2: LUAWARE ABONE & OCR SİSTEMİ ---

        const TR_CHANNEL = '1500594950839075088';
        const EN_CHANNEL = '1500588822994358282';
        const LOG_CHANNEL_ID = '1500587963338326228';
        
        const isTR = message.channel.id === TR_CHANNEL;
        const isEN = message.channel.id === EN_CHANNEL;

        if (isTR || isEN) {
            // Sadece Fotoğraf Şartı
            if (message.attachments.size === 0) {
                if (message.deletable) await message.delete().catch(() => {});
                const warnMsg = isTR ? "⚠️ Sadece fotoğraf gönderilebilir!" : "⚠️ Only photos allowed!";
                const warn = await message.channel.send(`<@${message.author.id}> ${warnMsg}`);
                return setTimeout(() => warn.delete().catch(() => {}), 3000);
            }

            const attachment = message.attachments.first();
            if (!attachment.contentType?.startsWith('image/')) return;

            const statusMsg = await message.channel.send(isTR ? "🔄 LUAWARE OS: Görsel inceleniyor..." : "🔄 LUAWARE OS: Scanning image...");

            try {
                // Görseli İşle
                const response = await fetch(attachment.url);
                const arrayBuffer = await response.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);

                const { data: { text } } = await Tesseract.recognize(buffer, 'eng', { logger: () => {} });

                const cleanedText = text.toLowerCase().replace(/[^a-z0-9]/g, '');
                const target = "luawarescrpt"; 
                const logChannel = client.channels.cache.get(LOG_CHANNEL_ID);

                if (cleanedText.includes(target)) {
                    // ✅ BAŞARILI ONAY
                    const ROL_ABONE = '1500587633649127445';
                    const ROL_UNVERIFIED = '1500249403443908711';

                    const member = await message.guild.members.fetch(message.author.id);
                    await member.roles.add(ROL_ABONE).catch(() => {});
                    await member.roles.remove(ROL_UNVERIFIED).catch(() => {});

                    const ok = await message.channel.send(isTR ? `✅ <@${message.author.id}> LUAWARE Abone rolün başarıyla verildi!` : `✅ <@${message.author.id}> Role granted successfully!`);
                    
                    // Özel Mesaj (DM) Gönderimi
                    await message.author.send(isTR ? "🎉 Tebrikler! Ekran görüntün onaylandı ve LUAWARE rolün verildi." : "🎉 Congrats! Your screenshot was approved and role granted.").catch(() => {});

                    if (logChannel) {
                        const embed = new EmbedBuilder()
                            .setTitle('✅ LUAWARE: SİSTEM ONAYI')
                            .setColor('#00FF00')
                            .addFields(
                                { name: 'Kullanıcı', value: `${message.author.tag}`, inline: true },
                                { name: 'ID', value: `${message.author.id}`, inline: true },
                                { name: 'Durum', value: 'Onaylandı', inline: true }
                            )
                            .setImage(attachment.url)
                            .setTimestamp()
                            .setFooter({ text: 'LUAWARE Log System' });
                        logChannel.send({ embeds: [embed] }).catch(() => {});
                    }

                    setTimeout(async () => {
                        if (message.deletable) await message.delete().catch(() => {});
                        await statusMsg.delete().catch(() => {});
                        await ok.delete().catch(() => {});
                    }, 2500);

                } else {
                    // ❌ GEÇERSİZ GÖRSEL
                    const no = await message.channel.send(isTR ? `❌ <@${message.author.id}> Geçersiz görsel! "luawarescrpt" yazısı bulunamadı.` : `❌ <@${message.author.id}> Invalid image! target not found.`);
                    
                    await message.author.send(isTR ? "❌ Gönderdiğiniz görsel sistem kriterlerine uymuyor." : "❌ Your image does not meet the criteria.").catch(() => {});

                    if (logChannel) {
                        const embed = new EmbedBuilder()
                            .setTitle('❌ LUAWARE: SİSTEM REDDİ')
                            .setColor('#FF0000')
                            .addFields(
                                { name: 'Kullanıcı', value: `${message.author.tag}`, inline: true },
                                { name: 'Sebep', value: 'Hatalı Yazı/Görsel', inline: true }
                            )
                            .setImage(attachment.url)
                            .setTimestamp();
                        logChannel.send({ embeds: [embed] }).catch(() => {});
                    }

                    setTimeout(async () => {
                        if (message.deletable) await message.delete().catch(() => {});
                        await statusMsg.delete().catch(() => {});
                        await no.delete().catch(() => {});
                    }, 2500);
                }

            } catch (err) {
                console.error("Tarama Hatası:", err);
                await statusMsg.edit("⚠️ Sistemsel bir hata oluştu, lütfen tekrar deneyin.").catch(() => {});
            }
            return;
        }

        // --- BÖLÜM 3: PREFIX KOMUT SİSTEMİ ---
        const prefix = '!';
        if (!message.content.startsWith(prefix)) return;

        const args = message.content.slice(prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();
        
        const command = client.commands?.get(commandName);
        if (command) {
            try {
                await command.execute(message, args, client);
            } catch (error) {
                console.error(error);
            }
        }
    }
};