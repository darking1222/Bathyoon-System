const { MessageSelectMenu, MessageActionRow, MessageEmbed, MessageButton } = require("discord.js");
const { owners } = require(`${process.cwd()}/config`);
const config = require(`${process.cwd()}/config`);
const Data = require('pro.db');
const Pro = require('pro.db');

module.exports = {
  name: "vip",
  description: "VIP commands",
  run: async (client, message, args) => {

    if (!owners.includes(message.author.id)) return message.react('❌');
    const isEnabled = Data.get(`command_enabled_${module.exports.name}`);
    if (isEnabled === false) {
        return; 
    }


    const selectMenu = new MessageActionRow()
      .addComponents(
        new MessageSelectMenu()
          .setCustomId('vipMenu')
          .setPlaceholder('اختر إحدى الخيارات')
          .addOptions([
            {
              label: 'تغير الاسم',
              emoji: '1259143163323351050',
              description: 'لتغير إسم البوت',
              value: 'setname',
            },
            {
              label: 'تغيير صور',
              emoji: '1259143163323351050',
              description: 'لتغير صورة البوت',
              value: 'setavatar',
            },
            {
              label: 'تغير الحالة',
              description: 'لتغير حالة البوت',
              emoji: '1259143163323351050',
              value: 'setstatus',
            },
            {
              label: 'تغير لون الأمبيد',
              emoji: '1259143163323351050',
              description: 'لتغير لون الإمبيد بالبوت',
              value: 'setcolor',
            },
            {
              label: 'إعادة التشغيل',
              emoji: '1259143163323351050',
              description: 'إعادة تشغيل البوت',
              value: 'restr',
            },
          ])
      );


      const deleteButton = new MessageButton()
      .setCustomId('Cancel')
      .setLabel('إلغاء')
      .setStyle('DANGER');

      const Cancel = new MessageActionRow()
      .addComponents(deleteButton);

    message.reply({ content:"**قائمة تعديل البوت ⚙️**",  components: [selectMenu, Cancel] });

    const filter = (interaction) => interaction.user.id === message.author.id;
    const collector = message.channel.createMessageComponentCollector({ filter, time: 60000 });



    collector.on("collect", async (interaction) => {
      if (!interaction.values || interaction.values.length === 0) return;
            collector.stop();

      const choice = interaction.values[0];

      
      if (choice === "setavatar") {
        await interaction.message.delete();
        const replyMessage = await message.reply("**يرجى إرفاق الصورة أو رابطها ** ⚙️");
    
        const messageCollector = message.channel.createMessageCollector({
            filter: (msg) => msg.author.id === message.author.id,
            max: 1,
        });
    
        messageCollector.on("collect", async (msg) => {
            if (msg.attachments.size > 0) {
                const attachment = msg.attachments.first();
                const avatarURL = attachment.url;
                await client.user.setAvatar(avatarURL);
                await replyMessage.edit("**تم تغير صورة البوت ** ✅");
                
                await msg.delete();
            } else if (msg.content.startsWith("http")) {
                const avatarURL = msg.content;
                await client.user.setAvatar(avatarURL);
                await replyMessage.edit("**تم تغير صورة البوت ** ✅");
                await msg.delete();
                collector.stop()
            } else {
                await replyMessage.reply("**يرجى إرفاق الصورة أو رابطها ** ⚙️");
            }
        });
    }
    
    });


    collector.on("collect", async (interaction) => {
      if (!interaction.values || interaction.values.length === 0) return;
            const choice = interaction.values[0];

      if (choice === "setname") {
        await interaction.message.delete();
      const setnamereply = await message.reply("**يرجى إرفاق أسم البوت الجديد .** ⚙️");
    
        const filter = m => m.author.id === message.author.id;
        const collector = message.channel.createMessageCollector({
          filter, 
          max: 1
        });
    
        collector.on("collect", async (msg) => {
  
          await client.user.setUsername(msg.content);
          await msg.delete()
          await setnamereply.edit("**تم تغير إسم البوت ✅**");
          collector.stop()
        });
      }    
    });

    collector.on("collect", async (interaction) => {
      if (!interaction.values || interaction.values.length === 0) return;
            const choice = interaction.values[0];

      if (choice === "restr") {
        await interaction.message.delete();
       const restr = await message.reply("**جاري إعادة تشغيل البوت...**");
        client.destroy();
        client.login(config.token);
        restr.edit("**تم إعادة ريستارت البوت الآن.** ✅");

      }
    });

    collector.on("collect", async (interaction) => {
      if (!interaction.values || interaction.values.length === 0) return;
      const choice = interaction.values[0];
    
      if (choice === "setstatus") {
        await interaction.message.delete();
    
         await message.reply("**يرجى كتابة الحالة الجديدة للبوت.**");
    
        const messageCollector = interaction.channel.createMessageCollector({
          filter: (msg) => msg.author.id === interaction.user.id,
          max: 1,
        });
    
        messageCollector.on("collect", async (msg) => {
          const newStatus = msg.content.toLowerCase(); // تأكد من تحويل النص إلى حالة صغيرة لمعالجة الحالات بشكل صحيح
    
          // إرسال الأزرار لاختيار نوع الحالة
          const newStatusrply = await interaction.channel.send({
            content: `**يرجى اختيار نوع الحالة لـ "${newStatus}":**`,
            components: [{
              type: "ACTION_ROW",
              components: [
                {
                  type: "BUTTON",
                  style: "SECONDARY",
                  emoji: "📺",
                  custom_id: "watching",
                },
                {
                  type: "BUTTON",
                  style: "SECONDARY",
                  emoji: "🎧",
                  custom_id: "listening",
                },
                {
                  type: "BUTTON",
                  style: "SECONDARY",
                  emoji: "🎥",
                  custom_id: "streaming",
                },{
                  type: "BUTTON",
                  style: "SECONDARY",
                  emoji: "🎮",
                  custom_id: "playing",
                }
              ],
            }],
          });

        });
      }
    });
    
    // تحديد استجابة زر وتغيير حالة البوت بناءً على الزر المحدد
    client.on('interactionCreate', async interaction => {
      if (!interaction.isButton()) return;
    
      const newStatus = interaction.message.content.split('"')[1].toLowerCase(); // استخراج الحالة من الرسالة الأصلية
    
      let activityType;
      let activityURL;
    
      switch (interaction.customId) {
        case "watching":
            activityType = "WATCHING";
            break;
        case "listening":
            activityType = "LISTENING";
            break;
        case "streaming":
            activityType = "STREAMING";
            activityURL = "https://www.twitch.tv/7lm";
            break;
        case "playing": // إضافة الحالة PLAYING
            activityType = "PLAYING";
            break;
        default:
            activityType = "PLAYING"; // الحالة الافتراضية
            break;
      }
    
      // تعيين حالة البوت
      client.user.setActivity(newStatus, { type: activityType, url: activityURL });
    
      // تحديث الرسالة بالحالة الجديدة وتعطيل الأزرار
      await interaction.update({
        content: `**تم تغيير حالة البوت إلى ${newStatus} مع نوع ${activityType}.** ✅`,
        components: [
          {
            type: "ACTION_ROW",
            components: interaction.message.components[0].components.map(component => {
              return { 
                ...component, 
                disabled: true 
              };
            })
          }
        ]
      });
    });
    
  

collector.on("collect", async (interaction) => {
  if (!interaction.values || interaction.values.length === 0) return;
        const choice = interaction.values[0];

      if (choice === "setcolor") {
        await interaction.message.delete();
      const setcolorreply = await message.reply("**يرجى إرسال كود اللون .** ⚙️");

        const colorCollector = interaction.channel.createMessageCollector({
          filter: (msg) => msg.author.id === interaction.user.id,
          max: 1,
        });

        colorCollector.on("collect", async (msg) => {
          const newColor = msg.content;

          await setcolorreply.edit(`** تم تغير اللون إلي \`${newColor}\`.** ✅`);
          await Data.set(`Guild_Color = ${interaction.guild.id}`, newColor);
          msg.delete()
          collector.stop();
        });
      }
    });

    client.on('interactionCreate', async (interaction) => {
      if (!interaction.isButton()) return;

      if (interaction.customId === 'Cancel') {
         collector.stop();
        interaction.message.delete();
      }
    });


  },
};
