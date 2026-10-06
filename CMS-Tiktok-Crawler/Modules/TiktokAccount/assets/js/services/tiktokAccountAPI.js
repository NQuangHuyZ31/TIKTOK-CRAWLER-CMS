import instance from '@modules/Core/assets/js/api/axios';

const getAllTiktokAccount = (params) => {
	try {
		const res = instance.get('/tiktok-accounts/all', { params });
		return res.data;
	} catch (error) {
		console.error('Error fetching tiktok accounts:', error);
		throw error;
	}
};

const tiktokAccountAPI = {
	getAllTiktokAccount
}

export default tiktokAccountAPI;