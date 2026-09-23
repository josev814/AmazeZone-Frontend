import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { axiosClientWithAuth } from '../utils/AxiosClient';

interface Product {
	id: number;
	name: string;
	category: string;
	quantity: number;
	price: number;
}

const ProductDetail: React.FC = () => {
	const { id } = useParams();
	const [product, setProduct] = useState<Product | null>(null);

	useEffect(() => {
		async function fetchData() {
			const response = await axiosClientWithAuth.get(`/products/${id}`);
			setProduct(response.data);
		}

		fetchData();
	}, [id]);

	const containerStyle = {
		fontFamily: 'Arial, sans-serif',
		// backgroundColor: '#f0f0f0',
		padding: '20px',
		height: '100vh',
		width: '100vw',
	};

	const headerStyle = {
		fontSize: '24px',
		marginBottom: '20px',
	};

	const productInfoStyle = {
		border: '1px solid #ddd',
		borderRadius: '4px',
		padding: '20px',
		// backgroundColor: 'white',
	};

	if (!product) {
		return (
			<div style={containerStyle}>
				<h1 style={headerStyle}>Product Detail</h1>
				<p>Loading...</p>
			</div>
		);
	}

	return (
		<div style={containerStyle}>
			<h1 style={headerStyle}>Product Detail</h1>
			<div style={productInfoStyle}>
				<p>
					<strong>Name:</strong> {product.name}
				</p>
				<p>
					<strong>Category:</strong> {product.category}
				</p>
				<p>
					<strong>Quantity:</strong> {product.quantity}
				</p>
				<p>
					<strong>Price:</strong> ${product.price.toFixed(2)}
				</p>
			</div>
			<div style={{ marginTop: '20px' }}>
				<Link to={`/products/${id}/edit`}>Edit</Link>
				<Link
					to={`/products/${id}/delete`}
					style={{ marginLeft: '10px' }}
				>
					Delete
				</Link>
			</div>
		</div>
	);
};

export default ProductDetail;
