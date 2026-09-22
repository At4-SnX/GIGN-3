// ============================================================================
//  CONFIG.JS — Tout ce qu'il y a à modifier se trouve dans ce fichier.
//  Les valeurs sensibles (token, IDs) viennent du fichier .env (voir .env.example)
// ============================================================================

module.exports = {
  // --- Discord ------------------------------------------------------------
  TOKEN: process.env.DISCORD_TOKEN,
  GUILD_ID: process.env.GUILD_ID, // serveur "Bordeaux RP"

  // Rôle du staff, ajouté automatiquement à chaque ticket créé
  STAFF_ROLE_ID: process.env.STAFF_ROLE_ID,

  // --- Statut du bot ----------------------------------------------------------
  PRESENCE_STATUS: 'online', // 'online' | 'idle' | 'dnd' | 'invisible'
  STATUS_TEXT: '🔗discord.gg/bordeauxrp',
  // ⚠️ Le badge violet "En direct" ne s'affiche que si cette URL pointe vers
  // twitch.tv ou youtube.com. Mets un vrai lien Twitch/YouTube ici si tu veux
  // garantir le badge ; le texte affiché (STATUS_TEXT) restera le lien Discord.
  STREAM_URL: process.env.STREAM_URL || 'https://discord.gg/bordeauxrp',

  // --- Commande texte qui envoie le panel de tickets --------------------------
  TEXT_COMMAND: '!ticketpanel',
  // Permission requise pour utiliser !ticketpanel (évite que n'importe qui
  // spam le panel). Mettre à false pour l'autoriser à tout le monde.
  PANEL_REQUIRES_MANAGE_GUILD: true,

  // --- Message du panel (Components V2, image en dessous du texte) -----------
  PANEL_IMAGE_PATH: './assets/ticket-banner.png',
  PANEL_TITLE: '<:GIGN:1552049526016319550> - SUPPORT GIGN — Ouvrir un ticket',
  PANEL_MESSAGE:
    '## <:Fleche_bleu:1552049657658605628> Bienvenue sur le système de tickets officiel du **GIGN**.\n\n' +
    '> Ce service permet d\'entrer en contact direct et confidentiel avec le commandement de l\'unité, en dehors ' +
    'des salons publics du serveur. Chaque demande est traitée individuellement, dans un salon privé créé ' +
    'spécialement pour toi, visible uniquement par toi-même et le staff habilité.\n\n' +
    'Avant d\'ouvrir un ticket, merci de vérifier que ta demande n\'a pas déjà de réponse dans les salons ' +
    'd\'information du serveur, et de choisir la catégorie la plus adaptée ci-dessous grâce au menu déroulant : ' +
    'cela permet à l\'équipe de traiter ta demande plus rapidement et par la bonne personne.\n\n' +
    '<:Flche:1552049590339903579> **Ouverture de dossier** — `pour signaler un incident, un manquement au règlement ou déposer un rapport ' +
    'officiel concernant un ou plusieurs membres.`\n' +
    '<:Flche:1552049590339903579> **Question** — `pour toute question générale sur le fonctionnement, l\'organisation ou les procédures ' +
    'internes de l\'unité.`\n' +
    '<:Flche:1552049590339903579> **Demande Officier** — `pour solliciter directement l\'intervention ou la présence d\'un officier dans ' +
    'le cadre d\'une situation RP.`\n\n' +
    '> Merci de rester courtois et de ne pas abuser de ce système : tout ticket créé sans motif valable pourra ' +
    '*être fermé sans réponse. Un seul ticket ouvert par catégorie est autorisé à la fois.*',
  PANEL_COLOR: '#1c2938',
  PANEL_FOOTER: '<:GIGN:1552049526016319550> - Gendarmerie Nationale — GIGN',

  // --- Menu déroulant du panel --------------------------------------------------
  SELECT_MENU_PLACEHOLDER: 'Choisis une catégorie de ticket...',

  // --- Catégories de tickets ---------------------------------------------------
  // Chaque catégorie correspond à une CATÉGORIE Discord différente (ID de la
  // catégorie de salons, pas un rôle). Voir le README pour savoir où trouver ces IDs.
  TICKET_TYPES: {
    report: {
      LABEL: 'Ouverture de dossier',
      EMOJI: '📁',
      SELECT_DESCRIPTION: 'Signaler un incident ou déposer un rapport',
      CATEGORY_ID: process.env.REPORT_CATEGORY_ID,
      CHANNEL_PREFIX: 'dossier',
      OPEN_TITLE: '📁 Ouverture de dossier',
      OPEN_MESSAGE:
        'Bonjour {user}, merci d\'avoir ouvert un dossier.\n\n' +
        'Merci de détailler ci-dessous, avec le plus de précision possible :\n' +
        '- La date et l\'heure des faits ;\n' +
        '- Les personnes impliquées ;\n' +
        '- Un résumé complet de la situation (preuves à l\'appui si possible).\n\n' +
        'Un gradé du GIGN prendra votre dossier en charge dans les meilleurs délais.',
    },
    question: {
      LABEL: 'Question',
      EMOJI: '❓',
      SELECT_DESCRIPTION: 'Question générale sur le fonctionnement de l\'unité',
      CATEGORY_ID: process.env.QUESTION_CATEGORY_ID,
      CHANNEL_PREFIX: 'question',
      OPEN_TITLE: '❓ Question',
      OPEN_MESSAGE:
        'Bonjour {user}, pose ta question ci-dessous, un membre du staff te répondra dès que possible.',
    },
    officier: {
      LABEL: 'Demande Officier',
      EMOJI: '🎖️',
      SELECT_DESCRIPTION: 'Solliciter directement un officier',
      CATEGORY_ID: process.env.OFFICER_CATEGORY_ID,
      CHANNEL_PREFIX: 'officier',
      OPEN_TITLE: '🎖️ Demande Officier',
      OPEN_MESSAGE:
        'Bonjour {user}, explique ci-dessous la raison de ta demande, un officier du GIGN te prendra en charge.',
    },
  },

  // --- Message affiché si la personne a déjà un ticket ouvert dans cette catégorie
  ALREADY_OPEN_MESSAGE: 'Tu as déjà un ticket ouvert dans cette catégorie : {channel}',

  // --- Boutons dans le salon de ticket -----------------------------------------
  CLOSE_BUTTON_LABEL: '🔒 Fermer le ticket',
  DELETE_BUTTON_LABEL: '🗑️ Supprimer définitivement',
  CLOSE_MESSAGE: '🔒 Ticket fermé par {user}. Seul le staff peut maintenant écrire ou supprimer ce salon.',
  DELETE_COUNTDOWN_SECONDS: 5,
};