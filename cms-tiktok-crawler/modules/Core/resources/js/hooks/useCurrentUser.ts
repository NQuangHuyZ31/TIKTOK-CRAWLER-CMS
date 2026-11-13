import { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from '../store';
import { logoutThunk } from '@modules/Auth/resources/js/store/auth/authThunks';
import { AUTH_ROUTES } from '@modules/Auth/resources/js/configs/authConfig';
import { toHeadlineCase } from '../utils/formatString';

export interface CurrentUserHookResult {
	user: any;
	isAuthenticated: boolean;
	initials: string;
	roleLabel: string;
	logout: () => Promise<void>;
}

/**
 * Shared hook to access the current authenticated user, formatted initials,
 * capitalized primary role label, and a unified logout function.
 */
export function useCurrentUser(): CurrentUserHookResult {
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const { user, isAuthenticated } = useSelector((state: any) => state.auth);

	const initials = useMemo(() => {
		if (!user?.name) return 'AD';
		return user.name.trim().substring(0, 2).toUpperCase();
	}, [user?.name]);

	const roleLabel = useMemo(() => {
		const firstRole = user?.roles?.[0];
		if (!firstRole) return 'Administrator';
		return toHeadlineCase(firstRole);
	}, [user?.roles]);

	const logout = useCallback(async () => {
		await dispatch(logoutThunk());
		navigate(AUTH_ROUTES.LOGIN, { replace: true });
	}, [dispatch, navigate]);

	return {
		user,
		isAuthenticated,
		initials,
		roleLabel,
		logout,
	};
}

export default useCurrentUser;
