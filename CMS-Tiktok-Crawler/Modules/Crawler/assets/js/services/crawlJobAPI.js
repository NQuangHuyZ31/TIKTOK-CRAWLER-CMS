import instance from '@modules/Core/assets/js/api/axios';

const getCrawlJobs = async (params = {}) => {
	try {
		const res = await instance.get('/crawlers/crawl-jobs', { params });
		return res.data;
	} catch (error) {
		console.error('Error fetching crawl job:', error);
		throw error;
	}
}

const getCrawlJobbyID = async (id) => {
	try {
		const res = await instance.get(`/crawlers/crawl-jobs/${id}`);
		return res.data;
	} catch (error) {
		console.error('Error fetching crawl job by ID:', error);
		throw error;
	}
}

const createCrawlJob = async (data) => {
	try {
		const res = await instance.post('/crawlers/crawl-jobs/add', data);
		return res.data;
	} catch (error) {
		console.error('Error creating crawl job:', error);
		throw error;
	}
}

const getStatisticsSummary = async () => {
	try {
		const res = await instance.get('/crawlers/crawl-jobs/statistics-summary');
		return res.data;
	} catch (error) {
		console.error('Error fetching statistics summary:', error);
		throw error;
	}
}

// Delete crawl job by ID
const deleteCrawlJobByID = async (id) => {
	try {
		const res = await instance.delete(`/crawlers/crawl-jobs/${id}`);
		return res.data;
	} catch (error) {
		console.error('Error deleting crawl job by ID:', error);
		throw error;
	}
}

const crawlJobApi = {
	getCrawlJobs,
	getCrawlJobbyID,
	createCrawlJob,
	getStatisticsSummary,
	deleteCrawlJobByID,
};

export default crawlJobApi;