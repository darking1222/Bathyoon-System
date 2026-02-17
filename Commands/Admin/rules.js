const { MessageEmbed, MessageActionRow, MessageSelectMenu, MessageButton } = require("discord.js");
const { prefix } = require(`${process.cwd()}/config`);
const Pro = require(`pro.db`);
const Data = require(`pro.db`);
const fs = require('fs');
const path = require('path');

module.exports = {
  name: 'rules',
  aliases: ["قوانين"],
  run: async (client, message) => {

    const isEnabled = Data.get(`command_enabled_${module.exports.name}`);
    if (isEnabled === false) {
        return; 
    }
    
    const Color = Data.get(`Guild_Color = ${message.guild.id}`) || '#a7a9a9';
    if (!Color) return;

    const db = Pro.get(`Allow - Command rules = [ ${message.guild.id} ]`);
    const allowedRole = message.guild.roles.cache.get(db);
    const isAuthorAllowed = message.member.roles.cache.has(allowedRole?.id);

    if (!isAuthorAllowed && message.member.id !== db && !message.member.permissions.has('ADMINISTRATOR')) {
      return;
    }

    // تحميل ملف القوانين
    const rulesPath = path.join(process.cwd(), 'data', 'rules.json');
    
    if (!fs.existsSync(rulesPath)) {
      return message.reply('**❌ ملف القوانين غير موجود.**');
    }

    const rules = JSON.parse(fs.readFileSync(rulesPath, 'utf-8'));
    
    // تصفية القوانين المخفية
    const visibleRules = rules.filter(rule => !rule.hidden);

    if (visibleRules.length === 0) {
      return message.reply('**❌ لا توجد قوانين ظاهرة حالياً.**');
    }

    // إنشاء خيارات القائمة
    const safezones = Data.get(`safezones_${message.guild.id}`) || [];
    const options = visibleRules.map(rule => ({
      label: rule.title,
      description: rule.id,
      value: `rule_${rule.id}`,
      emoji: rule.setEmoji
    }));

    // إضافة خيار المناطق الآمنة إذا كان هناك مناطق مسجلة
    if (safezones.length > 0) {
      options.push({
        label: 'المناطق الآمنة',
        description: 'عرض جميع المناطق الآمنة',
        value: 'show_safezones',
        emoji: '🛡️'
      });
    }

    const row = new MessageActionRow()
      .addComponents(
        new MessageSelectMenu()
          .setCustomId('rules_select')
          .setPlaceholder('قائمة القوانين')
          .addOptions(options),
      );

    // الحصول على الصورة المخصصة أو استخدام الافتراضية
    const customImage = Data.get(`rules_image_${message.guild.id}`) || 'https://media.discordapp.net/attachments/1442234490369081425/1442235052858806354/Untitled__1_-removebg-preview.png?ex=6924b190&is=69236010&hm=e5a2b40878e8929603bd80e7ba55ac5e9bc1b4426cfd45c67c7fae7ad2b7460e&=&format=webp&quality=lossless&width=1102&height=145';

    const embed = new MessageEmbed()
      .setColor(Color || '#000000')
      .setThumbnail(message.guild.iconURL({ dynamic: true }))
      .setTitle('قوانين السيرفر')
      .setDescription('**مرحبًا بك في سيرفر برستيج. يرجى قراءة جميع القوانين أدناه بعناية لإنشاء بيئة خالية من المخربين وأولئك الذين لا يلتزمون بالقوانين. يرجى ملاحظة أن أي شخص يخالف القوانين سيتم معاقبته إداريًا للحفاظ على مجتمع خاليًا من المشاكل.**')
      .setImage(customImage)
      .setFooter({ text: 'Rules System', iconURL: message.guild.iconURL({ dynamic: true }) })
      .setTimestamp();

    await message.channel.send({ embeds: [embed], components: [row] });
    await message.delete().catch(() => {});
  }
};
