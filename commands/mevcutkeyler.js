const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, ComponentType } = require('discord.js');
const KeyModel = require('../models/key'); 

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mevcutkeyler')
        .setDescription('Tüm Ryphera lisanslarını sayfalı bir kitap şeklinde listeler.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
        
    async execute(interaction) {
        // 💎 İLK ONAY EKRANI
        const confirmEmbed = new EmbedBuilder()
            .setTitle('🔍 RYPHERA | Veritabanı Sorgusu')
            .setColor('#1aff00')
            .setDescription(
                `⚙️ **İşlem:** \`Lisans Arşivini Görüntüleme\`\n` +
                `📖 **Format:** \`Sayfalı Kitap Düzeni\`\n` +
                `📝 **Durum:** \`Devam etmek için onay verin.\``
            )
            .setFooter({ text: 'Ryphera OS Arşiv Güvenliği' })
            .setTimestamp();

        const confirmRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('confirm_list').setLabel('Arşivi Aç').setEmoji('📖').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('cancel_list').setLabel('İptal Et').setStyle(ButtonStyle.Danger)
        );

        const response = await interaction.reply({ embeds: [confirmEmbed], components: [confirmRow], ephemeral: true, fetchReply: true });
        const collector = response.createMessageComponentCollector({ componentType: ComponentType.Button, time: 60000 });

        collector.on('collect', async (i) => {
            if (i.customId === 'cancel_list') {
                await i.deferUpdate(); 
                return i.editReply({ content: '❌ İşlem iptal edildi.', embeds: [], components: [] });
            }

            if (i.customId === 'confirm_list') {
                // 🚨 KRİTİK ÇÖZÜM: DB sorgusundan önce botun süresini uzatıyoruz!
                await i.deferUpdate(); 

                const dbKeys = await KeyModel.find({});

                if (!dbKeys || dbKeys.length === 0) {
                    return i.editReply({ content: '⚠️ Arşivde hiç lisans bulunamadı.', embeds: [], components: [] });
                }

                // 📄 SAYFALAMA AYARLARI
                let currentPage = 0;
                const itemsPerPage = 5; 
                const totalPages = Math.ceil(dbKeys.length / itemsPerPage);

                // Embed Oluşturucu
                const generateEmbed = (page) => {
                    const start = page * itemsPerPage;
                    const currentItems = dbKeys.slice(start, start + itemsPerPage);

                    const descriptionData = currentItems.map(item => {
                        const gosterilenID = item.licenseId ? `#${item.licenseId}` : 'ID Yok';
                        const sahipEtiket = item.owner ? `<@${item.owner}>` : '\`Sahipsiz\`';
                        return `🆔 **ID:** \`${gosterilenID}\`\n👤 **Sahip:** ${sahipEtiket}\n🔑 **Key:** \`${item.key}\`\n⌛ **Bitiş:** \`${item.expiry}\`\n───────────────`;
                    }).join('\n');

                    return new EmbedBuilder()
                        .setTitle('📖 RYPHERA | Lisans Arşivi')
                        .setColor('#1aff00')
                        .setDescription(`📊 **Toplam Kayıt:** \`${dbKeys.length}\`\n\n${descriptionData}`)
                        .setFooter({ text: `Sayfa ${page + 1} / ${totalPages} | Ryphera OS Security` })
                        .setTimestamp();
                };

                // Buton Oluşturucu
                const generateButtons = (page) => {
                    return new ActionRowBuilder().addComponents(
                        new ButtonBuilder().setCustomId('prev_page').setLabel(`${page > 0 ? page : 'Son'}`).setEmoji('📖').setStyle(ButtonStyle.Primary).setDisabled(page === 0),
                        new ButtonBuilder().setCustomId('current_page_num').setLabel(`Sayfa: ${page + 1}`).setStyle(ButtonStyle.Secondary).setDisabled(true),
                        new ButtonBuilder().setCustomId('next_page').setLabel(`${page + 2 <= totalPages ? page + 2 : 'Bitti'}`).setEmoji('📖').setStyle(ButtonStyle.Primary).setDisabled(page === totalPages - 1)
                    );
                };

                await i.editReply({ embeds: [generateEmbed(currentPage)], components: [generateButtons(currentPage)] });

                const pageCollector = response.createMessageComponentCollector({ componentType: ComponentType.Button, time: 300000 });

                pageCollector.on('collect', async (pageInteraction) => {
                    await pageInteraction.deferUpdate(); // Sayfa değiştirirken de çökmesin diye eklendi
                    
                    if (pageInteraction.customId === 'prev_page') currentPage--;
                    else if (pageInteraction.customId === 'next_page') currentPage++;

                    await pageInteraction.editReply({ embeds: [generateEmbed(currentPage)], components: [generateButtons(currentPage)] });
                });

                pageCollector.on('end', () => {
                    response.edit({ components: [] }).catch(() => {});
                });
            }
        });
    },
};