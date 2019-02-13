echo OPTIC_SERVER:$OPTIC_SERVER
# --ignore-stdin is required for non-interactive use or else it will hang (https://httpie.org/doc#best-practices)
BASE_CMD="/usr/local/bin/http --ignore-stdin"
#$BASE_CMD GET localhost:30333/users
#$BASE_CMD GET localhost:30333/someRandomRoute
#$BASE_CMD POST localhost:30333/users/2 key=value some2=1 some3=1 SPECIAL-HEADER:yay SPECIAL-HEADER:yay2
#$BASE_CMD POST localhost:30333/users/1 key=value some3=1 token:secret
#$BASE_CMD POST localhost:30333/users/2 key=value some2=1
#$BASE_CMD POST localhost:30333/users/1 key=value
#$BASE_CMD GET localhost:30333/users/1/followers/2
$BASE_CMD GET localhost:30333/users/1/profile qpa==0 qpa==1 qpa2[]==0 qpa2[]==1 qpo[a]==b qpo[c]==d
$BASE_CMD GET localhost:30333/users/1/profile qpa==0 qpa==1 qpa2[]==0 qpa2[]==1 qpo[a]==b qpo[c]==d
$BASE_CMD GET localhost:30333/users/1/profile qpa==0 qpa==1 qpa2[]==0 qpa2[]==1 qpo[a]==b qpo[c]==d
#$BASE_CMD GET localhost:30333/users/1/profile qpa==0 qpa==1 qpa2[]==0 qpa2[]==1 qpo[a]==b qpo[c]==d
#$BASE_CMD DELETE localhost:30333/users/2
