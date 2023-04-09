FROM postgres:15

# Create a new PostgreSQL user
# RUN /etc/init.d/postgresql start &&\
#     psql --command "CREATE USER myuser WITH PASSWORD 'mypassword';" &&\
#     /etc/init.d/postgresql stop

RUN /etc/init.d/postgresql start

COPY init.sql /docker-entrypoint-initdb.d/

EXPOSE 5432
