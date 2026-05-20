type Locale = 'en_US' | 'es_ES' | 'de_DE' | 'pl_PL' | 'fr_FR'
type LocalizedText = Record<Locale, string>

export const shortDescription: LocalizedText = {
  en_US: 'World of Warcraft 3.3.5a (WotLK) server emulator',
  es_ES: 'Emulador de servidor de World of Warcraft 3.3.5a (WotLK)',
  de_DE: 'World of Warcraft 3.3.5a (WotLK) Server-Emulator',
  pl_PL: 'Emulator serwera World of Warcraft 3.3.5a (WotLK)',
  fr_FR: 'Emulateur de serveur World of Warcraft 3.3.5a (WotLK)',
}

export const shortDescriptionPlayerbots: LocalizedText = {
  en_US: 'WoW 3.3.5a (WotLK) server emulator with AI players (Playerbots)',
  es_ES: 'Emulador de WoW 3.3.5a (WotLK) con jugadores IA (Playerbots)',
  de_DE: 'WoW 3.3.5a (WotLK) Server-Emulator mit KI-Spielern (Playerbots)',
  pl_PL: 'Emulator serwera WoW 3.3.5a (WotLK) z graczami AI (Playerbots)',
  fr_FR: 'Emulateur de serveur WoW 3.3.5a (WotLK) avec joueurs IA (Playerbots)',
}

export const longDescription: LocalizedText = {
  en_US:
    'AzerothCore is an open-source MMORPG server emulator for World of Warcraft patch 3.3.5a (Wrath of the Lich King). This package runs the authserver, worldserver, and a MySQL database, automatically downloads client map data, and configures the realm address for LAN/clearnet play. Connect with a clean 3.3.5a client by pointing realmlist.wtf at this server.',
  es_ES:
    'AzerothCore es un emulador de servidor MMORPG de codigo abierto para World of Warcraft 3.3.5a (Wrath of the Lich King). Este paquete ejecuta el authserver, el worldserver y una base de datos MySQL, descarga automaticamente los datos del cliente y configura la direccion del reino.',
  de_DE:
    'AzerothCore ist ein quelloffener MMORPG-Server-Emulator fuer World of Warcraft 3.3.5a (Wrath of the Lich King). Dieses Paket betreibt Authserver, Worldserver und eine MySQL-Datenbank, laedt automatisch Client-Kartendaten herunter und konfiguriert die Realm-Adresse.',
  pl_PL:
    'AzerothCore to otwartoźrodlowy emulator serwera MMORPG dla World of Warcraft 3.3.5a (Wrath of the Lich King). Ten pakiet uruchamia authserver, worldserver i baze danych MySQL, automatycznie pobiera dane klienta i konfiguruje adres realmu.',
  fr_FR:
    "AzerothCore est un emulateur de serveur MMORPG open source pour World of Warcraft 3.3.5a (Wrath of the Lich King). Ce paquet execute l'authserver, le worldserver et une base de donnees MySQL, telecharge automatiquement les donnees client et configure l'adresse du royaume.",
}

export const longDescriptionPlayerbots: LocalizedText = {
  en_US:
    'AzerothCore is an open-source MMORPG server emulator for World of Warcraft patch 3.3.5a (Wrath of the Lich King). This edition adds mod-playerbots, populating the world with AI players that quest, run dungeons, and join battlegrounds, so the realm feels alive even when you play solo. Bots are on by default and can be turned off (vanilla behavior) or tuned from the Playerbots Settings action. This package runs the authserver, worldserver, and a MySQL database, automatically downloads client map data, and configures the realm address for LAN/clearnet play. Connect with a clean 3.3.5a client by pointing realmlist.wtf at this server.',
  es_ES:
    'AzerothCore es un emulador de servidor MMORPG de codigo abierto para World of Warcraft 3.3.5a (Wrath of the Lich King). Esta edicion anade mod-playerbots, poblando el mundo con jugadores IA. Los bots estan activados por defecto y se pueden desactivar (comportamiento vanilla) o ajustar desde la accion Playerbots Settings. Conecta con un cliente 3.3.5a limpio apuntando realmlist.wtf a este servidor.',
  de_DE:
    'AzerothCore ist ein quelloffener MMORPG-Server-Emulator fuer World of Warcraft 3.3.5a (Wrath of the Lich King). Diese Edition fuegt mod-playerbots hinzu und bevoelkert die Welt mit KI-Spielern. Bots sind standardmaessig aktiviert und koennen ueber die Aktion Playerbots Settings deaktiviert (Vanilla-Verhalten) oder angepasst werden. Verbinde dich mit einem sauberen 3.3.5a-Client.',
  pl_PL:
    'AzerothCore to otwartoźrodlowy emulator serwera MMORPG dla World of Warcraft 3.3.5a (Wrath of the Lich King). Ta edycja dodaje mod-playerbots, zapelniajac swiat graczami AI. Boty sa domyslnie wlaczone i mozna je wylaczyc (zachowanie vanilla) lub dostroic w akcji Playerbots Settings. Polacz sie czystym klientem 3.3.5a.',
  fr_FR:
    "AzerothCore est un emulateur de serveur MMORPG open source pour World of Warcraft 3.3.5a (Wrath of the Lich King). Cette edition ajoute mod-playerbots, peuplant le monde de joueurs IA. Les bots sont actives par defaut et peuvent etre desactives (comportement vanilla) ou ajustes depuis l'action Playerbots Settings. Connectez-vous avec un client 3.3.5a propre.",
}
