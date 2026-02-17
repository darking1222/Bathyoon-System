const db = require("pro.db");
const { prefix, owners } = require(`${process.cwd()}/config`);
const { MessageAttachment, MessageEmbed } = require("discord.js");

module.exports = {
  name: "autoline",
  description: "To set font URL and channel",
  usage: `${prefix}autoline <fontURL1 or ImageURL1> <#channel1> <fontURL2 or ImageURL2> <#channel2> ...`,
  run: async (client, message, args) => {

    if (!owners.includes(message.author.id)) return message.react('❌');
    const isEnabled = db.get(`command_enabled_${module.exports.name}`);
    if (isEnabled === false) {
        return; 
    }


    const Color = db.get(`Guild_Color = ${message.guild.id}`) || '#a7a9a9';
    if (!Color) return;

    // استخراج النص من الرسالة
    const fullText = message.content.substring(prefix.length + "autoline".length + 1);
    const fullArgs = fullText.split(/\s+/); // تقسيم النص إلى قائمة من الكلمات

    if (fullArgs.length % 2 !== 0 || fullArgs.length === 0) {
      const embed = new MessageEmbed()
        .setColor(`${Color || `#a7a9a9`}`)
        .setDescription(`**يرجى استعمال الأمر بالطريقة الصحيحة .**\n${prefix}autoline <link> <#${message.channel.id}>`);

      return message.reply({ embeds: [embed] });
    }

    const storedChannels = await db.get("Channels") || [];

    for (let i = 0; i < fullArgs.length; i += 2) {
      const fontURL = fullArgs[i];
      const channelMention = fullArgs[i + 1];
      const channelID = channelMention.replace(/[^0-9]/g, ''); // استخراج معرف القناة

      const channel = message.guild.channels.cache.get(channelID);
      if (!channel || channel.type !== 'GUILD_TEXT') {
        return message.react("❌");
      }



      // التحقق من وجود مرفقات
      if (message.attachments.size > 0) {
        const attachment = message.attachments.first();
        const contentType = attachment.contentType;

        if (contentType.startsWith('image/')) {
          // إذا كان نوع المحتوى هو صورة، حفظ الصورة كمرفق
          storedChannels.push({ channelID: channelID, fontURL: new MessageAttachment(attachment.url) });
        }
      } else {
        // إذا لم يكن هناك مرفقات، حفظ الرابط كالعادة
        storedChannels.push({ channelID: channelID, fontURL: fontURL });
      }
    }

    db.set("Channels", storedChannels);
    message.react(`✅`);
  },
};
