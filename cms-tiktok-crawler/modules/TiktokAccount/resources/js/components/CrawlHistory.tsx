import React, { useEffect } from 'react';
import { useDispatch, useSelector } from '@core/store';
import { setParams } from '../store/tiktokAccount/tiktokAccountSlice';
import { fetchResultsByAccountID } from '../store/tiktokAccount/tiktokAccountThunks';
import CrawlResultTable from '@modules/Crawler/resources/js/components/CrawlResultTable';
import { Alert } from 'antd';

const CrawlHistory = ({ accountId }) => {
	const dispatch = useDispatch();
	const { results, resultsLoading, resultsError, pagination, params } = useSelector((state) => state.tiktokAccount);

	useEffect(() => {
		if (accountId) {
			dispatch(fetchResultsByAccountID({ id: accountId, params }));
		}
	}, [dispatch, accountId, params]);

	return (
		<>
			{resultsError ? (<Alert type="error" title={resultsError} showIcon />) :
				(results.length > 0 && <CrawlResultTable
					data={results}
					loading={resultsLoading}
					error={resultsError}
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