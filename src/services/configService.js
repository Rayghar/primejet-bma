// src/services/configService.js
import http from './httpService';

const getSystemConfig = async () => {
    const { data } = await http.get('/config');
    return data;
};

const updateSystemConfig = async (configData) => {
    const { data } = await http.put('/config', configData);
    return data;
};

const configService = { getSystemConfig, updateSystemConfig };
export default configService;