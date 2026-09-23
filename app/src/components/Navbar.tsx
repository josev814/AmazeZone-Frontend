import React from 'react';
import { Link } from 'react-router-dom';

interface NavbarProps {
	isLoggedIn: boolean;
	handleLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ isLoggedIn, handleLogout }) => {
	const navbarStyle: React.CSSProperties = {
		backgroundColor: '#333',
		color: 'white',
		padding: '10px 0',
		position: 'fixed',
		width: '100vw',
		top: '0',
		left: '0',
	};

	const navbarListStyle: React.CSSProperties = {
		listStyle: 'none',
		margin: '0',
		padding: '0',
		display: 'flex',
		justifyContent: 'space-between',
		alignItems: 'center',
	};

	const navbarItemStyle: React.CSSProperties = {
		marginRight: '20px',
		marginLeft: '20px',
	};

	const navbarLinkStyle: React.CSSProperties = {
		textDecoration: 'none',
		color: 'white',
		fontWeight: 'bold',
	};

	const logoutButtonStyle: React.CSSProperties = {
		backgroundColor: '#d9534f',
		border: 'none',
		color: 'white',
		padding: '8px 16px',
		borderRadius: '5px',
		cursor: 'pointer',
		transition: 'background-color 0.3s ease',
	};

	return (
		<nav style={navbarStyle}>
			<ul style={navbarListStyle}>
				<li style={navbarItemStyle}>
					{isLoggedIn ? (
						<>
							<Link to='/home' style={navbarLinkStyle}>
								Home
							</Link>
						</>
					) : (
						<>
							<Link to='/' style={navbarLinkStyle}>
								Home
							</Link>
						</>
					)}
				</li>
				{isLoggedIn ? (
					<li style={navbarItemStyle}>
						<button
							onClick={handleLogout}
							style={logoutButtonStyle}
						>
							Logout
						</button>
					</li>
				) : null}
			</ul>
		</nav>
	);
};

export default Navbar;
