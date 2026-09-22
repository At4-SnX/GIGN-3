// ============================================================================
//  GIGN RP — BOT DE TICKETS (3 catégories)
//  - !ticketpanel : envoie le panel Components V2 (image + 3 boutons)
//  - Chaque bouton crée un salon privé dans la catégorie Discord correspondante
//  - Bouton "Fermer" puis "Supprimer" pour clôturer un ticket
//  - Statut du bot en "En direct" (Streaming) avec un lien configurable
//  - Toute la configuration se trouve dans config.js et .env
// ============================================================================

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const {
  Client,
  GatewayIntentBits,
  ActivityType,
  MessageFlags,
  PermissionFlagsBits,
  ChannelType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  AttachmentBuilder,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
} = require('discord.js');
const config = require('./config');

// ----------------------------------------------------------------------------
// Petite base de données locale (JSON) : tickets ouverts
// ----------------------------------------------------------------------------
const DATA_DIR = path.join(__dirname, 'data');
const DB_PATH = path.join(DATA_DIR, 'tickets.json');

function loadDb() {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (!fs.existsSync(DB_PATH)) fs.writeFileSync(DB_PATH, JSON.stringify({ tickets: [] }, null, 2));
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  } catch (err) {
    console.error('Impossible de charger data/tickets.json, base vide utilisée.', err);
    return { tickets: [] };
  }
}

function saveDb(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

let db = loadDb();

function findOpenTicket(userId, type) {
  return db.tickets.find((t) => t.userId === userId && t.type === type && t.status === 'open');
}

function slugify(str) {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // enlève les accents
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 20);
}

// ----------------------------------------------------------------------------
// Client Discord
// ----------------------------------------------------------------------------
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages, // requis pour lire !ticketpanel
    GatewayIntentBits.MessageContent, // requis pour lire le contenu des messages (intent privilégié)
  ],
});

client.once('ready', async () => {
  console.log(`✅ Connecté en tant que ${client.user.tag}`);

  client.user.setPresence({
    status: config.PRESENCE_STATUS,
    activities: [
      {
        name: config.STATUS_TEXT, // 🔗discord.gg/bordeauxrp
        type: ActivityType.Streaming,
        url: config.STREAM_URL,
      },
    ],
  });
});

// ----------------------------------------------------------------------------
// Construit le panel Components V2 (image + explication + 3 boutons)
// ----------------------------------------------------------------------------
function buildPanelPayload() {
  const attachment = new AttachmentBuilder(path.join(__dirname, config.PANEL_IMAGE_PATH), {
    name: 'ticket-banner.png',
  });

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId('ticket-select')
    .setPlaceholder(config.SELECT_MENU_PLACEHOLDER)
    .addOptions(
      Object.entries(config.TICKET_TYPES).map(([type, def]) => ({
        label: def.LABEL,
        value: type,
        description: def.SELECT_DESCRIPTION,
        emoji: def.EMOJI,
      }))
    );

  const container = new ContainerBuilder()
    .setAccentColor(parseInt(config.PANEL_COLOR.replace('#', ''), 16))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${config.PANEL_TITLE}\n${config.PANEL_MESSAGE}`))
    .addMediaGalleryComponents(
      new MediaGalleryBuilder().addItems(
        new MediaGalleryItemBuilder().setURL('attachment://ticket-banner.png').setDescription('Support GIGN')
      )
    )
    .addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ${config.PANEL_FOOTER}`))
    .addActionRowComponents(new ActionRowBuilder().addComponents(selectMenu));

  return { components: [container], files: [attachment] };
}

// ----------------------------------------------------------------------------
// Commande texte "!ticketpanel"
// ----------------------------------------------------------------------------
client.on('messageCreate', async (message) => {
  try {
    if (message.author.bot || !message.guild) return;
    if (message.content.trim().toLowerCase() !== config.TEXT_COMMAND.toLowerCase()) return;

    if (config.PANEL_REQUIRES_MANAGE_GUILD && !message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return message.reply('❌ Tu n\'as pas la permission d\'envoyer le panel de tickets.');
    }

    const payload = buildPanelPayload();
    await message.channel.send({ ...payload, flags: MessageFlags.IsComponentsV2 });
  } catch (err) {
    console.error('Erreur lors de l\'envoi du panel de tickets :', err);
  }
});

// ----------------------------------------------------------------------------
// Interactions (boutons)
// ----------------------------------------------------------------------------
client.on('interactionCreate', async (interaction) => {
  try {
    if (interaction.isStringSelectMenu() && interaction.customId === 'ticket-select') {
      const type = interaction.values[0];
      return handleOpenTicket(interaction, type);
    }
    if (!interaction.isButton()) return;

    if (interaction.customId === 'ticket-close') return handleCloseTicket(interaction);
    if (interaction.customId === 'ticket-delete') return handleDeleteTicket(interaction);
  } catch (err) {
    console.error('Erreur lors du traitement de l\'interaction ticket :', err);
    if (interaction.isRepliable() && !interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: '❌ Une erreur est survenue, réessaie plus tard.', ephemeral: true });
    }
  }
});

// --- Ouverture d'un ticket ---------------------------------------------------
async function handleOpenTicket(interaction, type) {
  const def = config.TICKET_TYPES[type];
  if (!def) return interaction.reply({ content: '❌ Catégorie de ticket inconnue.', ephemeral: true });

  if (!def.CATEGORY_ID) {
    return interaction.reply({
      content: `❌ Aucune catégorie Discord n\'est configurée pour "${def.LABEL}" (variable manquante dans le .env).`,
      ephemeral: true,
    });
  }

  const existing = findOpenTicket(interaction.user.id, type);
  if (existing) {
    return interaction.reply({
      content: config.ALREADY_OPEN_MESSAGE.replace('{channel}', `<#${existing.channelId}>`),
      ephemeral: true,
    });
  }

  await interaction.deferReply({ ephemeral: true });

  const overwrites = [
    { id: interaction.guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
    {
      id: interaction.user.id,
      allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
    },
    {
      id: interaction.client.user.id,
      allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels],
    },
  ];
  if (config.STAFF_ROLE_ID) {
    overwrites.push({
      id: config.STAFF_ROLE_ID,
      allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
    });
  }

  let channel;
  try {
    channel = await interaction.guild.channels.create({
      name: `${def.CHANNEL_PREFIX}-${slugify(interaction.user.username) || interaction.user.id}`,
      type: ChannelType.GuildText,
      parent: def.CATEGORY_ID,
      topic: `Ticket ${type} — ouvert par ${interaction.user.tag} (${interaction.user.id})`,
      permissionOverwrites: overwrites,
    });
  } catch (err) {
    console.error('Erreur lors de la création du salon de ticket :', err);
    return interaction.editReply({
      content: '❌ Impossible de créer le salon (vérifie que le bot a la permission "Gérer les salons" et l\'accès à la catégorie configurée).',
    });
  }

  db.tickets.push({
    channelId: channel.id,
    userId: interaction.user.id,
    type,
    status: 'open',
    createdAt: new Date().toISOString(),
  });
  saveDb(db);

  const closeButton = new ButtonBuilder()
    .setCustomId('ticket-close')
    .setLabel(config.CLOSE_BUTTON_LABEL)
    .setStyle(ButtonStyle.Danger);

  const staffMention = config.STAFF_ROLE_ID ? `<@&${config.STAFF_ROLE_ID}> ` : '';
  const openContainer = new ContainerBuilder()
    .setAccentColor(parseInt(config.PANEL_COLOR.replace('#', ''), 16))
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `${staffMention}<@${interaction.user.id}>\n\n## ${def.OPEN_TITLE}\n${def.OPEN_MESSAGE.replace('{user}', `<@${interaction.user.id}>`)}`
      )
    )
    .addActionRowComponents(new ActionRowBuilder().addComponents(closeButton));

  // ⚠️ Le flag IsComponentsV2 interdit le champ "content" sur le message :
  // les mentions doivent passer par le texte du container ci-dessus.
  try {
    await channel.send({
      components: [openContainer],
      flags: MessageFlags.IsComponentsV2,
      allowedMentions: { parse: ['users', 'roles'] },
    });
  } catch (err) {
    console.error('Erreur lors de l\'envoi du message dans le salon de ticket :', err);
    return interaction.editReply({
      content: `⚠️ Le salon ${channel} a été créé, mais le message d'accueil n'a pas pu être envoyé. Vérifie les logs Railway.`,
    });
  }

  await interaction.editReply({ content: `✅ Ton ticket a été créé : ${channel}` });
}

// --- Fermeture d'un ticket -----------------------------------------------------
async function handleCloseTicket(interaction) {
  const ticket = db.tickets.find((t) => t.channelId === interaction.channel.id && t.status === 'open');
  if (!ticket) {
    return interaction.reply({ content: '⚠️ Ce salon n\'est plus reconnu comme un ticket ouvert.', ephemeral: true });
  }

  const isStaff = config.STAFF_ROLE_ID && interaction.member.roles.cache.has(config.STAFF_ROLE_ID);
  const isOwner = interaction.user.id === ticket.userId;
  const isAdmin = interaction.member.permissions.has(PermissionFlagsBits.Administrator);
  if (!isStaff && !isOwner && !isAdmin) {
    return interaction.reply({ content: '❌ Tu ne peux pas fermer ce ticket.', ephemeral: true });
  }

  ticket.status = 'closed';
  saveDb(db);

  try {
    await interaction.channel.permissionOverwrites.edit(ticket.userId, { SendMessages: false });
  } catch (err) {
    console.warn('⚠️ Impossible de mettre à jour les permissions du salon :', err.message);
  }

  const deleteButton = new ButtonBuilder()
    .setCustomId('ticket-delete')
    .setLabel(config.DELETE_BUTTON_LABEL)
    .setStyle(ButtonStyle.Danger);

  await interaction.reply({
    content: config.CLOSE_MESSAGE.replace('{user}', `<@${interaction.user.id}>`),
    components: [new ActionRowBuilder().addComponents(deleteButton)],
  });

  try {
    if (!interaction.channel.name.startsWith('ferme-')) {
      await interaction.channel.setName(`ferme-${interaction.channel.name}`.slice(0, 100));
    }
  } catch (err) {
    console.warn('⚠️ Impossible de renommer le salon :', err.message);
  }
}

// --- Suppression définitive d'un ticket ---------------------------------------
async function handleDeleteTicket(interaction) {
  const isStaff = config.STAFF_ROLE_ID && interaction.member.roles.cache.has(config.STAFF_ROLE_ID);
  const isAdmin = interaction.member.permissions.has(PermissionFlagsBits.Administrator);
  if (!isStaff && !isAdmin) {
    return interaction.reply({ content: '❌ Seul le staff peut supprimer définitivement un ticket.', ephemeral: true });
  }

  await interaction.reply(`🗑️ Suppression du salon dans ${config.DELETE_COUNTDOWN_SECONDS} secondes...`);

  db.tickets = db.tickets.filter((t) => t.channelId !== interaction.channel.id);
  saveDb(db);

  setTimeout(async () => {
    try {
      await interaction.channel.delete('Ticket supprimé par le staff');
    } catch (err) {
      console.error('Erreur lors de la suppression du salon de ticket :', err);
    }
  }, config.DELETE_COUNTDOWN_SECONDS * 1000);
}

client.login(config.TOKEN);
