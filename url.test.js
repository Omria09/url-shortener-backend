
const mongoose = require('mongoose');
const request = require('supertest');
const express = require('express');
const router = require('./routes/url');

const app = express();
app.use(express.json());
app.use('/', router);

describe('URL Shortener API', () => {
  beforeAll(async () => {
    await mongoose.connect('mongodb://localhost/testdb', { useNewUrlParser: true, useUnifiedTopology: true });
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  afterEach(async () => {
    await mongoose.connection.db.dropDatabase();
  });

  test('POST /shorten should create a short URL', async () => {
    const response = await request(app)
      .post('/shorten')
      .send({ originalUrl: 'https://www.example.com' });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('shortUrl');
    expect(response.body.originalUrl).toMatch(/^https:\/\/www\.example\.com\/?$/);
  });

  test('POST /shorten should return existing URL if already shortened', async () => {
    const firstResponse = await request(app)
      .post('/shorten')
      .send({ originalUrl: 'https://www.example.com' });

    const secondResponse = await request(app)
      .post('/shorten')
      .send({ originalUrl: 'https://www.example.com' });

    expect(secondResponse.statusCode).toBe(200);
    expect(secondResponse.body.shortUrl).toBe(firstResponse.body.shortUrl);
  });

  test('DELETE /:shortUrl should delete a short URL', async () => {
    const createResponse = await request(app)
      .post('/shorten')
      .send({ originalUrl: 'https://www.example.com' });

    const deleteResponse = await request(app)
      .delete(`/${createResponse.body.shortUrl}`);

    expect(deleteResponse.statusCode).toBe(200);
    expect(deleteResponse.body.message).toBe('Short URL deleted successfully.');

    const getResponse = await request(app)
      .get(`/${createResponse.body.shortUrl}`);
    expect(getResponse.statusCode).toBe(404);
  });

  test('POST /shorten should return 400 for invalid URL', async () => {
    const response = await request(app)
      .post('/shorten')
      .send({ originalUrl: 'invalid-url' });

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe('Invalid URL.');
  });
});
