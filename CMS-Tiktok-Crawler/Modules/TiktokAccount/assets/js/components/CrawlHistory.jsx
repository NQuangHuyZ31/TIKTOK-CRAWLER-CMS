import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCrawlResultsByAccountID } from '@modules/Crawler/assets/js/store/crawlResult/crawlResultThunks';
import { setParams } from '@modules/Crawler/assets/js/store/crawlResult/crawlResultSlice';
import CrawlResultTable from '@modules/Crawler/assets/js/components/CrawlResultTable';
import { Alert } from 'antd';

const CrawlHistory = ({ accountId }) => {
	const dispatch = useDispatch();
	const { data, loading, error, pagination, params } = useSelector((state) => state.crawlResult);

	useEffect(() => {
		if (accountId) {
			dispatch(fetchCrawlResultsByAccountID({ id: accountId, params }));
		}
	}, [dispatch, accountId, params]);

	return (
		<>
			{error ? (<Alert type="error" title={error} showIcon />) :
				(data.length > 0 && <CrawlResultTable
					data={data}
					loading={loading}
					error={error}
					pagination={pagination}
					setParams={setParams}
					params={params}
					dispatch={dispatch}
				/>)
			}
		</>
	)
}


export default React.memo(CrawlHistory);