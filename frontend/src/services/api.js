import axios from 'axios';

const API_URL = 'http://localhost:8080/api';

export const getHelloMessage = () => {
    return axios.get(`${API_URL}/hello`);
};

