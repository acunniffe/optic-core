echo OPTIC_SERVER:$OPTIC_SERVER
# --ignore-stdin is required for non-interactive use or else it will hang (https://httpie.org/doc#best-practices)
BASE_CMD="/usr/local/bin/http --ignore-stdin"
$BASE_CMD GET localhost:30333/users
$BASE_CMD GET localhost:30333/someRandomRoute
$BASE_CMD POST localhost:30333/users/2 key=value some2=1 some3=1
$BASE_CMD POST localhost:30333/users/1 key=value some3=1
$BASE_CMD POST localhost:30333/users/2 key=value some2=1
$BASE_CMD POST localhost:30333/users/1 key=value
$BASE_CMD GET localhost:30333/users/1/profile qp==0
$BASE_CMD DELETE localhost:30333/users/2
