import instance from '@modules/Core/assets/js/api/axios';

const getAllAccountsWithoutPagination = async () => {
	try {
		const res = await instance.get('/tiktok-accounts/all');
		return res.data;
	} catch (error) {
		console.error('Error fetching all tiktok accounts without pagination:', error);
		throw error;
	}
}

const tiktokAccountAPI = {
	getAllAccountsWithoutPagination
}

export default tiktokAccountAPI;