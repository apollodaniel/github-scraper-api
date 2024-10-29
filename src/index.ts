import express from 'express';
import cors from 'cors';
import mainRouter from './routes/main';

const PORT = process.env.PORT || 8080;
const app = express();
app.use(express.json());

app.use(
	cors({
		origin: 'https://portfolio-amber-tau-58.vercel.app',
	}),
);

app.use(mainRouter);

app.listen(PORT, () => {
	console.log(`Listening to port ${PORT}`);
});
