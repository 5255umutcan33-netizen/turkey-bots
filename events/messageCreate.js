const { Events, EmbedBuilder } = require('discord.js');
const Tesseract = require('tesseract.js');
const fs = require('fs');
const path = require('path');

// Veritabanı ve Spam Hafızası Ayarları
const dbPath = path.join(__dirname, '../spam-db.json');
const spamMap = new Map();

module.exports = {
    name: Events.MessageCreate,
    async execute(message, client) {
        if (message.author.bot || !message.guild) return;

        // --- BÖLÜM 1: LUAWARE GUARD SİSTEMİ (ANTİ-SPAM & EVERYONE) ---
        
        // Adminleri koruma dışı bırak (Kendi kendini banlamasın)
        if (!message.member.permissions.has('Administrator')) {
            if (!fs.existsSync(dbPath)) fs.writeFileSync(dbPath, JSON.stringify([]));
            const protectedChannels = JSON.parse(fs.readFileSync(dbPath));

            // Eğer bulunulan kanal koruma altındaysa
            if (protectedChannels.includes(message.channel.id)) {
                const timeoutDuration = 5 * 60 * 1000; // 5 Dakika
                const now = Date.now();

                // 🛑 KURAL A: @everyone veya @here atanı paketle
                if (message.mentions.everyone) {
                    await message.delete().catch(() => {});
                    await message.member.timeout(timeoutDuration, 'LUAWARE Guard: İzinsiz everyone/here kullanımı.').catch(() => {});
                    const m = await message.channel.send(`🛡️ <@${message.author.id}>, LUAWARE Guard kalkanına çarptın! \`@everyone\` yasak olduğu için **5 dakika** susturuldun.`);
                    return setTimeout(() => m.delete().catch(() => {}), 5000);
                }

                // 🛑 KURAL B: 5 Saniyede 5 Mesaj (Spam) yapanı paketle
                if (!spamMap.has(message.author.id)) spamMap.set(message.author.id, []);
                const userMessages = spamMap.get(message.author.id);
                userMessages.push(now);

                const recentMessages = userMessages.filter(time => now - time < 5000);
                spamMap.set(message.author.id, recentMessages);

                if (recentMessages.length >= 5) {
                    await message.delete().catch(() => {});
                    await message.member.timeout(timeoutDuration, 'LUAWARE Guard: Spam/Flood yapıldı.').catch(() => {});
                    spamMap.delete(message.author.id);
                    const m = await message.channel.send(`🛡️ <@${message.author.id}>, LUAWARE Guard kalkanına çarptın! \`Spam\` yaptığın için **5 dakika** susturuldun.`);
                    return setTimeout(() => m.delete().catch(() => {}), 5000);
                }
            }
        }

        // --- BÖLÜM 2: ABONE / OCR SİSTEMİ ---

        const TR_CHANNEL = '1500594950839075088';
        const EN_CHANNEL = '1500588822994358282';
        const LOG_CHANNEL_ID = '1500587963338326228';
        
        const isTR = message.channel.id === TR_CHANNEL;
        const isEN = message.channel.id === EN_CHANNEL;

        if (isTR || isEN) {
            // SADECE FOTOĞRAF KURALI
            if (message.attachments.size === 0) {
                await message.delete().catch(() => {});
                const warnMsg = isTR ? "⚠️ Sadece fotoğraf gönderilebilir!" : "⚠️ Only photos allowed!";
                const warn = await message.channel.send(`<@${message.author.id}> ${warnMsg}`);
                return setTimeout(() => warn.delete().catch(() => {}), 3000);
            }

            const attachment = message.attachments.first();
            if (!attachment.contentType?.startsWith('image/')) return;

            const statusMsg = await message.channel.send(isTR ? "🔄 İnceleniyor..." : "🔄 Reviewing...");

            try {
                // FOTOĞRAFI ZORLA İNDİR
                const response = await fetch(attachment.url);
                if (!response.ok) throw new Error("Resim Discord'dan çekilemedi!");
                const arrayBuffer = await response.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);

                // LOKAL OCR TARAMA
                const { data: { text } } = await Tesseract.recognize(buffer, 'eng', { logger: () => {} });

                const cleanedText = text.toLowerCase().replace(/[^a-z0-9]/g, '');
                const target = "luawarescrpt"; 

                const logChannel = client.channels.cache.get(LOG_CHANNEL_ID);

                if (cleanedText.includes(target)) {
                    // ✅ ONAY SÜRECİ
                    const ROL_ABONE = '1500587633649127445';
                    const ROL_UNVERIFIED = '1500249403443908711';

                    const member = await message.guild.members.fetch(message.author.id);
                    await member.roles.add(ROL_ABONE).catch(() => {});
                    await member.roles.remove(ROL_UNVERIFIED).catch(() => {});

                    const ok = await message.channel.send(isTR ? `✅ <@${message.author.id}> Abone rolün verildi!` : `✅ <@${message.author.id}> Role granted!`);
                    await message.author.send(isTR ? "🎉 Onaylandınız, rolünüz verildi!" : "🎉 Approved, role granted!").catch(() => {});

                    if (logChannel) {
                        const embed = new EmbedBuilder()
                            .setTitle('✅ LUAWARE SİSTEM ONAYI')
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
                    // ❌ RED SÜRECİ
                    const no = await message.channel.send(isTR ? `❌ <@${message.author.id}> Geçersiz ekran görüntüsü!` : `❌ <@${message.author.id}> Invalid screenshot!`);
                    await message.author.send(isTR ? "❌ Gönderdiğiniz ekran görüntüsü kriterlere uymuyor." : "❌ Your screenshot does not meet the criteria.").catch(() => {});

                    if (logChannel) {
                        const embed = new EmbedBuilder()
                            .setTitle('❌ LUAWARE SİSTEM REDDİ')
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
                await statusMsg.edit(isTR ? "❌ Tarama sırasında hata oluştu!" : "❌ Error during scanning!").catch(() => {});
                setTimeout(async () => {
                    await message.delete().catch(() => {});
                    await statusMsg.delete().catch(() => {});
                }, 4000);
            }
            return;
        }

        // --- BÖLÜM 3: PREFIX KOMUTLARI ---
        const prefix = '!';
        if (!message.content.startsWith(prefix)) return;
        const args = message.content.slice(prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();
        const command = client.commands?.get(commandName);
        if (command) command.execute(message, args, client);
    }
};