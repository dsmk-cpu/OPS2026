import express from 'express';

export const app = express();

app.disable('x-powered-by');

app.use(
    express.json({
        limit: '10kb',
    }),
);

app.get('/health', (_req, res) => {
    res.status(200).json({
        status: 'ok',
    });
});