import { configureStore } from '@reduxjs/toolkit';
import crawlJobReducer from '@modules/Crawler/assets/js/store/crawlJob/crawlJobSlice';
import crawlResultReducer from '@modules/Crawler/assets/js/store/crawlResult/crawlResultSlice';
import tiktokAccountReducer from '@modules/TiktokAccount/assets/js/store/tiktokAccount/tiktokAccountSlice';


export const store = configureStore({
	reducer: {
		crawlJob: crawlJobReducer,
		crawlResult: crawlResultReducer,
		tiktokAccount: tiktokAccountReducer,
	}
});

export default store;