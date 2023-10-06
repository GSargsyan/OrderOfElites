docker build -t backend ./backend/
docker run -it -p 8000:8000 -v /srv/OrderOfElites/backend:/opt/backend backend /bin/bash

docker build -t frontend ./frontend/
docker run -it -p 3000:3000 -v /srv/OrderOfElites/frontend:/opt/frontend frontend /bin/bash

docker build -t psql ./psql/
docker run -it -p 5432:5432 -v /srv/OrderOfElites/psql:/opt/psql psql /bin/bash
