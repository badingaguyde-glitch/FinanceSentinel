const axios = require('axios');

const apiClient = axios.create({
  timeout: 5000,
});

module.exports = apiClient;
