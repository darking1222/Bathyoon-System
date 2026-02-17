const {
    Client,
    intents,
    Collection,
    MessageEmbed,
    MessageAttachment,
    MessageActionRow,
    MessageButton,
    MessageSelectMenu,
    Permissions
  } = require("discord.js");

  const client = new Client({ intents: 32767 });

  const express = require('express');
  const app = express();

  app.get('/', (req, res) => {
    res.send('Hello Express app!');
  });

  const PORT = process.env.SERVER_PORT || process.env.PORT || 25567;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Web] Server started on port ${PORT}`);
  });

  function loadAliasesToBot() {
  }

  const fs = require("fs");
  const ms = require(`ms`);
  const Discord = require("discord.js");

  // Load config from file, then override with environment variables if set (for Pterodactyl)
  const config = require(`${process.cwd()}/config`);
  if (process.env.BOT_TOKEN) config.token = process.env.BOT_TOKEN;
  if (process.env.BOT_PREFIX) config.prefix = process.env.BOT_PREFIX;
  if (process.env.BOT_OWNERS) config.owners = process.env.BOT_OWNERS.split(',');
  if (process.env.BOT_GUILD) config.Guild = process.env.BOT_GUILD;

  const { prefix, owners, Guild } = config;
  const Data = require("pro.db");
  const { createCanvas, registerFont } = require("canvas");
  const canvas = require('canvas');

  process.on("unhandledRejection", (reason, promise) => {
    console.error("[Error] Unhandled Rejection:", reason);
  });
  process.on("uncaughtException", (err, origin) => {
    console.error("[Error] Uncaught Exception:", err);
  });
  process.on('uncaughtExceptionMonitor', (err, origin) => {
    console.error("[Error] Uncaught Exception Monitor:", err);
  });

  module.exports = client;

  client.commands = new Collection();
  client.slashCommands = new Collection();
  client.config = config;
  require("./handler")(client);
  client.prefix = prefix;

  if (!config.token || config.token === '') {
    console.error('[FATAL] No bot token provided! Set BOT_TOKEN environment variable or edit config.json');
    process.exit(1);
  }

  console.log('[Bot] Logging in...');
  client.login(config.token).catch(err => {
    console.error('[FATAL] Failed to login:', err.message);
    process.exit(1);
  });


  client.on('ready', () => {
    console.log(`[Bot] Logged in as ${client.user.tag}`);
    console.log(`[Bot] Serving ${client.guilds.cache.size} guild(s)`);
    console.log(`[Bot] Loaded ${client.commands.size} command(s)`);
    client.user.setActivity(".", {type: "STREAMING", url: "https://discord.gg/discord"})
  });


  require("events").EventEmitter.defaultMaxListeners = 9999999;
  
  fs.readdir(`${__dirname}/events/`, (err, folders) => {
      if (err) return console.error(err);
  
      folders.forEach(folder => {
          if (folder.includes('.')) return;
  
          fs.readdir(`${__dirname}/events/${folder}`, (err, files) => {
              if (err) return console.error(err);
  
              files.forEach(file => {
                  if (!file.endsWith('.js')) return;
  
                  let eventName = file.split('.')[0];
                  let eventPath = `${__dirname}/events/${folder}/${file}`;
  
                  try {
                      let event = require(eventPath);
                      client.on(eventName, event.bind(null, client));
                  } catch (error) {
                  }
              });
          });
      });
  });

  // معالج نظام القوانين
  client.on('interactionCreate', async (interaction) => {
    // معالج القائمة الرئيسية لتعديل القوانين
    if (interaction.isSelectMenu() && interaction.customId === 'editrules_main_menu') {
      const action = interaction.values[0];
      const Color = Data.get(`Guild_Color = ${interaction.guild.id}`) || '#a7a9a9';
      const path = require('path');
      const rulesPath = path.join(process.cwd(), 'data', 'rules.json');

      // عرض القوانين
      if (action === 'list_rules') {
        const rules = JSON.parse(fs.readFileSync(rulesPath, 'utf-8'));
        
        const embed = new MessageEmbed()
          .setColor(Color)
          .setTitle('📋 قائمة القوانين')
          .setDescription(rules.map((rule, index) => {
            const status = rule.hidden ? '🙈 مخفي' : '👁️ ظاهر';
            return `**${index + 1}.** ID: \`${rule.id}\`\n└ العنوان: ${rule.title}\n└ الحالة: ${status}`;
          }).join('\n\n') || 'لا توجد قوانين')
          .setFooter({ text: `إجمالي القوانين: ${rules.length}`, iconURL: interaction.guild.iconURL({ dynamic: true }) })
          .setTimestamp();

        return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      // إضافة قانون
      if (action === 'add_rule') {
        await interaction.reply({ 
          content: `**➕ إضافة قانون جديد**\n\nقم بإرسال المعلومات بالترتيب:\n**1️⃣ ID القانون**\n**2️⃣ عنوان القانون**\n**3️⃣ محتوى القانون**\n\n(لديك 5 دقائق للرد - اكتب "الغاء" للإلغاء)`,
          ephemeral: true 
        });

        const filter = m => m.author.id === interaction.user.id;
        const collector = interaction.channel.createMessageCollector({ filter, time: 300000 });
        
        let step = 1;
        let newRule = { setEmoji: "1406135979349377127", hidden: false };

        collector.on('collect', async (m) => {
          if (m.content.toLowerCase() === 'الغاء' || m.content.toLowerCase() === 'cancel') {
            collector.stop('cancelled');
            return m.reply('**❌ تم إلغاء العملية.**');
          }

          const rules = JSON.parse(fs.readFileSync(rulesPath, 'utf-8'));

          if (step === 1) {
            if (rules.find(r => r.id === m.content)) {
              return m.reply('**❌ هذا الـ ID موجود مسبقاً! أرسل ID آخر.**');
            }
            newRule.id = m.content;
            step++;
            m.reply('**✅ تم حفظ الـ ID.\n\n2️⃣ الآن أرسل عنوان القانون:**');
          } else if (step === 2) {
            newRule.title = m.content;
            step++;
            m.reply('**✅ تم حفظ العنوان.\n\n3️⃣ الآن أرسل محتوى القانون الكامل:**');
          } else if (step === 3) {
            const fileNumber = rules.length + 1;
            const fileName = `file${fileNumber}.txt`;
            const dataPath = path.join(process.cwd(), 'data', 'rules', fileName);
            
            const rulesDir = path.join(process.cwd(), 'data', 'rules');
            if (!fs.existsSync(rulesDir)) {
              fs.mkdirSync(rulesDir, { recursive: true });
            }
            fs.writeFileSync(dataPath, m.content, 'utf-8');
            newRule.description = `rules/${fileName}`;
            
            rules.push(newRule);
            fs.writeFileSync(rulesPath, JSON.stringify(rules, null, 2), 'utf-8');
            
            const successEmbed = new MessageEmbed()
              .setColor('#00ff00')
              .setTitle('✅ تم إضافة القانون بنجاح')
              .addField('ID', newRule.id, true)
              .addField('العنوان', newRule.title, true)
              .setTimestamp();
            
            m.reply({ embeds: [successEmbed] });
            await m.delete().catch(() => {});
            collector.stop('success');
          }
        });

        collector.on('end', (collected, reason) => {
          if (reason === 'time') {
            interaction.channel.send('**⏱️ انتهى الوقت! تم إلغاء العملية.**');
          }
        });

        return;
      }

      // تحديث قانون
      if (action === 'update_rule') {
        const rules = JSON.parse(fs.readFileSync(rulesPath, 'utf-8'));
        
        if (rules.length === 0) {
          return interaction.reply({ content: '**❌ لا توجد قوانين لتحديثها.**', ephemeral: true });
        }

        const selectMenu = new MessageSelectMenu()
          .setCustomId('select_rule_to_update')
          .setPlaceholder('اختر القانون للتحديث')
          .addOptions(rules.map(rule => ({
            label: rule.title,
            description: `ID: ${rule.id}`,
            value: rule.id,
            emoji: rule.setEmoji || '📝'
          })));

        const row = new MessageActionRow().addComponents(selectMenu);

        const embed = new MessageEmbed()
          .setColor(Color)
          .setTitle('✏️ اختر القانون للتحديث')
          .setDescription('**اختر القانون الذي تريد تحديثه:**')
          .setTimestamp();

        return interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
      }

      // إظهار/إخفاء قانون
      if (action === 'toggle_rule') {
        const rules = JSON.parse(fs.readFileSync(rulesPath, 'utf-8'));
        
        if (rules.length === 0) {
          return interaction.reply({ content: '**❌ لا توجد قوانين.**', ephemeral: true });
        }

        const selectMenu = new MessageSelectMenu()
          .setCustomId('select_rule_to_toggle')
          .setPlaceholder('اختر القانون لتغيير حالته')
          .addOptions(rules.map(rule => ({
            label: rule.title,
            description: `الحالة: ${rule.hidden ? 'مخفي' : 'ظاهر'}`,
            value: rule.id,
            emoji: rule.hidden ? '🙈' : '👁️'
          })));

        const row = new MessageActionRow().addComponents(selectMenu);

        const embed = new MessageEmbed()
          .setColor(Color)
          .setTitle('👁️ إظهار/إخفاء قانون')
          .setDescription('**اختر القانون لتغيير حالة ظهوره:**')
          .setTimestamp();

        return interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
      }

      // حذف قانون
      if (action === 'delete_rule') {
        const rules = JSON.parse(fs.readFileSync(rulesPath, 'utf-8'));
        
        if (rules.length === 0) {
          return interaction.reply({ content: '**❌ لا توجد قوانين للحذف.**', ephemeral: true });
        }

        const selectMenu = new MessageSelectMenu()
          .setCustomId('select_rule_to_delete')
          .setPlaceholder('اختر القانون للحذف')
          .addOptions(rules.map(rule => ({
            label: rule.title,
            description: `ID: ${rule.id}`,
            value: rule.id,
            emoji: '🗑️'
          })));

        const row = new MessageActionRow().addComponents(selectMenu);

        const embed = new MessageEmbed()
          .setColor('#ff0000')
          .setTitle('⚠️ حذف قانون')
          .setDescription('**اختر القانون الذي تريد حذفه:**')
          .setTimestamp();

        return interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
      }

      // تعديل صورة القوانين
      if (action === 'edit_image') {
        await interaction.reply({ 
          content: `**🖼️ تعديل صورة القوانين**\n\nأرسل رابط الصورة الجديدة:\n(لديك دقيقتان)`,
          ephemeral: true 
        });

        const filter = m => m.author.id === interaction.user.id;
        const collector = interaction.channel.createMessageCollector({ filter, time: 120000, max: 1 });

        collector.on('collect', async (m) => {
          Data.set(`rules_image_${interaction.guild.id}`, m.content);

          const embed = new MessageEmbed()
            .setColor('#00ff00')
            .setTitle('✅ تم تحديث صورة القوانين')
            .setDescription('سيتم استخدام هذه الصورة في رسالة القوانين')
            .setImage(m.content)
            .setTimestamp();

          await m.reply({ embeds: [embed] });
          await m.delete().catch(() => {});
        });

        return;
      }

      // إدارة المناطق الآمنة
      if (action === 'manage_safezones') {
        const safezones = Data.get(`safezones_${interaction.guild.id}`) || [];
        
        const selectMenu = new MessageSelectMenu()
          .setCustomId('safezones_submenu')
          .setPlaceholder('اختر العملية')
          .addOptions([
            {
              label: 'عرض المناطق',
              description: 'عرض جميع المناطق الآمنة',
              value: 'list_zones',
              emoji: '📋'
            },
            {
              label: 'إضافة منطقة',
              description: 'إضافة منطقة آمنة جديدة',
              value: 'add_zone',
              emoji: '➕'
            },
            {
              label: 'تعديل منطقة',
              description: 'تعديل منطقة موجودة',
              value: 'edit_zone',
              emoji: '✏️'
            },
            {
              label: 'حذف منطقة',
              description: 'حذف منطقة موجودة',
              value: 'delete_zone',
              emoji: '🗑️'
            }
          ]);

        const row = new MessageActionRow().addComponents(selectMenu);

        const embed = new MessageEmbed()
          .setColor(Color)
          .setTitle('🛡️ إدارة المناطق الآمنة')
          .setDescription('**اختر العملية التي تريد تنفيذها:**')
          .addField('📊 الإحصائيات', `عدد المناطق: ${safezones.length}`, true)
          .setTimestamp();

        return interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
      }
    }

    // معالج قائمة القوانين المنسدلة
    if (interaction.isSelectMenu() && interaction.customId === 'rules_select') {
      try {
        const selectedValue = interaction.values[0];

        // التحقق إذا اختار المناطق الآمنة
        if (selectedValue === 'show_safezones') {
          const safezones = Data.get(`safezones_${interaction.guild.id}`) || [];
          
          if (safezones.length === 0) {
            return interaction.reply({ content: '**❌ لا توجد مناطق آمنة مسجلة.**', ephemeral: true });
          }

          // إنشاء قائمة منسدلة للمناطق الآمنة
          const selectMenu = new MessageSelectMenu()
            .setCustomId('select_safezone')
            .setPlaceholder('اختر منطقة آمنة')
            .addOptions(safezones.map(zone => ({
              label: zone.name,
              value: zone.id,
              emoji: zone.emoji || '🛡️'
            })));

          const row = new MessageActionRow().addComponents(selectMenu);

          const Color = Data.get(`Guild_Color = ${interaction.guild.id}`) || '#00ff00';
          const embed = new MessageEmbed()
            .setColor(Color)
            .setTitle('🛡️ المناطق الآمنة')
            .setDescription('**اختر منطقة من القائمة لعرض تفاصيلها**')
            .setFooter({ text: `عدد المناطق: ${safezones.length}`, iconURL: interaction.guild.iconURL({ dynamic: true }) })
            .setTimestamp();

          return await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
        }

        // عرض قانون عادي
        const path = require('path');
        const rulesPath = path.join(process.cwd(), 'data', 'rules.json');
        
        if (!fs.existsSync(rulesPath)) {
          return interaction.reply({ content: '**❌ ملف القوانين غير موجود.**', ephemeral: true });
        }

        const rules = JSON.parse(fs.readFileSync(rulesPath, 'utf-8'));
        const ruleId = selectedValue.replace('rule_', '');
        const rule = rules.find(r => r.id === ruleId);
        
        if (!rule) {
          return interaction.reply({ content: '**❌ القانون غير موجود.**', ephemeral: true });
        }

        if (rule.hidden) {
          return interaction.reply({ content: '**❌ هذا القانون مخفي حالياً.**', ephemeral: true });
        }

        const dataPath = path.join(process.cwd(), 'data', rule.description);
        
        if (!fs.existsSync(dataPath)) {
          return interaction.reply({ content: '**❌ ملف القانون غير موجود.**', ephemeral: true });
        }

        const text = fs.readFileSync(dataPath, 'utf-8');
        const Color = Data.get(`Guild_Color = ${interaction.guild.id}`) || '#000000';
        
        const ruleEmbed = new MessageEmbed()
          .setColor(Color)
          .setTitle(rule.title)
          .setDescription(text)
          .setFooter({ text: 'Rules System', iconURL: interaction.guild.iconURL({ dynamic: true }) })
          .setTimestamp();

        await interaction.reply({ embeds: [ruleEmbed], ephemeral: true });
      } catch (error) {
        console.error('Rules Error:', error);
        await interaction.reply({ content: '**❌ حدث خطأ أثناء عرض القانون.**', ephemeral: true }).catch(() => {});
      }
    }

    // معالج اختيار المنطقة الآمنة
    if (interaction.isSelectMenu() && interaction.customId === 'select_safezone') {
      try {
        const zoneId = interaction.values[0];
        const safezones = Data.get(`safezones_${interaction.guild.id}`) || [];
        const zone = safezones.find(z => z.id === zoneId);

        if (!zone) {
          return interaction.reply({ content: '**❌ المنطقة غير موجودة!**', ephemeral: true });
        }

        const Color = Data.get(`Guild_Color = ${interaction.guild.id}`) || '#00ff00';
        
        const embed = new MessageEmbed()
          .setColor(Color)
          .setTitle(`🛡️ ${zone.name}`)
          .setImage(zone.image)
          .setFooter({ text: 'منطقة آمنة', iconURL: interaction.guild.iconURL({ dynamic: true }) })
          .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });
      } catch (error) {
        console.error('Safezone Error:', error);
        await interaction.reply({ content: '**❌ حدث خطأ أثناء عرض المنطقة.**', ephemeral: true }).catch(() => {});
      }
    }

    // معالج اختيار قانون للتحديث
    if (interaction.isSelectMenu() && interaction.customId === 'select_rule_to_update') {
      const ruleId = interaction.values[0];
      const path = require('path');
      const rulesPath = path.join(process.cwd(), 'data', 'rules.json');
      const rules = JSON.parse(fs.readFileSync(rulesPath, 'utf-8'));
      const rule = rules.find(r => r.id === ruleId);
      const Color = Data.get(`Guild_Color = ${interaction.guild.id}`) || '#a7a9a9';

      const selectMenu = new MessageSelectMenu()
        .setCustomId(`edit_rule_menu_${ruleId}`)
        .setPlaceholder('اختر ما تريد تعديله')
        .addOptions([
          {
            label: 'تحديث العنوان',
            description: 'تعديل عنوان القانون',
            value: 'update_title',
            emoji: '📝'
          },
          {
            label: 'تحديث المحتوى',
            description: 'تعديل محتوى القانون',
            value: 'update_content',
            emoji: '📄'
          },
          {
            label: 'تعديل الإيموجي',
            description: 'تغيير إيموجي القانون',
            value: 'update_emoji',
            emoji: '😀'
          }
        ]);

      const row = new MessageActionRow().addComponents(selectMenu);

      const embed = new MessageEmbed()
        .setColor(Color)
        .setTitle('✏️ تحديث القانون')
        .addField('ID', rule.id, true)
        .addField('العنوان', rule.title, true)
        .addField('الإيموجي', rule.setEmoji || 'غير محدد', true)
        .setDescription('اختر ما تريد تعديله:')
        .setTimestamp();

      return interaction.update({ embeds: [embed], components: [row] });
    }

    // معالج إظهار/إخفاء قانون
    if (interaction.isSelectMenu() && interaction.customId === 'select_rule_to_toggle') {
      const ruleId = interaction.values[0];
      const path = require('path');
      const rulesPath = path.join(process.cwd(), 'data', 'rules.json');
      const rules = JSON.parse(fs.readFileSync(rulesPath, 'utf-8'));
      const rule = rules.find(r => r.id === ruleId);

      rule.hidden = !rule.hidden;
      fs.writeFileSync(rulesPath, JSON.stringify(rules, null, 2), 'utf-8');

      const embed = new MessageEmbed()
        .setColor(rule.hidden ? '#ff9900' : '#00ff00')
        .setTitle(rule.hidden ? '🙈 تم إخفاء القانون' : '👁️ تم إظهار القانون')
        .addField('ID', rule.id, true)
        .addField('العنوان', rule.title, true)
        .setDescription(`القانون الآن ${rule.hidden ? 'مخفي من' : 'ظاهر في'} قائمة القوانين`)
        .setTimestamp();

      return interaction.update({ embeds: [embed], components: [] });
    }

    // معالج حذف قانون
    if (interaction.isSelectMenu() && interaction.customId === 'select_rule_to_delete') {
      const ruleId = interaction.values[0];
      const path = require('path');
      const rulesPath = path.join(process.cwd(), 'data', 'rules.json');
      let rules = JSON.parse(fs.readFileSync(rulesPath, 'utf-8'));
      const ruleIndex = rules.findIndex(r => r.id === ruleId);
      const rule = rules[ruleIndex];

      const row = new MessageActionRow()
        .addComponents(
          new MessageButton()
            .setCustomId(`confirm_delete_${ruleId}`)
            .setLabel('تأكيد الحذف')
            .setEmoji('✅')
            .setStyle('DANGER'),
          new MessageButton()
            .setCustomId(`cancel_delete_${ruleId}`)
            .setLabel('إلغاء')
            .setEmoji('❌')
            .setStyle('SECONDARY')
        );

      const embed = new MessageEmbed()
        .setColor('#ff0000')
        .setTitle('⚠️ تأكيد حذف القانون')
        .addField('ID', rule.id, true)
        .addField('العنوان', rule.title, true)
        .setDescription('**هل أنت متأكد من حذف هذا القانون؟**\nلا يمكن التراجع عن هذا الإجراء!')
        .setTimestamp();

      return interaction.update({ embeds: [embed], components: [row] });
    }

    // معالج قائمة المناطق الآمنة الفرعية
    if (interaction.isSelectMenu() && interaction.customId === 'safezones_submenu') {
      const action = interaction.values[0];
      const safezones = Data.get(`safezones_${interaction.guild.id}`) || [];
      const Color = Data.get(`Guild_Color = ${interaction.guild.id}`) || '#a7a9a9';

      // عرض المناطق
      if (action === 'list_zones') {
        if (safezones.length === 0) {
          return interaction.update({ 
            embeds: [new MessageEmbed().setColor(Color).setDescription('**❌ لا توجد مناطق آمنة مسجلة.**')], 
            components: [] 
          });
        }

        const embed = new MessageEmbed()
          .setColor(Color)
          .setTitle('🛡️ قائمة المناطق الآمنة')
          .setDescription(safezones.map((zone, index) => {
            return `**${index + 1}.** ${zone.name}\n└ ID: \`${zone.id}\`\n└ الإيموجي: ${zone.emoji || '🛡️'}`;
          }).join('\n\n'))
          .setFooter({ text: `إجمالي المناطق: ${safezones.length}` })
          .setTimestamp();

        return interaction.update({ embeds: [embed], components: [] });
      }

      // إضافة منطقة
      if (action === 'add_zone') {
        await interaction.update({ 
          embeds: [new MessageEmbed().setColor(Color).setTitle('➕ إضافة منطقة آمنة جديدة').setDescription(`قم بإرسال المعلومات بالترتيب:\n\n**1️⃣ ID المنطقة**\n**2️⃣ اسم المنطقة**\n**3️⃣ رابط الصورة**\n\n(لديك 5 دقائق - اكتب "الغاء" للإلغاء)`)], 
          components: [] 
        });

        const filter = m => m.author.id === interaction.user.id;
        const collector = interaction.channel.createMessageCollector({ filter, time: 300000 });
        
        let step = 1;
        let newZone = { emoji: '🛡️' };

        collector.on('collect', async (m) => {
          if (m.content.toLowerCase() === 'الغاء' || m.content.toLowerCase() === 'cancel') {
            collector.stop('cancelled');
            return m.reply('**❌ تم إلغاء العملية.**');
          }

          if (step === 1) {
            if (safezones.find(z => z.id === m.content)) {
              return m.reply('**❌ هذا الـ ID موجود مسبقاً! أرسل ID آخر.**');
            }
            newZone.id = m.content;
            step++;
            m.reply('**✅ تم حفظ الـ ID.\n\n2️⃣ الآن أرسل اسم المنطقة:**');
          } else if (step === 2) {
            newZone.name = m.content;
            step++;
            m.reply('**✅ تم حفظ الاسم.\n\n3️⃣ الآن أرسل رابط صورة المنطقة:**');
          } else if (step === 3) {
            newZone.image = m.content;
            
            safezones.push(newZone);
            Data.set(`safezones_${interaction.guild.id}`, safezones);
            
            const successEmbed = new MessageEmbed()
              .setColor('#00ff00')
              .setTitle('✅ تم إضافة المنطقة الآمنة')
              .addField('ID', newZone.id, true)
              .addField('الاسم', newZone.name, true)
              .setImage(newZone.image)
              .setTimestamp();
            
            m.reply({ embeds: [successEmbed] });
            await m.delete().catch(() => {});
            collector.stop('success');
          }
        });

        collector.on('end', (collected, reason) => {
          if (reason === 'time') {
            interaction.channel.send('**⏱️ انتهى الوقت! تم إلغاء العملية.**');
          }
        });

        return;
      }

      // تعديل منطقة
      if (action === 'edit_zone') {
        if (safezones.length === 0) {
          return interaction.update({ 
            embeds: [new MessageEmbed().setColor(Color).setDescription('**❌ لا توجد مناطق للتعديل.**')], 
            components: [] 
          });
        }

        const selectMenu = new MessageSelectMenu()
          .setCustomId('select_zone_to_edit')
          .setPlaceholder('اختر المنطقة للتعديل')
          .addOptions(safezones.map(zone => ({
            label: zone.name,
            description: `ID: ${zone.id}`,
            value: zone.id,
            emoji: zone.emoji || '🛡️'
          })));

        const row = new MessageActionRow().addComponents(selectMenu);

        const embed = new MessageEmbed()
          .setColor(Color)
          .setTitle('✏️ اختر المنطقة للتعديل')
          .setDescription('**اختر المنطقة التي تريد تعديلها:**')
          .setTimestamp();

        return interaction.update({ embeds: [embed], components: [row] });
      }

      // حذف منطقة
      if (action === 'delete_zone') {
        if (safezones.length === 0) {
          return interaction.update({ 
            embeds: [new MessageEmbed().setColor(Color).setDescription('**❌ لا توجد مناطق للحذف.**')], 
            components: [] 
          });
        }

        const selectMenu = new MessageSelectMenu()
          .setCustomId('select_zone_to_delete')
          .setPlaceholder('اختر المنطقة للحذف')
          .addOptions(safezones.map(zone => ({
            label: zone.name,
            description: `ID: ${zone.id}`,
            value: String(zone.id),
            emoji: '🗑️'
          })));

        const row = new MessageActionRow().addComponents(selectMenu);

        const embed = new MessageEmbed()
          .setColor('#ff0000')
          .setTitle('⚠️ حذف منطقة آمنة')
          .setDescription('**اختر المنطقة التي تريد حذفها:**')
          .setTimestamp();

        return interaction.update({ embeds: [embed], components: [row] });
      }
    }

    // معالج اختيار منطقة للتعديل
    if (interaction.isSelectMenu() && interaction.customId === 'select_zone_to_edit') {
      const zoneId = interaction.values[0];
      const safezones = Data.get(`safezones_${interaction.guild.id}`) || [];
      const zone = safezones.find(z => z.id === zoneId);
      const Color = Data.get(`Guild_Color = ${interaction.guild.id}`) || '#a7a9a9';

      const selectMenu = new MessageSelectMenu()
        .setCustomId(`edit_zone_menu_${zoneId}`)
        .setPlaceholder('اختر ما تريد تعديله')
        .addOptions([
          {
            label: 'تعديل الاسم',
            description: 'تغيير اسم المنطقة',
            value: 'edit_name',
            emoji: '📝'
          },
          {
            label: 'تعديل الإيموجي',
            description: 'تغيير إيموجي المنطقة',
            value: 'edit_emoji',
            emoji: '😀'
          },
          {
            label: 'تعديل الصورة',
            description: 'تغيير صورة المنطقة',
            value: 'edit_image',
            emoji: '🖼️'
          }
        ]);

      const row = new MessageActionRow().addComponents(selectMenu);

      const embed = new MessageEmbed()
        .setColor(Color)
        .setTitle('✏️ تعديل المنطقة الآمنة')
        .addField('ID', zone.id, true)
        .addField('الاسم', zone.name, true)
        .addField('الإيموجي', zone.emoji || '🛡️', true)
        .setImage(zone.image)
        .setDescription('اختر ما تريد تعديله:')
        .setTimestamp();

      return interaction.update({ embeds: [embed], components: [row] });
    }

    // معالج حذف منطقة
    if (interaction.isSelectMenu() && interaction.customId === 'select_zone_to_delete') {
      const zoneId = interaction.values[0];
      let safezones = Data.get(`safezones_${interaction.guild.id}`) || [];
      console.log('Attempting to delete zone:', zoneId);
      console.log('Available zones:', safezones.map(z => ({ id: z.id, name: z.name })));
      
      // البحث باستخدام مقارنة نصية
      const zone = safezones.find(z => String(z.id) === String(zoneId));
      const Color = Data.get(`Guild_Color = ${interaction.guild.id}`) || '#a7a9a9';

      if (!zone) {
        console.log('Zone not found!');
        return interaction.update({ 
          embeds: [new MessageEmbed().setColor(Color).setDescription('**❌ المنطقة غير موجودة.**')], 
          components: [] 
        });
      }

      const deletedZone = zone;
      const newSafezones = safezones.filter(z => String(z.id) !== String(zoneId));
      Data.set(`safezones_${interaction.guild.id}`, newSafezones);
      console.log('Zone deleted successfully:', deletedZone.name);

      const backButton = new MessageButton()
        .setCustomId('back_to_safezones')
        .setLabel('العودة للمناطق الآمنة')
        .setStyle('PRIMARY')
        .setEmoji('🔙');

      const backRow = new MessageActionRow().addComponents(backButton);

      const embed = new MessageEmbed()
        .setColor('#00ff00')
        .setTitle('✅ تم حذف المنطقة الآمنة')
        .setDescription(`تم حذف المنطقة **${deletedZone.name}** (ID: ${deletedZone.id}) بنجاح`)
        .setTimestamp();

      return interaction.update({ embeds: [embed], components: [backRow] });
    }

    // معالج قوائم تعديل القوانين
    if (interaction.isSelectMenu() && interaction.customId.startsWith('edit_rule_menu_')) {
      const ruleId = interaction.customId.replace('edit_rule_menu_', '');
      const action = interaction.values[0];
      const path = require('path');
      const rulesPath = path.join(process.cwd(), 'data', 'rules.json');
      const rules = JSON.parse(fs.readFileSync(rulesPath, 'utf-8'));
      const rule = rules.find(r => r.id === ruleId);

      if (!rule) {
        return interaction.reply({ content: '**❌ القانون غير موجود!**', ephemeral: true });
      }

      // تحديث العنوان
      if (action === 'update_title') {
        await interaction.reply({ content: '**📝 أرسل العنوان الجديد للقانون:\n(لديك دقيقتان)**', ephemeral: true });

        const filter = m => m.author.id === interaction.user.id;
        const collector = interaction.channel.createMessageCollector({ filter, time: 120000, max: 1 });

        collector.on('collect', async (m) => {
          rule.title = m.content;
          fs.writeFileSync(rulesPath, JSON.stringify(rules, null, 2), 'utf-8');
          
          const Color = Data.get(`Guild_Color = ${interaction.guild.id}`) || '#00ff00';
          const embed = new MessageEmbed()
            .setColor(Color)
            .setTitle('✅ تم تحديث العنوان')
            .addField('ID', rule.id, true)
            .addField('العنوان الجديد', rule.title, true)
            .setTimestamp();
          
          await m.reply({ embeds: [embed] });
          await m.delete().catch(() => {});
        });
      }

      // تحديث المحتوى
      if (action === 'update_content') {
        await interaction.reply({ content: '**📄 أرسل المحتوى الجديد للقانون:\n(لديك 5 دقائق)**', ephemeral: true });

        const filter = m => m.author.id === interaction.user.id;
        const collector = interaction.channel.createMessageCollector({ filter, time: 300000, max: 1 });

        collector.on('collect', async (m) => {
          const dataPath = path.join(process.cwd(), 'data', rule.description);
          fs.writeFileSync(dataPath, m.content, 'utf-8');
          
          const Color = Data.get(`Guild_Color = ${interaction.guild.id}`) || '#00ff00';
          const embed = new MessageEmbed()
            .setColor(Color)
            .setTitle('✅ تم تحديث المحتوى')
            .addField('ID', rule.id, true)
            .addField('العنوان', rule.title, true)
            .setDescription('تم حفظ المحتوى الجديد بنجاح')
            .setTimestamp();
          
          await m.reply({ embeds: [embed] });
          await m.delete().catch(() => {});
        });
      }

      // تحديث الإيموجي
      if (action === 'update_emoji') {
        await interaction.reply({ content: '**😀 أرسل ID الإيموجي الجديد:\n(لديك دقيقتان)**', ephemeral: true });

        const filter = m => m.author.id === interaction.user.id;
        const collector = interaction.channel.createMessageCollector({ filter, time: 120000, max: 1 });

        collector.on('collect', async (m) => {
          rule.setEmoji = m.content;
          fs.writeFileSync(rulesPath, JSON.stringify(rules, null, 2), 'utf-8');
          
          const Color = Data.get(`Guild_Color = ${interaction.guild.id}`) || '#00ff00';
          const embed = new MessageEmbed()
            .setColor(Color)
            .setTitle('✅ تم تحديث الإيموجي')
            .addField('ID', rule.id, true)
            .addField('الإيموجي الجديد', rule.setEmoji, true)
            .setTimestamp();
          
          await m.reply({ embeds: [embed] });
          await m.delete().catch(() => {});
        });
      }
    }

    // معالج قوائم تعديل المناطق الآمنة
    if (interaction.isSelectMenu() && interaction.customId.startsWith('edit_zone_menu_')) {
      const zoneId = interaction.customId.replace('edit_zone_menu_', '');
      const action = interaction.values[0];
      const safezones = Data.get(`safezones_${interaction.guild.id}`) || [];
      const zone = safezones.find(z => z.id === zoneId);

      if (!zone) {
        return interaction.reply({ content: '**❌ المنطقة غير موجودة!**', ephemeral: true });
      }

      // تعديل الاسم
      if (action === 'edit_name') {
        await interaction.reply({ content: '**📝 أرسل الاسم الجديد للمنطقة:\n(لديك دقيقتان)**', ephemeral: true });

        const filter = m => m.author.id === interaction.user.id;
        const collector = interaction.channel.createMessageCollector({ filter, time: 120000, max: 1 });

        collector.on('collect', async (m) => {
          zone.name = m.content;
          Data.set(`safezones_${interaction.guild.id}`, safezones);
          
          const Color = Data.get(`Guild_Color = ${interaction.guild.id}`) || '#00ff00';
          const embed = new MessageEmbed()
            .setColor(Color)
            .setTitle('✅ تم تحديث اسم المنطقة')
            .addField('الاسم الجديد', zone.name, true)
            .setTimestamp();
          
          await m.reply({ embeds: [embed] });
          await m.delete().catch(() => {});
        });
      }

      // تعديل الإيموجي
      if (action === 'edit_emoji') {
        await interaction.reply({ content: '**😀 أرسل ID الإيموجي الجديد:\n(لديك دقيقتان)**', ephemeral: true });

        const filter = m => m.author.id === interaction.user.id;
        const collector = interaction.channel.createMessageCollector({ filter, time: 120000, max: 1 });

        collector.on('collect', async (m) => {
          zone.emoji = m.content;
          Data.set(`safezones_${interaction.guild.id}`, safezones);
          
          const Color = Data.get(`Guild_Color = ${interaction.guild.id}`) || '#00ff00';
          const embed = new MessageEmbed()
            .setColor(Color)
            .setTitle('✅ تم تحديث الإيموجي')
            .addField('المنطقة', zone.name, true)
            .addField('الإيموجي الجديد', zone.emoji, true)
            .setTimestamp();
          
          await m.reply({ embeds: [embed] });
          await m.delete().catch(() => {});
        });
      }

      // تعديل الصورة
      if (action === 'edit_image') {
        await interaction.reply({ content: '**🖼️ أرسل رابط الصورة الجديدة:\n(لديك دقيقتان)**', ephemeral: true });

        const filter = m => m.author.id === interaction.user.id;
        const collector = interaction.channel.createMessageCollector({ filter, time: 120000, max: 1 });

        collector.on('collect', async (m) => {
          zone.image = m.content;
          Data.set(`safezones_${interaction.guild.id}`, safezones);
          
          const Color = Data.get(`Guild_Color = ${interaction.guild.id}`) || '#00ff00';
          const embed = new MessageEmbed()
            .setColor(Color)
            .setTitle('✅ تم تحديث صورة المنطقة')
            .addField('المنطقة', zone.name, true)
            .setImage(zone.image)
            .setTimestamp();
          
          await m.reply({ embeds: [embed] });
          await m.delete().catch(() => {});
        });
      }
    }

    // معالج أزرار الحذف
    if (interaction.isButton()) {
      const path = require('path');
      const rulesPath = path.join(process.cwd(), 'data', 'rules.json');

      // تحديث العنوان (القديم - للحفاظ على التوافق)
      if (interaction.customId.startsWith('update_title_')) {
        const ruleId = interaction.customId.replace('update_title_', '');
        const rules = JSON.parse(fs.readFileSync(rulesPath, 'utf-8'));
        const rule = rules.find(r => r.id === ruleId);

        if (!rule) {
          return interaction.reply({ content: '**❌ القانون غير موجود!**', ephemeral: true });
        }

        await interaction.reply({ content: '**📝 أرسل العنوان الجديد للقانون:\n(لديك دقيقتان)**', ephemeral: true });

        const filter = m => m.author.id === interaction.user.id;
        const collector = interaction.channel.createMessageCollector({ filter, time: 120000, max: 1 });

        collector.on('collect', async (m) => {
          rule.title = m.content;
          fs.writeFileSync(rulesPath, JSON.stringify(rules, null, 2), 'utf-8');
          
          const Color = Data.get(`Guild_Color = ${interaction.guild.id}`) || '#00ff00';
          const embed = new MessageEmbed()
            .setColor(Color)
            .setTitle('✅ تم تحديث العنوان')
            .addField('ID', rule.id, true)
            .addField('العنوان الجديد', rule.title, true)
            .setTimestamp();
          
          await m.reply({ embeds: [embed] });
          await m.delete().catch(() => {});
        });
      }

      // تحديث المحتوى
      if (interaction.customId.startsWith('update_content_')) {
        const ruleId = interaction.customId.replace('update_content_', '');
        const rules = JSON.parse(fs.readFileSync(rulesPath, 'utf-8'));
        const rule = rules.find(r => r.id === ruleId);

        if (!rule) {
          return interaction.reply({ content: '**❌ القانون غير موجود!**', ephemeral: true });
        }

        await interaction.reply({ content: '**📄 أرسل المحتوى الجديد للقانون:\n(لديك 5 دقائق)**', ephemeral: true });

        const filter = m => m.author.id === interaction.user.id;
        const collector = interaction.channel.createMessageCollector({ filter, time: 300000, max: 1 });

        collector.on('collect', async (m) => {
          const dataPath = path.join(process.cwd(), 'data', rule.description);
          fs.writeFileSync(dataPath, m.content, 'utf-8');
          
          const Color = Data.get(`Guild_Color = ${interaction.guild.id}`) || '#00ff00';
          const embed = new MessageEmbed()
            .setColor(Color)
            .setTitle('✅ تم تحديث المحتوى')
            .addField('ID', rule.id, true)
            .addField('العنوان', rule.title, true)
            .setDescription('تم حفظ المحتوى الجديد بنجاح')
            .setTimestamp();
          
          await m.reply({ embeds: [embed] });
          await m.delete().catch(() => {});
        });
      }

      // تأكيد الحذف
      if (interaction.customId.startsWith('confirm_delete_')) {
        const ruleId = interaction.customId.replace('confirm_delete_', '');
        let rules = JSON.parse(fs.readFileSync(rulesPath, 'utf-8'));
        const ruleIndex = rules.findIndex(r => r.id === ruleId);

        if (ruleIndex === -1) {
          return interaction.reply({ content: '**❌ القانون غير موجود!**', ephemeral: true });
        }

        const rule = rules[ruleIndex];
        const dataPath = path.join(process.cwd(), 'data', rule.description);
        
        // حذف ملف المحتوى
        if (fs.existsSync(dataPath)) {
          fs.unlinkSync(dataPath);
        }

        // حذف القانون من القائمة
        rules.splice(ruleIndex, 1);
        fs.writeFileSync(rulesPath, JSON.stringify(rules, null, 2), 'utf-8');

        const embed = new MessageEmbed()
          .setColor('#ff0000')
          .setTitle('🗑️ تم حذف القانون')
          .setDescription(`تم حذف القانون **${rule.title}** بنجاح`)
          .setTimestamp();

        await interaction.update({ embeds: [embed], components: [] });
      }

      // إلغاء الحذف
      if (interaction.customId.startsWith('cancel_delete_')) {
        const embed = new MessageEmbed()
          .setColor('#a7a9a9')
          .setTitle('❌ تم إلغاء الحذف')
          .setDescription('لم يتم حذف أي شيء')
          .setTimestamp();

        await interaction.update({ embeds: [embed], components: [] });
      }

      // العودة للمناطق الآمنة
      if (interaction.customId === 'back_to_safezones') {
        const safezones = Data.get(`safezones_${interaction.guild.id}`) || [];
        const Color = Data.get(`Guild_Color = ${interaction.guild.id}`) || '#a7a9a9';

        const selectMenu = new MessageSelectMenu()
          .setCustomId('safezones_submenu')
          .setPlaceholder('اختر إجراء للمناطق الآمنة')
          .addOptions([
            {
              label: 'عرض المناطق',
              description: 'عرض جميع المناطق الآمنة',
              value: 'list_zones',
              emoji: '📋'
            },
            {
              label: 'إضافة منطقة',
              description: 'إضافة منطقة آمنة جديدة',
              value: 'add_zone',
              emoji: '➕'
            },
            {
              label: 'تعديل منطقة',
              description: 'تعديل منطقة موجودة',
              value: 'edit_zone',
              emoji: '✏️'
            },
            {
              label: 'حذف منطقة',
              description: 'حذف منطقة آمنة',
              value: 'delete_zone',
              emoji: '🗑️'
            }
          ]);

        const row = new MessageActionRow().addComponents(selectMenu);

        const embed = new MessageEmbed()
          .setColor(Color)
          .setTitle('🛡️ إدارة المناطق الآمنة')
          .setDescription('**اختر الإجراء الذي تريد القيام به:**\n\n📋 **عرض المناطق** - عرض جميع المناطق المضافة\n➕ **إضافة منطقة** - إضافة منطقة آمنة جديدة\n✏️ **تعديل منطقة** - تعديل اسم أو إيموجي أو صورة منطقة\n🗑️ **حذف منطقة** - حذف منطقة آمنة')
          .addField('عدد المناطق الحالية', `${safezones.length}`, true)
          .setTimestamp();

        return interaction.update({ embeds: [embed], components: [row] });
      }

    }
  });
