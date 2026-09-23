import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { axiosClient, axiosClientWithAuth } from '../utils/AxiosClient';

interface User {
	id: number;
	name: string;
	email_address: string;
	phone_number: string;
}

interface LoginState {
	email_address: string;
	password: string;
	errors: string[];
}

interface ApiResponse {
	auth_token: string;
	current_user: User;
	errors: string[];
	// Add other response properties here if needed
}

interface Props {
	handleLogin: (user: User) => void;
}

const Login: React.FC<Props> = ({ handleLogin }) => {
	const navigate = useNavigate();
	const [state, setState] = useState<LoginState>({
		email_address: '',
		password: '',
		errors: [],
	});

	const containerStyle: React.CSSProperties = {
		textAlign: 'center',
		width: '100vw',
		height: '100vh',
		alignItems: 'center',
		display: 'flex',
		flexDirection: 'column',
		justifyContent: 'center',
	};

	const formStyle: React.CSSProperties = {
		display: 'flex',
		flexDirection: 'column',
		alignItems: 'center',
		justifyContent: 'center',
	};

	const inputStyle: React.CSSProperties = {
		margin: '10px',
		padding: '8px',
		width: '300px',
		borderRadius: '4px',
		border: '1px solid #ccc',
	};

	const buttonStyle: React.CSSProperties = {
		margin: '10px',
		padding: '10px 20px',
		backgroundColor: '#007bff',
		color: '#fff',
		border: 'none',
		borderRadius: '4px',
		cursor: 'pointer',
	};

	const errorContainerStyle: React.CSSProperties = {
		color: 'red',
		marginTop: '10px',
	};

	const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = event.target;
		setState((prevState) => ({
			...prevState,
			[name]: value,
		}));
	};

	const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const { email_address, password } = state;
		const user = {
			email_address: email_address,
			password: password,
		};

		axiosClient
			.post('/auth/login', { ...user })
			.then(async (response) => {
				const responseData: ApiResponse = response.data;
				if (responseData.auth_token) {
					// Store the token, then fetch the current user with it.
					localStorage.setItem('auth_token', responseData.auth_token);
					try {
						const currentUserResponse = await axiosClientWithAuth.get<User>('/auth/current');
						handleLogin(currentUserResponse.data);
						redirect();
					} catch (error) {
						console.log('api errors:', error);
						setState((prevState) => ({
							...prevState,
							errors: ['Logged in, but could not load your account details. Please try again.'],
						}));
					}
				} else {
					setState({
						...state,
						errors: responseData.errors,
					});
				}
			})
			.catch((error) => console.log('api errors:', error));
	};

	const redirect = () => {
		navigate('/home');
	};

	const handleErrors = () => {
		return (
			<div style={errorContainerStyle}>
				<ul>
					{state.errors.map((error, key) => {
						return <li key={key}>{error}</li>;
					})}
				</ul>
			</div>
		);
	};

	return (
		<div style={containerStyle}>
			<h1>Log In</h1>
			<form style={formStyle} onSubmit={handleSubmit}>
				<input
					placeholder='Email Address'
					type='text'
					name='email_address'
					value={state.email_address}
					onChange={handleChange}
					style={inputStyle}
				/>
				<input
					placeholder='Password'
					type='password'
					name='password'
					value={state.password}
					onChange={handleChange}
					style={inputStyle}
				/>
				<button type='submit' style={buttonStyle}>
					Log In
				</button>
			</form>
			{handleErrors()}
		</div>
	);
};

export default Login;
