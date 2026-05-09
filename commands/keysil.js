const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const KeyModel = require('../models/key');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('keysil')
        .setDescription('🗑️ LUAWARE | Belirtilen kullanıcının lisansını (Key) sistemden siler.')
        .addUserOption(option => 
            option.setName('kullanici')
            .setDescription('Keyi silinecek kullanıcıyı seçin')
            .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const targetUser = interaction.options.getUser('kullanici');
        
        // Veritabanından o kullanıcının keyini bul ve direkt uçur
        const deletedKey = await KeyModel.findOneAndDelete({ owner: targetUser.id });

        if (!deletedKey) {
            return interaction.reply({ 
                embeds: [new EmbedBuilder().setColor('#FEE75C').setDescription(`⚠️ <@${targetUser.id}> adlı kullanıcının sistemde kayıtlı bir **LUAWARE Key'i bulunamadı!**`)],
                ephemeral: true
            });
        }

        // Başarıyla silinirse verilecek rapor
        const successEmbed = new EmbedBuilder()
            .setTitle('🗑️ LUAWARE OS | Lisans İptali')
            .setColor('#ED4245')
            .setDescription(
                `⚙️ **İşlem -->** \`Bireysel Lisans İptali (Key Silme)\`\n` +
                `👤 **Kullanıcı -->** <@${targetUser.id}>\n` +
                `🔑 **Silinen Key -->** \`${deletedKey.key}\`\n` +
                `👮 **İptal Eden Admin -->** <@${interaction.user.id}>`
            )
            .setFooter({ text: 'LUAWARE Security' })
            .setTimestamp();

        return interaction.reply({ embeds: [successEmbed] });
    }
};