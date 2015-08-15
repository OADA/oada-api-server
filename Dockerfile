FROM node:0.12

# The API server will run on port 8080 of the container
EXPOSE 3000

# install any global dependencies:
RUN apt-get update
RUN apt-get install -y git
RUN npm install -g forever

# Clone the git project:
# Note that you can also copy in the local folder: ADD . /code
# or you can just mount the local folder with the docker using '-v .:/code' on command line
# or you can use 'VOLUMES .:/code' for docker-compose to mount local directory inside container
RUN mkdir /code
RUN cd /code && git clone https://github.com/OADA/oada-api-server.git

# Set default dir for a shell to /code (where the git repo is cloned)
WORKDIR /code

# Create data directory for persistence (docker-compose can override to mount
# /data as a volume from a data container)
RUN mkdir /data

# Add the docker-entrypoint.sh script to run whenever the container starts
ADD ./docker/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# When the container starts, start the API server
CMD /docker-entrypoint.sh


