# overrides to s9pk.mk must precede the include statement
#
# AzerothCore's official acore/ac-wotlk-* images are published x86_64 only,
# so this package builds for x86_64 alone.
ARCHES := x86

include s9pk.mk
