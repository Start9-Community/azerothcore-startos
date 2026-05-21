# overrides to s9pk.mk must precede the include statement
#
# The mod-playerbots fork is built for x86_64 only, so this flavor builds for
# x86_64 alone.
ARCHES := x86

include s9pk.mk
