import React from 'react';
import { Link } from 'react-router-dom';

interface Props {
	signupSuccess: boolean;
}

const Home: React.FC<Props> = ({ signupSuccess }) => {
	const containerStyle: React.CSSProperties = {
		width: '100vw',
		height: '100vh',
		display: 'flex',
		flexDirection: 'column',
		textAlign: 'center',
		justifyContent: 'center',
		alignItems: 'center',
	};

	const headingStyle: React.CSSProperties = {
		fontSize: '36px',
		marginBottom: '20px',
		color: '#333',
	};

	const paragraphStyle: React.CSSProperties = {
		fontSize: '18px',
		marginBottom: '20px',
		color: '#666',
	};

	const buttonContainerStyle: React.CSSProperties = {
		display: 'flex',
		justifyContent: 'center',
	};

	const buttonStyle: React.CSSProperties = {
		display: 'inline-block',
		padding: '10px 20px',
		margin: '0 10px',
		textAlign: 'center',
		textDecoration: 'none',
		fontSize: '16px',
		borderRadius: '5px',
		transition: 'background-color 0.3s ease',
	};

	const loginButtonStyle: React.CSSProperties = {
		backgroundColor: '#007bff',
		color: '#fff',
	};

	const signupButtonStyle: React.CSSProperties = {
		backgroundColor: '#28a745',
		color: '#fff',
	};

	const successMessageStyle: React.CSSProperties = {
		backgroundColor: '#4CAF50', // Green background color
		color: '#fff', // White text color
		padding: '10px',
		borderRadius: '4px',
		textAlign: 'center',
		margin: '10px',
		boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', // Add a subtle shadow
		position: 'relative', // Relative positioning for close button
	};

	return (
		<div style={containerStyle}>
			{signupSuccess && (
				<div style={successMessageStyle}>Sign up successful</div>
			)}
			<h1 style={headingStyle}>Welcome to AmazeZone</h1>
			<p style={paragraphStyle}>
				Get started by logging in or signing up:
			</p>
			<div style={buttonContainerStyle}>
				<Link
					to='/login'
					style={{ ...buttonStyle, ...loginButtonStyle }}
				>
					Log In
				</Link>
				<Link
					to='/signup'
					style={{ ...buttonStyle, ...signupButtonStyle }}
				>
					Sign Up
				</Link>
			</div>
		</div>
	);
};

export default Home;
