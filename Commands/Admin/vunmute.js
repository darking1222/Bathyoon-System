const { MessageEmbed } = require("discord.js");
const db = require("pro.db");
const fs = require("fs");
const { prefix, owners } = require(`${process.cwd()}/config`);

module.exports = {
  name: "vunmute",
  aliases: ["فك","unvmute"],
  description: "unmute a member from the voice channel",
  usage: ["!vunmute @user"],
  run: async (client, message, args, config) => {
    try {
      const isEnabled = db.get(`command_enabled_${module.exports.name}`);
      if (isEnabled === false) {
        return; 
      }

      const Color = db.get(`Guild_Color = ${message.guild.id}`) || '#000000';
      if (!Color) return;

      const allowDb = db.get(`Allow - Command vmute = [ ${message.guild.id} ]`);
      const allowedRole = message.guild.roles.cache.get(allowDb);
      const isAuthorAllowed = message.member.roles.cache.has(allowedRole?.id);

      if (!isAuthorAllowed && message.author.id !== allowDb && !message.member.permissions.has('BAN_MEMBERS')) {
        return;
      }

      const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
      if (!member) {
        const embed = new MessageEmbed()
          .setColor(`${Color || `#000000`}`)
          .setDescription(`**يرجى استعمال الأمر بالطريقة الصحيحة .\n${prefix}فك <@${message.author.id}>**`);
        return message.reply({ embeds: [embed] });
      }

      if (!member.voice.channel) return message.reply({ content: `**المستخدم ليس في قناة صوتية .**` })

      member.voice.setMute(false).then(() => {
        message.reply({ content: `** تم فك الميوت عن ${member.user.username}**` });

        // إزالة العقوبة من قاعدة البيانات
        db.delete(`voicemute_${member.id}`);
        
        // إرسال الحدث إلى قناة اللوق إذا كانت موجودة
        const logEmbed = new MessageEmbed()
        .setColor('#000000')
        .setAuthor(member.user.tag, member.user.displayAvatarURL({ dynamic: true }))
        .setDescription(`** فك الميوت   \n\nالعضو : <@${member.id}>\nبواسطة : <@${message.author.id}>**`)
        .setThumbnail(`https://l.top4top.io/p_30871ktpe1.png`)
        .setTimestamp();
        
      let logChannel = db.get(`logtvoicemute_${message.guild.id}`);
      logChannel = message.guild.channels.cache.find(channel => channel.id === logChannel);
      
        if (logChannel) {
          logChannel.send({ embeds: [logEmbed] });
        } else {
          console.error('Channel not found for logging.');
        }
      });
    } catch (error) {
      console.error("An error occurred while processing vunmute command:", error);
    }
  }
};
