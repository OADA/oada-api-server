FROM node:0.12

# The API server will run on port 8080 of the container
EXPOSE 3000

# install any global dependencies:
RUN apt-get update
RUN apt-get install -y git
RUN npm install -g forever

# Clone the git project:
RUN mkdir /code
RUN cd /code && git clone git@github.com:OADA/oada-demo-tests.git

# Set default dir for a shell to /code (where the git repo is cloned)
WORKDIR /code

# Create data directory for persistence (docker-compose can override to mount
# /data as a volume from a data container)
RUN mkdir /data

# Add the docker-entrypoint.sh script to run whenever the container starts
ADD ./docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# When the container starts, start the API server
CMD /docker-entrypoint.sh


