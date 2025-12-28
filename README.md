# Commands to build and run the PostgreSQL Docker container:

### 1. Build the Docker image
Run this command in your project's root directory (where `Dockerfile.postgres` is located):
```bash
docker build -t accounting-postgres -f Dockerfile.postgres .
```
This command builds a Docker image named `accounting-postgres` using the `Dockerfile.postgres`.

### 2. Run the Docker container
After building the image, run this command to start a container:
```bash
docker run -d --name accounting-db -p 5432:5432 accounting-postgres
```
-   `-d`: Runs the container in detached mode (in the background).
-   `--name accounting-db`: Assigns a name to your container, making it easier to reference.
-   `-p 5432:5432`: Maps port 5432 on your host machine to port 5432 inside the container, allowing your application to connect to it.

### 3. Verify the database is running (Optional)
You can check if the container is running:
```bash
docker ps
```
You should see `accounting-db` in the list of running containers.

### 4. Stop and remove the container (when you're done)
To stop the running database container:
```bash
docker stop accounting-db
```
To remove the container (after stopping it):
```bash
docker rm accounting-db
```
To remove the image (if no longer needed):
```bash
docker rmi accounting-postgres
```# Cloudger
