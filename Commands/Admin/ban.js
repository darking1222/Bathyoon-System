const { MessageEmbed } = require("discord.js");
const Discord = require("discord.js")
const { prefix, owners } = require(`${process.cwd()}/config`);
const Pro = require(`pro.db`);
const Data = require(`pro.db`);
module.exports = {
  name: 'ban',
  aliases: ["حظر"],
  run: async (client, message) => {

    const isEnabled = Data.get(`command_enabled_${module.exports.name}`);
    if (isEnabled === false) {
        return; 
    }
    
    const Color = Data.get(`Guild_Color = ${message.guild.id}`) || '#a7a9a9';
    if (!Color) return;

    const db = Pro.get(`Allow - Command ban = [ ${message.guild.id} ]`);
    const allowedRole = message.guild.roles.cache.get(db);
    const isAuthorAllowed = message.member.roles.cache.has(allowedRole?.id);

    if (!isAuthorAllowed && message.member.id !== db && !message.member.permissions.has('BAN_MEMBERS')) {
      return;
    }

    const args = message.content.trim().split(/ +/);
    const member = message.mentions.members.first() || await client.users.fetch(args[1]).catch(() => null);

    if (!member) {
      const embed = new MessageEmbed()
        .setColor(`${Color || `#a7a9a9`}`)
        .setDescription(`**يرجى استعمال الأمر بالطريقة الصحيحة .\n${prefix}حظر <@${message.author.id}>**`);
      return message.reply({ embeds: [embed] });
    }

    if (member.permissions && member.permissions.has('BAN_MEMBERS')) {
      return message.reply('**لا يمكنك حظر هذا العضو.**');
    }

    if (member.id === message.author.id) {
      return message.reply("**🙄 لا يمكنك حظر نفسك.**");
    }

    const reason = args.slice(2).join(' ');

    try {
      await message.guild.members.ban(member, { reason });
      const bbannedMember = member instanceof Discord.User ? member.tag : member.user.tag;
      const bannedMember = member instanceof Discord.User ? member.id : member.user.id;
      const bannedMemberAvatar = member instanceof Discord.User ? member.displayAvatarURL({ dynamic: true, size: 1024, format: 'png' }) : member.user.displayAvatarURL({ dynamic: true, size: 1024, format: 'png' });

      // Sending log message
      const logbanunban = Data.get(`logbanunban_${message.guild.id}`);
      const logChannel = message.guild.channels.cache.find((c) => c.id === logbanunban);

      if (logChannel) {
        const embedLog = new MessageEmbed()
          .setColor("#880013")
          .setAuthor(bbannedMember, bannedMemberAvatar)
          .setDescription(`**حظر عضو**\n\n**لـ : <@${bannedMember}>**\n**بواسطة : <@${message.author.id}>**\n\`\`\`Reason : ${reason || 'No reason'}\`\`\``)
          .setFooter({ text: message.guild.name, iconURL: message.guild.iconURL({ dynamic: true }) })
          .setThumbnail('https://cdn.discordapp.com/attachments/1093303174774927511/1138892172574326874/82073587-11BA-4E4B-AC8F-8857CD89282F.png');
        logChannel.send({ embeds: [embedLog] });
      }

      message.react(`✅`);
    } catch (error) {
      console.error(error);
    }
  }
};
