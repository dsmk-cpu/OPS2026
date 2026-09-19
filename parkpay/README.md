# Requirements 
Following is needed to start the project:
- Docker

Optional, for local development without Docker:
- Node.js 24
- npm

# Start project with Docker
Start the project with the following command in the parkpay root directory:
```
docker compose up --build
```

Stop the project:
```
docker compose down
```


# Run without docker
In root:
````
npm install

npm run dev --workspace=apps/backend
npm run dev --workspace=apps/frontend
````
## Frontend
http://localhost:5173
## Backend
http://localhost:3000
### Health check
http://localhost:3000/health

