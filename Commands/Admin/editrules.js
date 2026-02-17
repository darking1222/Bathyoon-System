const { MessageEmbed, MessageActionRow, MessageButton, MessageSelectMenu } = require("discord.js");
const { prefix } = require(`${process.cwd()}/config`);
const Pro = require(`pro.db`);
const Data = require(`pro.db`);
const fs = require('fs');
const path = require('path');

module.exports = {
  name: 'editrules',
  aliases: ["تعديل-القوانين", "تعديل_القوانين"],
  run: async (client, message, args) => {

    const isEnabled = Data.get(`command_enabled_${module.exports.name}`);
    if (isEnabled === false) {
        return; 
    }
    
    const Color = Data.get(`Guild_Color = ${message.guild.id}`) || '#a7a9a9';
    if (!Color) return;

    const db = Pro.get(`Allow - Command editrules = [ ${message.guild.id} ]`);
    const allowedRole = message.guild.roles.cache.get(db);
    const isAuthorAllowed = message.member.roles.cache.has(allowedRole?.id);

    if (!isAuthorAllowed && message.member.id !== db && !message.member.permissions.has('ADMINISTRATOR')) {
      return message.reply('**❌ يجب أن تكون أدمن لاستخدام هذا الأمر.**');
    }

    const rulesPath = path.join(process.cwd(), 'data', 'rules.json');
    
    if (!fs.existsSync(rulesPath)) {
      return message.reply('**❌ ملف القوانين غير موجود.**');
    }

    let rules = JSON.parse(fs.readFileSync(rulesPath, 'utf-8'));
    const action = args[0]?.toLowerCase();

    // القائمة الرئيسية
    if (!action) {
      const selectMenu = new MessageSelectMenu()
        .setCustomId('editrules_main_menu')
        .setPlaceholder('اختر العملية التي تريد تنفيذها')
        .addOptions([
          {
            label: 'عرض القوانين',
            description: 'عرض جميع القوانين المسجلة',
            value: 'list_rules',
            emoji: '📋'
          },
          {
            label: 'إضافة قانون',
            description: 'إضافة قانون جديد',
            value: 'add_rule',
            emoji: '➕'
          },
          {
            label: 'تحديث قانون',
            description: 'تعديل قانون موجود',
            value: 'update_rule',
            emoji: '✏️'
          },
          {
            label: 'إظهار/إخفاء قانون',
            description: 'تغيير حالة ظهور القانون',
            value: 'toggle_rule',
            emoji: '👁️'
          },
          {
            label: 'حذف قانون',
            description: 'حذف قانون موجود',
            value: 'delete_rule',
            emoji: '🗑️'
          },
          {
            label: 'تعديل صورة القوانين',
            description: 'تغيير الصورة الرئيسية',
            value: 'edit_image',
            emoji: '🖼️'
          },
          {
            label: 'إدارة المناطق الآمنة',
            description: 'إضافة وتعديل المناطق الآمنة',
            value: 'manage_safezones',
            emoji: '🛡️'
          }
        ]);

      const row = new MessageActionRow().addComponents(selectMenu);

      const embed = new MessageEmbed()
        .setColor(Color)
        .setTitle('🔧 تعديل القوانين والمناطق الآمنة')
        .setDescription('**اختر العملية التي تريد تنفيذها من القائمة المنسدلة:**')
        .addField('📊 الإحصائيات', `القوانين: ${rules.length}\nالمناطق: ${(Data.get(`safezones_${message.guild.id}`) || []).length}`, true)
        .setFooter({ text: message.guild.name, iconURL: message.guild.iconURL({ dynamic: true }) })
        .setTimestamp();

      return message.reply({ embeds: [embed], components: [row] });
    }

    // عرض القوانين
    if (action === 'عرض' || action === 'list') {
      const embed = new MessageEmbed()
        .setColor(Color)
        .setTitle('📋 قائمة القوانين')
        .setDescription(rules.map((rule, index) => {
          const status = rule.hidden ? '🙈 مخفي' : '👁️ ظاهر';
          return `**${index + 1}.** ID: \`${rule.id}\`\n└ العنوان: ${rule.title}\n└ الحالة: ${status}`;
        }).join('\n\n') || 'لا توجد قوانين')
        .setFooter({ text: `إجمالي القوانين: ${rules.length}`, iconURL: message.guild.iconURL({ dynamic: true }) })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    // إضافة قانون جديد
    if (action === 'اضافة' || action === 'add') {
      const embed = new MessageEmbed()
        .setColor(Color)
        .setTitle('➕ إضافة قانون جديد')
        .setDescription('قم بإرسال المعلومات بالترتيب التالي:\n\n**1️⃣ ID القانون** (مثال: `rule7`)\n**2️⃣ عنوان القانون** (مثال: `قوانين جديدة`)\n**3️⃣ محتوى القانون** (النص الكامل)\n\nلديك 5 دقائق للرد.')
        .setFooter({ text: 'اكتب "الغاء" للإلغاء', iconURL: message.guild.iconURL({ dynamic: true }) });

      await message.reply({ embeds: [embed] });

      const filter = m => m.author.id === message.author.id;
      const collector = message.channel.createMessageCollector({ filter, time: 300000 });
      
      let step = 1;
      let newRule = { setEmoji: "1406135979349377127", hidden: false };

      collector.on('collect', async (m) => {
        if (m.content.toLowerCase() === 'الغاء' || m.content.toLowerCase() === 'cancel') {
          collector.stop('cancelled');
          return m.reply('**❌ تم إلغاء العملية.**');
        }

        if (step === 1) {
          // ID القانون
          if (rules.find(r => r.id === m.content)) {
            return m.reply('**❌ هذا الـ ID موجود مسبقاً! أرسل ID آخر.**');
          }
          newRule.id = m.content;
          step++;
          m.reply('**✅ تم حفظ الـ ID.\n\n2️⃣ الآن أرسل عنوان القانون:**');
        } else if (step === 2) {
          // عنوان القانون
          newRule.title = m.content;
          step++;
          m.reply('**✅ تم حفظ العنوان.\n\n3️⃣ الآن أرسل محتوى القانون الكامل:**');
        } else if (step === 3) {
          // محتوى القانون
          const fileNumber = rules.length + 1;
          const fileName = `file${fileNumber}.txt`;
          const dataPath = path.join(process.cwd(), 'data', 'rules', fileName);
          
          // إنشاء المجلد إذا لم يكن موجوداً
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
            .addField('الملف', newRule.description, true)
            .setFooter({ text: message.guild.name, iconURL: message.guild.iconURL({ dynamic: true }) })
            .setTimestamp();
          
          m.reply({ embeds: [successEmbed] });
          collector.stop('success');
        }
      });

      collector.on('end', (collected, reason) => {
        if (reason === 'time') {
          message.channel.send('**⏱️ انتهى الوقت! تم إلغاء العملية.**');
        }
      });

      return;
    }

    // تحديث قانون
    if (action === 'تحديث' || action === 'update') {
      if (!args[1]) {
        return message.reply(`**❌ يرجى تحديد ID القانون.\n\`${prefix}تعديل-القوانين تحديث [id]\`**`);
      }

      const ruleId = args[1];
      const rule = rules.find(r => r.id === ruleId);

      if (!rule) {
        return message.reply('**❌ القانون غير موجود!**');
      }

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
        .addField('الملف', rule.description, false)
        .setDescription('اختر ما تريد تحديثه من القائمة:')
        .setFooter({ text: message.guild.name, iconURL: message.guild.iconURL({ dynamic: true }) });

      return message.reply({ embeds: [embed], components: [row] });
    }

    // إظهار قانون
    if (action === 'اظهار' || action === 'show') {
      if (!args[1]) {
        return message.reply(`**❌ يرجى تحديد ID القانون.\n\`${prefix}تعديل-القوانين اظهار [id]\`**`);
      }

      const ruleId = args[1];
      const rule = rules.find(r => r.id === ruleId);

      if (!rule) {
        return message.reply('**❌ القانون غير موجود!**');
      }

      rule.hidden = false;
      fs.writeFileSync(rulesPath, JSON.stringify(rules, null, 2), 'utf-8');

      const embed = new MessageEmbed()
        .setColor('#00ff00')
        .setTitle('👁️ تم إظهار القانون')
        .addField('ID', rule.id, true)
        .addField('العنوان', rule.title, true)
        .setDescription('القانون الآن ظاهر في قائمة القوانين')
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    // إخفاء قانون
    if (action === 'اخفاء' || action === 'hide') {
      if (!args[1]) {
        return message.reply(`**❌ يرجى تحديد ID القانون.\n\`${prefix}تعديل-القوانين اخفاء [id]\`**`);
      }

      const ruleId = args[1];
      const rule = rules.find(r => r.id === ruleId);

      if (!rule) {
        return message.reply('**❌ القانون غير موجود!**');
      }

      rule.hidden = true;
      fs.writeFileSync(rulesPath, JSON.stringify(rules, null, 2), 'utf-8');

      const embed = new MessageEmbed()
        .setColor('#ff9900')
        .setTitle('🙈 تم إخفاء القانون')
        .addField('ID', rule.id, true)
        .addField('العنوان', rule.title, true)
        .setDescription('القانون الآن مخفي من قائمة القوانين')
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    // حذف قانون
    if (action === 'حذف' || action === 'delete') {
      if (!args[1]) {
        return message.reply(`**❌ يرجى تحديد ID القانون.\n\`${prefix}تعديل-القوانين حذف [id]\`**`);
      }

      const ruleId = args[1];
      const ruleIndex = rules.findIndex(r => r.id === ruleId);

      if (ruleIndex === -1) {
        return message.reply('**❌ القانون غير موجود!**');
      }

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

      return message.reply({ embeds: [embed], components: [row] });
    }

    // تعديل الإيموجي
    if (action === 'ايموجي' || action === 'emoji') {
      if (!args[1]) {
        return message.reply(`**❌ يرجى تحديد ID القانون.\n\`${prefix}تعديل-القوانين ايموجي [id]\`**`);
      }

      const ruleId = args[1];
      const rule = rules.find(r => r.id === ruleId);

      if (!rule) {
        return message.reply('**❌ القانون غير موجود!**');
      }

      const embed = new MessageEmbed()
        .setColor(Color)
        .setTitle('😀 تعديل الإيموجي')
        .addField('القانون', rule.title, true)
        .addField('ID', rule.id, true)
        .addField('الإيموجي الحالي', rule.setEmoji || 'غير محدد', false)
        .setDescription('**أرسل ID الإيموجي الجديد:**\n(لديك دقيقتان)')
        .setFooter({ text: 'اكتب "الغاء" للإلغاء', iconURL: message.guild.iconURL({ dynamic: true }) });

      await message.reply({ embeds: [embed] });

      const filter = m => m.author.id === message.author.id;
      const collector = message.channel.createMessageCollector({ filter, time: 120000, max: 1 });

      collector.on('collect', async (m) => {
        if (m.content.toLowerCase() === 'الغاء' || m.content.toLowerCase() === 'cancel') {
          return m.reply('**❌ تم إلغاء العملية.**');
        }

        rule.setEmoji = m.content;
        fs.writeFileSync(rulesPath, JSON.stringify(rules, null, 2), 'utf-8');

        const successEmbed = new MessageEmbed()
          .setColor('#00ff00')
          .setTitle('✅ تم تحديث الإيموجي')
          .addField('القانون', rule.title, true)
          .addField('ID', rule.id, true)
          .addField('الإيموجي الجديد', rule.setEmoji, false)
          .setTimestamp();

        await m.reply({ embeds: [successEmbed] });
        await m.delete().catch(() => {});
      });

      return;
    }

    // تعديل الصورة
    if (action === 'صورة' || action === 'image') {
      if (!args[1]) {
        return message.reply(`**❌ يرجى إرسال رابط الصورة.\n\`${prefix}تعديل-القوانين صورة [url]\`**`);
      }

      const imageUrl = args[1];
      
      // حفظ رابط الصورة في قاعدة البيانات
      Data.set(`rules_image_${message.guild.id}`, imageUrl);

      const embed = new MessageEmbed()
        .setColor('#00ff00')
        .setTitle('✅ تم تحديث صورة القوانين')
        .setDescription('سيتم استخدام هذه الصورة في رسالة القوانين')
        .setImage(imageUrl)
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    // نظام المناطق الآمنة
    if (action === 'مناطق' || action === 'safezones') {
      const subAction = args[1]?.toLowerCase();

      // القائمة الرئيسية للمناطق
      if (!subAction) {
        const safezones = Data.get(`safezones_${message.guild.id}`) || [];
        
        const embed = new MessageEmbed()
          .setColor(Color)
          .setTitle('🛡️ إدارة المناطق الآمنة')
          .setDescription('**الأوامر المتاحة:**')
          .addField('➕ إضافة منطقة', `\`${prefix}تعديل-القوانين مناطق اضافة\``, true)
          .addField('📋 عرض المناطق', `\`${prefix}تعديل-القوانين مناطق عرض\``, true)
          .addField('✏️ تعديل منطقة', `\`${prefix}تعديل-القوانين مناطق تعديل [name]\``, true)
          .addField('🗑️ حذف منطقة', `\`${prefix}تعديل-القوانين مناطق حذف [name]\``, true)
          .addField('📊 الحالة', `المناطق المسجلة: ${safezones.length}`, false)
          .setFooter({ text: message.guild.name, iconURL: message.guild.iconURL({ dynamic: true }) })
          .setTimestamp();

        return message.reply({ embeds: [embed] });
      }

      let safezones = Data.get(`safezones_${message.guild.id}`) || [];

      // إضافة منطقة آمنة
      if (subAction === 'اضافة' || subAction === 'add') {
        const embed = new MessageEmbed()
          .setColor(Color)
          .setTitle('➕ إضافة منطقة آمنة جديدة')
          .setDescription('قم بإرسال المعلومات بالترتيب:\n\n**1️⃣ ID المنطقة** (مثال: `hospital`)\n**2️⃣ اسم المنطقة** (مثال: `المستشفى العام`)\n**3️⃣ رابط الصورة** (رابط URL للصورة)\n\nلديك 5 دقائق للرد.')
          .setFooter({ text: 'اكتب "الغاء" للإلغاء', iconURL: message.guild.iconURL({ dynamic: true }) });

        await message.reply({ embeds: [embed] });

        const filter = m => m.author.id === message.author.id;
        const collector = message.channel.createMessageCollector({ filter, time: 300000 });
        
        let step = 1;
        let newZone = { emoji: '🛡️' };

        collector.on('collect', async (m) => {
          if (m.content.toLowerCase() === 'الغاء' || m.content.toLowerCase() === 'cancel') {
            collector.stop('cancelled');
            return m.reply('**❌ تم إلغاء العملية.**');
          }

          if (step === 1) {
            // ID المنطقة
            if (safezones.find(z => z.id === m.content)) {
              return m.reply('**❌ هذا الـ ID موجود مسبقاً! أرسل ID آخر.**');
            }
            newZone.id = m.content;
            step++;
            m.reply('**✅ تم حفظ الـ ID.\n\n2️⃣ الآن أرسل اسم المنطقة:**');
          } else if (step === 2) {
            // اسم المنطقة
            newZone.name = m.content;
            step++;
            m.reply('**✅ تم حفظ الاسم.\n\n3️⃣ الآن أرسل رابط صورة المنطقة:**');
          } else if (step === 3) {
            // صورة المنطقة
            newZone.image = m.content;
            
            safezones.push(newZone);
            Data.set(`safezones_${message.guild.id}`, safezones);
            
            const successEmbed = new MessageEmbed()
              .setColor('#00ff00')
              .setTitle('✅ تم إضافة المنطقة الآمنة')
              .addField('ID', newZone.id, true)
              .addField('الاسم', newZone.name, true)
              .setImage(newZone.image)
              .setFooter({ text: message.guild.name, iconURL: message.guild.iconURL({ dynamic: true }) })
              .setTimestamp();
            
            m.reply({ embeds: [successEmbed] });
            collector.stop('success');
          }
        });

        collector.on('end', (collected, reason) => {
          if (reason === 'time') {
            message.channel.send('**⏱️ انتهى الوقت! تم إلغاء العملية.**');
          }
        });

        return;
      }

      // عرض المناطق
      if (subAction === 'عرض' || subAction === 'list') {
        if (safezones.length === 0) {
          return message.reply('**❌ لا توجد مناطق آمنة مسجلة.**');
        }

        const embed = new MessageEmbed()
          .setColor(Color)
          .setTitle('🛡️ قائمة المناطق الآمنة')
          .setDescription(safezones.map((zone, index) => {
            return `**${index + 1}.** ${zone.name}\n└ ID: \`${zone.id}\`\n└ الإيموجي: ${zone.emoji || '🛡️'}`;
          }).join('\n\n'))
          .setFooter({ text: `إجمالي المناطق: ${safezones.length}`, iconURL: message.guild.iconURL({ dynamic: true }) })
          .setTimestamp();

        return message.reply({ embeds: [embed] });
      }

      // تعديل منطقة
      if (subAction === 'تعديل' || subAction === 'edit') {
        const zoneId = args[2];
        
        if (!zoneId) {
          return message.reply(`**❌ يرجى تحديد ID المنطقة.\n\`${prefix}تعديل-القوانين مناطق تعديل [id]\`**`);
        }

        const zone = safezones.find(z => z.id === zoneId);

        if (!zone) {
          return message.reply('**❌ المنطقة غير موجودة!**');
        }

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
          .setDescription('اختر ما تريد تعديله من القائمة:')
          .setFooter({ text: message.guild.name, iconURL: message.guild.iconURL({ dynamic: true }) });

        return message.reply({ embeds: [embed], components: [row] });
      }

      // حذف منطقة
      if (subAction === 'حذف' || subAction === 'delete') {
        const zoneId = args[2];
        
        if (!zoneId) {
          return message.reply(`**❌ يرجى تحديد ID المنطقة.\n\`${prefix}تعديل-القوانين مناطق حذف [id]\`**`);
        }

        const zoneIndex = safezones.findIndex(z => z.id === zoneId);

        if (zoneIndex === -1) {
          return message.reply('**❌ المنطقة غير موجودة!**');
        }

        const deletedZone = safezones[zoneIndex];
        safezones.splice(zoneIndex, 1);
        Data.set(`safezones_${message.guild.id}`, safezones);

        const embed = new MessageEmbed()
          .setColor('#ff0000')
          .setTitle('🗑️ تم حذف المنطقة الآمنة')
          .setDescription(`تم حذف المنطقة **${deletedZone.name}** بنجاح`)
          .setTimestamp();

        return message.reply({ embeds: [embed] });
      }
    }
  }
};
