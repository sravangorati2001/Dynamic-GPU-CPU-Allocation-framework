import React, { useState, useEffect } from 'react';
import { getHelloMessage } from '../services/api';

const Hello = () => {
    const [message, setMessage] = useState('');

    useEffect(() => {
        getHelloMessage().then((response) => {
            setMessage(response.data.message);
        });
    }, []);

    return <h1>{message}</h1>;
};

export default Hello;

