const { MessageEmbed, MessageSelectMenu, MessageActionRow, MessageButton } = require('discord.js');
const { prefix, owners } = require(`${process.cwd()}/config`);
const ms = require('ms');
const moment = require('moment');
const Data = require('pro.db');
const db = require('pro.db');

function getTotalPunishments(member) {
  const totalMutes = db.get(`voice_${member.id}`) || 0;
  const totalPrisons = db.get(`Total_Prisons_${member.id}`) || 0;
  return { totalMutes, totalPrisons };
}

module.exports = {
  name: 'vmute',
  aliases: ["ميوت"],
  run: async (client, message) => {
    const isEnabled = Data.get(`command_enabled_${module.exports.name}`);
    if (isEnabled === false) {
      return; 
    }
    
    const Color = db.get(`Guild_Color = ${message.guild.id}`) || '#000000';
    if (!Color) return;

    const Pro = require(`pro.db`);
    const allowDb = Pro.get(`Allow - Command vmute = [ ${message.guild.id} ]`);
    const allowedRole = message.guild.roles.cache.get(allowDb);
    const isAuthorAllowed = message.member.roles.cache.has(allowedRole?.id);

    if (!isAuthorAllowed && message.author.id !== allowDb && !message.member.permissions.has('MUTE_MEMBERS')) {
      return;
    }

    let args = message.content.split(' ').slice(1);
    const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]);

    if (!member) {
      const embed = new MessageEmbed()
      .setColor(`${Color || `#000000`}`)
        .setDescription(`**يرجى استعمال الأمر بالطريقة الصحيحة .\n${prefix}ميوت <@${message.author.id}>**`);
      return message.reply({ embeds: [embed] });
    }

    if (member.id === message.member.id) return message.react('❌');
    if (message.member.roles.highest.position < member.roles.highest.position) return message.react('❌');

    const menuOptions = [
      { label: 'مشاكل| 1', description: `15m`, value: 'مشاكل' },
      { label: 'ايحائات جنيسه | 2', description: `25m`, value: 'ايحائات جنيسه' },
      { label: 'السب | 3', description: `30m`, value: 'السب' },
      { label: 'طاري الاهل | 4', description: `45m`, value: 'طاري الاهل' },
      { label: 'القذف | 4', description: `1h`, value: 'القذف' },
    ];

    const menu = new MessageSelectMenu()
      .setCustomId('mute_menu')
      .setPlaceholder('اختر عقوبة العضو ووقت الإسكات')
      .addOptions(menuOptions);

    const deleteButton = new MessageButton()
      .setCustomId('Cancel2')
      .setLabel('الغاء')
      .setStyle('SECONDARY');

    const menuRow = new MessageActionRow().addComponents(menu);
    const buttonRow = new MessageActionRow().addComponents(deleteButton);

    message.reply({ content: `**يرجي تحديد سبب العقوبه.**\n** * <@${member.id}>**`, components: [menuRow, buttonRow] });

    const filter = (interaction) => interaction.isSelectMenu() && interaction.user.id === message.author.id;
    const collector = message.channel.createMessageComponentCollector({ filter, time: 150000 }); 

    let interactionDetected = false; 

    collector.on('collect', (interaction) => {
      interactionDetected = true; 
    
      const selectedOption = interaction.values[0];
      let time; 
    
      if (selectedOption === 'مشاكل') {
        time = '15m';
        applyMute(member, time, selectedOption);
      } else if (selectedOption === 'ايحائات جنيسه') {
        time = '25m';
        applyMute(member, time, selectedOption);
      } else if (selectedOption === 'السب') {
        time = '30m';
        applyMute(member, time, selectedOption);
      } else if (selectedOption === 'طاري الاهل') {
        time = '45m'; 
        applyMute(member, time, selectedOption);
      } else if (selectedOption === 'القذف') {
        time = '1h';
        applyMute(member, time, selectedOption);
      }
    
      message.react("✅");
      interaction.message.delete();
    });
    
    collector.on('end', (collected, reason) => {
      if (!interactionDetected) {
        message.reply("**يرجى اختيار سبب !**").then(reply => {
          setTimeout(() => {
            reply.delete();
          }, 80000); // 10 ثواني :)
        });
      }
    });

    async function applyMute(member, time, selectedOption) {
      if (!member.voice.channel) {
        return message.reply("**العضو ليس في قناة صوتية حالياً!**");
      }

      await member.voice.setMute(true, `Muted for ${selectedOption}`);
      const endDate = moment().add(ms(time));
      const logData = {
        time: time,
        times: endDate.format('LLLL'),
        reason: selectedOption,
        channel: message.channel.id,
        by: message.author.id,
        to: member.id
      };
      db.set(`voicemute_${member.id}`, logData);
      db.add(`Total_voice_${member.id}`, 1); // Increment total mutes count

      setTimeout(async () => {
        if (member.voice.channel) {
          await member.voice.setMute(false, `Mute duration ended for ${selectedOption}`);
        }
        db.delete(`voicemute_${member.id}`);
      }, ms(time));

      const logEmbed = new MessageEmbed()
        .setColor('#000000')
        .setAuthor(member.user.tag, member.user.displayAvatarURL({ dynamic: true }))
        .setDescription(`**ميوت \n\nالعضو : <@${logData.to}>\nبواسطة : <@${logData.by}>\nالرسالة : [here](${message.url})\nالوقت : \`${logData.time}\`**\n\`\`\`Prison : ${logData.reason}\`\`\` `)
        .setThumbnail(`https://g.top4top.io/p_3087u8nzn1.png`)
        .setFooter({ text: `${message.author.tag}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) });

      let logChannel = db.get(`logtvoicemute_${message.guild.id}`);
      logChannel = message.guild.channels.cache.find(channel => channel.id === logChannel);

      if (logChannel) {
        logChannel.send({ embeds: [logEmbed] });
      }
    }

    client.on('interactionCreate', async (interaction) => {
      if (!interaction.isButton()) return;

      if (interaction.customId === 'Cancel2') {
        interaction.message.delete();
      }
    });
  }
};
