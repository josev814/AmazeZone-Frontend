import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { axiosClientWithAuth } from '../utils/AxiosClient';

const ProductList: React.FC = () => {
	const [products, setProducts] = useState([]);

	useEffect(() => {
		async function fetchData() {
			// Adjust the API endpoint as needed
			const response = await axiosClientWithAuth.get('/products');
			setProducts(response.data);
		}
		fetchData();
	}, []);

	const pageStyle = {
		width: '90vw',
		height: '100vh',
		display: 'flex',
		flexDirection: 'column',
		marginLeft: '16px',
	};

	const headerStyle = {
		marginTop: '5%',
		fontSize: '2.5rem',
		marginBottom: '20px',
	};

	const listItemStyle = {
		marginBottom: '10px',
		padding: '10px',
		// backgroundColor: 'white',
		border: '1px solid #ddd',
		borderRadius: '4px',
		display: 'flex',
		justifyContent: 'start',
		alignItems: 'center',
	};

	const linkStyle = {
		width: '10%',
		textAlign: 'center',
		textDecoration: 'none',
		marginLeft: 'auto',
		padding: '5px 10px',
		backgroundColor: '#007bff',
		color: 'white',
		borderRadius: '4px',
	};
	const linkStyle2 = {
		width: '10%',
		textAlign: 'center',
		textDecoration: 'none',
		marginTop: '5%',
		padding: '5px 10px',
		backgroundColor: '#007bff',
		color: 'white',
		borderRadius: '4px',
	};
	const listTitleStyle = {
		width: '30%',
	};

	return (
		<div style={pageStyle}>
			<h1 style={headerStyle}>Product List</h1>
			<ul>
				{products.map((product) => (
					<li key={product.id} style={listItemStyle}>
						<div style={listTitleStyle}>
							{product.name} - {product.category} - $
							{product.price.toFixed(2)}
						</div>
						<Link to={`/products/${product.id}`} style={linkStyle}>
							Show
						</Link>
						<Link
							to={`/products/${product.id}/edit`}
							style={linkStyle}
						>
							Edit
						</Link>
						<Link
							to={`/products/${product.id}/delete`}
							style={linkStyle}
						>
							Delete
						</Link>
					</li>
				))}
			</ul>
			<Link to={`/products/new`} style={linkStyle2}>
				New Product
			</Link>
		</div>
	);
};

export default ProductList;
