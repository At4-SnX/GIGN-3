# 🎫 GIGN RP — Bot de tickets (3 catégories)

Bot Discord.js v14 prêt à déployer sur **Railway**.

## Ce que fait le bot

1. Un membre du staff (permission "Gérer le serveur" par défaut) tape **`!ticketpanel`** dans un salon.
2. Le bot poste un message **Components V2** : titre, explication détaillée, l'image ci-jointe en dessous du texte, et un **menu déroulant** pour choisir la catégorie :
   - 📁 **Ouverture de dossier** (report)
   - ❓ **Question**
   - 🎖️ **Demande Officier**
3. Quand un membre sélectionne une catégorie dans le menu, le bot crée un **salon privé** dans la **catégorie Discord correspondante** (3 catégories différentes, une par type de ticket), visible uniquement par la personne, le staff et le bot.
4. Le salon reçoit un message d'accueil adapté à la catégorie, avec un bouton **🔒 Fermer le ticket**.
5. Fermer un ticket retire le droit d'écrire à la personne et fait apparaître un bouton **🗑️ Supprimer définitivement** (réservé au staff), qui supprime le salon après un court délai.
6. Une personne ne peut avoir qu'**un seul ticket ouvert par catégorie** à la fois — le bot le lui rappelle sinon.
7. **Statut du bot** : activité de type **Streaming** ("En direct") avec le texte `🔗discord.gg/bordeauxrp`.
   - ⚠️ **Limitation Discord** : le badge violet "En direct" ne s'affiche vraiment que si le lien associé pointe vers **twitch.tv** ou **youtube.com**. Renseigne un vrai lien dans `STREAM_URL` si tu veux garantir le badge — le texte affiché reste `🔗discord.gg/bordeauxrp` dans tous les cas.

## 1. Modifier le bot (tout est dans `config.js`)

Titres, texte d'introduction, description et emoji de chaque option du menu déroulant, textes de chaque catégorie, préfixe des noms de salon, permission requise pour `!ticketpanel` (`PANEL_REQUIRES_MANAGE_GUILD`) — tout se change dans ce seul fichier.

Pour changer l'image du panel : remplace `assets/ticket-banner.png` par ta propre image (même nom, ou change `PANEL_IMAGE_PATH` dans `config.js`).

## 2. Créer les 3 catégories Discord

Crée (ou réutilise) **3 catégories de salons** sur ton serveur, par exemple :
- `📁 DOSSIERS`
- `❓ QUESTIONS`
- `🎖️ OFFICIERS`

Active le **Mode développeur** (Discord → Paramètres → Avancés), puis clic droit sur chaque catégorie → Copier l'ID → à mettre dans `REPORT_CATEGORY_ID`, `QUESTION_CATEGORY_ID`, `OFFICER_CATEGORY_ID`.

## 3. Créer l'application Discord

1. Va sur https://discord.com/developers/applications → **New Application**.
2. Onglet **Bot** → **Reset Token** → copie le token (à mettre dans `DISCORD_TOKEN`).
3. Toujours dans l'onglet **Bot**, active l'intent privilégié :
   - **Message Content Intent** (nécessaire pour lire `!ticketpanel`)
4. Onglet **OAuth2 → URL Generator** : coche `bot`, permissions `Send Messages`, `Embed Links`, `Attach Files`, **`Manage Channels`** (indispensable pour créer/renommer/supprimer les salons de tickets), `Manage Roles` *(pour les permissions du salon créé)*, puis invite le bot avec le lien généré.

⚠️ Le rôle du bot doit être **au-dessus** du rôle staff dans la hiérarchie, et le bot doit avoir accès aux 3 catégories créées.

## 4. Récupérer les autres IDs

- sur le serveur → Copier l'ID → `GUILD_ID`
- sur le rôle du staff → Copier l'ID → `STAFF_ROLE_ID`

## 5. Déployer sur Railway

1. Crée un nouveau projet Railway → **Deploy from GitHub repo** (ou upload direct du dossier).
2. Dans l'onglet **Variables**, ajoute les variables du fichier `.env.example` (jamais le fichier `.env` lui-même).
3. Railway détecte automatiquement `package.json` et lance `npm install` puis `npm start`.
4. **Recommandé** : ajoute un **Volume** Railway monté sur `/app/data` pour que la liste des tickets ouverts survive aux redéploiements.

## 6. Test en local (optionnel)

```bash
npm install
cp .env.example .env   # puis remplis les valeurs
npm start
```

## Notes

- Les tickets ouverts sont stockés dans `data/tickets.json` (ignoré par Git — utilise un Volume Railway pour la persistance en production).
- Si une des 3 variables de catégorie n'est pas définie, le bouton correspondant répond avec une erreur claire plutôt que de planter.
