import * as Agenda from 'agenda';
import { MongoClient } from 'mongodb';

const start = async () => {
  const mongoClient = await MongoClient.connect('mongodb://127.0.0.1/agenda-test');

  const db = mongoClient.db('agenda-test');
  const agenda = new Agenda();

  console.log('defining job');
  const jobRunPromise = new Promise(res =>
    agenda.define('job-name', ({ attrs }) => {
      console.log('running job', new Date(), attrs);
      res();
    }),
  );
  console.log('starting agenda');
  await new Promise((res, rej) =>
    agenda
      .mongo(db)
      .once('ready', () => {
        agenda.start();
        res();
      }),
  );
  console.log('scheduling job');
  const job = await new Promise<Agenda.Job>((res, rej) => {
    const job: Agenda.Job = agenda.schedule(
      'in 1 min', 'job-name',
      { pumpId: 1 },
      (err, data) => err ? rej(err) : res(job),
    );
  });
  console.log('job scheduled', new Date(), job.attrs.nextRunAt);
  await jobRunPromise;

  await new Promise((res, rej) =>
    agenda.stop(err => err ? rej(err) : res())
  );
  await mongoClient.close();
};

start().catch(err => {
  console.error(err);
  process.exit(1);
})
