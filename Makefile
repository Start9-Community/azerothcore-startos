# overrides to s9pk.mk must precede the include statement
#
# The mod-playerbots fork is built for x86_64 only, so this flavor builds for
# x86_64 alone.
ARCHES := x86

include node_modules/@start9labs/start-sdk/s9pk.mk
