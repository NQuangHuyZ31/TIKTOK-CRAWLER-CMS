import instance from '@modules/Core/assets/js/api/axios';

const getCrawlResultByCrawlJobID = async (id, params = {}) => {
	try {
		const res = await instance.get(`/crawlers/crawl-jobs/${id}/results`, { params });
		return res.data;
	} catch (error) {
		console.error('Error fetching crawl results by crawl job ID:', error);
		throw error;
	}
}

const crawlResultApi = {
	getCrawlResultByCrawlJobID,
}

export default crawlResultApi;