const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, ComponentType } = require('discord.js');
const KeyModel = require('../models/key'); 

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mevcutkeyler')
        .setDescription('Tüm Ryphera lisanslarını sayfalı bir kitap şeklinde listeler.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
        
    async execute(interaction) {
        // 🚨 ONAY EKRANI ÇÖPE ATILDI: Komut yazıldığı an arşivi çekecek.
        await interaction.deferReply({ ephemeral: true });

        // 🚨 NÜKLEER ÇÖZÜM 2: Veritabanı donarsa komut çökmez.
        const dbKeys = await Promise.race([
            KeyModel.find({}).catch(() => []),
            new Promise(resolve => setTimeout(() => resolve([]), 2000))
        ]);

        if (!dbKeys || dbKeys.length === 0) {
            return interaction.editReply({ content: '⚠️ **Arşivde hiç lisans bulunamadı veya veritabanı yanıt vermedi!**', embeds: [], components: [] });
        }

        // 📄 SAYFALAMA AYARLARI
        let currentPage = 0;
        const itemsPerPage = 5; 
        const totalPages = Math.ceil(dbKeys.length / itemsPerPage);

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

        const generateButtons = (page) => {
            return new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('prev_page').setLabel(`${page > 0 ? page : 'Son'}`).setEmoji('📖').setStyle(ButtonStyle.Primary).setDisabled(page === 0),
                new ButtonBuilder().setCustomId('current_page_num').setLabel(`Sayfa: ${page + 1}`).setStyle(ButtonStyle.Secondary).setDisabled(true),
                new ButtonBuilder().setCustomId('next_page').setLabel(`${page + 2 <= totalPages ? page + 2 : 'Bitti'}`).setEmoji('📖').setStyle(ButtonStyle.Primary).setDisabled(page === totalPages - 1)
            );
        };

        const response = await interaction.editReply({ embeds: [generateEmbed(currentPage)], components: [generateButtons(currentPage)] });

        const pageCollector = response.createMessageComponentCollector({ componentType: ComponentType.Button, time: 300000 });

        pageCollector.on('collect', async (pageInteraction) => {
            await pageInteraction.deferUpdate(); 
            if (pageInteraction.customId === 'prev_page') currentPage--;
            else if (pageInteraction.customId === 'next_page') currentPage++;
            await pageInteraction.editReply({ embeds: [generateEmbed(currentPage)], components: [generateButtons(currentPage)] });
        });

        pageCollector.on('end', () => {
            interaction.editReply({ components: [] }).catch(() => {});
        });
    },
};