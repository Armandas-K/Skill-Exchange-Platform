Open full website directory



npm install -- install node packages



create a db eg pwatest in pgadmin



psql -U <your-db-username> -d pwatest -f tempdbsetup.sql



add .env in your backend folder with DATABASE_URL=postgres://username:password@host:port/databasename


if you add stuff that requires back end changes please change tempdbsetup so it would work
