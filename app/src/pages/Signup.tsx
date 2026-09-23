import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { axiosClient, axiosClientWithAuth } from '../utils/AxiosClient';

interface User {
	id?: number;
	name?: string;
	email_address?: string;
	phone_number?: string;
}

interface SignupState {
	username: string;
	email: string;
	password: string;
	password_confirmation: string;
	errors: string[];
}

interface SignupResponse {
	message?: string;
	errors?: string[];
}

interface LoginResponse {
	auth_token?: string;
	error?: string;
}

interface Props {
	onSignupSuccess: (user: User) => void;
}

const Signup: React.FC<Props> = ({ onSignupSuccess }) => {
	const navigate = useNavigate();
	const [state, setState] = useState<SignupState>({
		username: '',
		email: '',
		password: '',
		password_confirmation: '',
		errors: [],
	});

	const containerStyle: React.CSSProperties = {
		textAlign: 'center',
		display: 'flex',
		flexDirection: 'column',
		justifyContent: 'center',
		alignItems: 'center',
		width: '100vw',
		height: '100vh',
	};

	const formStyle: React.CSSProperties = {
		display: 'flex',
		flexDirection: 'column',
		alignItems: 'center',
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
		backgroundColor: '#28a745',
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
		const { username, email, password, password_confirmation } = state;
		const user = {
			name: username,
			email_address: email,
			password: password,
			password_confirmation: password_confirmation,
		};

		// 1) Create the account. The backend responds with { message } on
		//    success and does NOT issue a token here, so a 2xx without errors
		//    means the signup worked.
		axiosClient
			.post('/signup', { user })
			.then(async (response) => {
				const signupData: SignupResponse = response.data;
				console.log(signupData);
				if (response.status >= 200 && response.status < 300 && !signupData.errors?.length) {
					await completeSignup(email, password);
				} else {
					setState((prevState) => ({
						...prevState,
						errors: signupData.errors ?? ['Could not create the account. Please try again.'],
					}));
				}
			})
			.catch((error) => console.log('api errors:', error));
	};

	// 2) Obtain an auth token (the backend only issues one on login) and use it
	//    to load the newly created user.
	const completeSignup = async (emailAddress: string, userPassword: string) => {
		try {
			const loginResponse = await axiosClient.post<LoginResponse>('/auth/login', {
				email_address: emailAddress,
				password: userPassword,
			});
			if (!loginResponse.data.auth_token) {
				throw new Error('login response did not include an auth_token');
			}
			localStorage.setItem('auth_token', loginResponse.data.auth_token);

			const currentUserResponse = await axiosClientWithAuth.get<User>('/auth/current');
			onSignupSuccess(currentUserResponse.data);
			redirect();
		} catch (error) {
			console.log('api errors:', error);
			// The account was created; if the auto sign-in step failed the user
			// can simply log in manually with the same credentials.
			setState((prevState) => ({
				...prevState,
				errors: ['Account created, but automatic sign-in failed. Please log in manually.'],
			}));
		}
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
			<h1>Sign Up</h1>
			<form style={formStyle} onSubmit={handleSubmit}>
				<input
					placeholder='Username'
					type='text'
					name='username'
					value={state.username}
					onChange={handleChange}
					style={inputStyle}
				/>
				<input
					placeholder='Email'
					type='text'
					name='email'
					value={state.email}
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
				<input
					placeholder='Password Confirmation'
					type='password'
					name='password_confirmation'
					value={state.password_confirmation}
					onChange={handleChange}
					style={inputStyle}
				/>
				<button type='submit' style={buttonStyle}>
					Sign Up
				</button>
			</form>
			{handleErrors()}
		</div>
	);
};

export default Signup;
