type Locale = 'en_US' | 'es_ES' | 'de_DE' | 'pl_PL' | 'fr_FR'
type LocalizedText = Record<Locale, string>

export const shortDescription: LocalizedText = {
  en_US: 'World of Warcraft 3.3.5a (WotLK) server emulator',
  es_ES: 'Emulador de servidor de World of Warcraft 3.3.5a (WotLK)',
  de_DE: 'World of Warcraft 3.3.5a (WotLK) Server-Emulator',
  pl_PL: 'Emulator serwera World of Warcraft 3.3.5a (WotLK)',
  fr_FR: 'Emulateur de serveur World of Warcraft 3.3.5a (WotLK)',
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
