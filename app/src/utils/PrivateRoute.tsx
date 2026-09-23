import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const PrivateRoute: React.FC = () => {
	const auth_token = localStorage.getItem('auth_token');

	return auth_token ? <Outlet /> : <Navigate to='/login' />;
};

export default PrivateRoute;
