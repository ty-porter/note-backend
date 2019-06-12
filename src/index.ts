import express = require('express');
import bodyParser = require('body-parser');
import { MongoClient, ObjectID } from 'mongodb';
import { mongoConnect } from './mongo-connect';

(async () => {
	// Express app config
	const app = express();
	const mongoUrl = 'mongodb+srv://test:test@cluster0-9igoz.mongodb.net/test?retryWrites=true&w=majority';
	const port = process.env.PORT || 3000;

	// body-parser config
	app.use(bodyParser.urlencoded({ extended: false }));
	app.use(bodyParser.json());

	// Allow Cross Domain Requests
	app.use(function (req, res, next) {
		res.header("Access-Control-Allow-Origin", '*');
		res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS,PATCH');
		res.header("Access-Control-Allow-Headers", 'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json');
		next();
	});

	let getNotes = async (req: any, res: any) => {
		const { mongoDb, mongoClient } = await mongoConnect(mongoUrl, 'note');

		let notePromise = () => {
			return new Promise((resolve, reject) => {
				mongoDb
					.collection('notes')
					.find({})
					.toArray(function (err: any, data: any) {
						if (err) throw err;
						resolve(data);
					});
			});
		}

		let callNotePromise = async () => {
			let result = await notePromise();
			return result;
		}

		const result = await callNotePromise();
		await mongoClient.close();
		res.json(result);
	}

	let createNote = async (req: any, res: any) => {

		const { mongoDb, mongoClient } = await mongoConnect(mongoUrl, 'note');
		let data = req.body;
		try {
			await mongoDb.collection('notes').insertOne('data');
		}
		catch (err) {
			res.status(500).send({ status: 'error', error: err });
			return;
		}

		try {
			await mongoClient.close();
		}
		catch (err) {
			res.status(500).send({ status: 'error', error: err });
			return;
		}
		res.status(500).send({ status: "Success" });

	}

	let deleteNote = (req: any, res: any) => {

		let id = req.params.id;

		MongoClient.connect(mongoUrl, { useNewUrlParser: true }, (err: any, client: any) => {
			if (err) throw err;
			const db = client.db('note');
			db
				.collection('notes')
				.deleteOne({ _id: new ObjectID(id) }, (err: any) => {
					if (err) throw err;
				});

			res.send({ status: "Success" });
		});
	}

	let updateNote = (req: any, res: any) => {

		let id = req.params.id;
		let data = req.body;

		MongoClient.connect(mongoUrl, { useNewUrlParser: true }, (err: any, client: any) => {

			if (err) throw err;
			const db = client.db('note');

			db
				.collection('notes')
				.updateOne(
					{ _id: new ObjectID(id) },
					{ $set: { title: data.title, content: data.content } },
					(err: any) => {
						if (err) throw err;
					});

			res.send({ status: "Success" });
		});
	}

	let getNote = (req: any, res: any) => {

		let id = req.params.id;

		MongoClient.connect(mongoUrl, { useNewUrlParser: true }, (err: any, client: any) => {
			if (err) throw err;
			const db = client.db('note');

			let notePromise = () => {
				return new Promise((resolve, reject) => {
					db
						.collection('notes')
						.find({ _id: new ObjectID(id) })
						.toArray((err: any, data: any) => {
							if (err) throw err;
							resolve(data);
						});
				});
			}

			let callNotePromise = async () => {
				let result = await (notePromise());
				return result;
			}

			callNotePromise().then((result) => {
				client.close();
				res.json(result);
			});
		});
	}

	let createTag = (req: any, res: any) => {

		let data = req.body;
		let noteId = req.params.id;

		MongoClient.connect(mongoUrl, { useNewUrlParser: true }, (err: any, client: any) => {
			if (err) throw err;
			const db = client.db('note');
			db
				.collection('notes')
				.updateOne(
					{ _id: new ObjectID(noteId) },
					{ $push: { tags: data } },
					(err: any) => {
						if (err) throw err;
					}
				)

			res.send({ status: "Success" });
		});
	}

	// API endpoints for notes
	app.get('/api/notes', getNotes);
	app.post('/api/notes/create', createNote);
	app.delete('/api/notes/delete/:id', deleteNote);
	app.patch('/api/notes/update/:id', updateNote);
	app.get('/api/notes/:id', getNote);
	app.post('/api/notes/:id/tags/create', createTag);

	app.listen(port, function () {
		console.log(`Server started, listening on port ${port}.`)
	});

})();

