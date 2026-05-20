# overrides to s9pk.mk must precede the include statement
#
# Two variants from one repo (see startos/variant.ts):
#   make            → vanilla    → azerothcore_<arch>.s9pk          (id: azerothcore)
#   make playerbots → playerbots → azerothcore_playerbots_<arch>.s9pk (id: azerothcore-playerbots)
#
# The real package id is baked into the bundle at build time by
# scripts/gen-variant.js. s9pk.mk derives its PACKAGE_ID (used only for the
# output filename) by awk-parsing a literal `id:` — which our dynamic manifest
# lacks — so each leaf rule passes PACKAGE_ID explicitly as a command-line
# override. Both editions are x86_64 only.
TARGETS := vanilla-x86
ARCHES := x86

include s9pk.mk

.PHONY += vanilla playerbots

vanilla: vanilla-x86
playerbots: playerbots-x86

# Vanilla: no VARIANT (BASE_NAME stays "azerothcore").
vanilla-%:;    $(MAKE) PACKAGE_ID=azerothcore $*
# Playerbots: VARIANT=playerbots → BASE_NAME "azerothcore_playerbots", and the
# bundle bakes id "azerothcore-playerbots".
playerbots-%:; VARIANT=playerbots $(MAKE) PACKAGE_ID=azerothcore $*
