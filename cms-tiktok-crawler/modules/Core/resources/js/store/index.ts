import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch as useReduxDispatch, useSelector as useReduxSelector } from 'react-redux';
import crawlJobReducer from '@modules/Crawler/resources/js/store/crawlJob/crawlJobSlice';
import tiktokAccountReducer from '@modules/TiktokAccount/resources/js/store/tiktokAccount/tiktokAccountSlice';
import authReducer from '@modules/Auth/resources/js/store/auth/authSlice';
import userReducer from '@modules/User/resources/js/store/user/userSlice';

export const store = configureStore({
	reducer: {
		auth: authReducer,
		crawlJob: crawlJobReducer,
		tiktokAccount: tiktokAccountReducer,
		user: userReducer,
	}
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useReduxDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useReduxSelector;

export const useDispatch = useAppDispatch;
export const useSelector = useAppSelector;

export default store;