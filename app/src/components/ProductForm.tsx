import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { axiosClientWithAuth } from '../utils/AxiosClient';

const ProductForm: React.FC = () => {
	const { id } = useParams();
	const [product, setProduct] = useState({
		name: '',
		category: '',
		quantity: 0,
		price: 0,
	});

	const navigate = useNavigate();

	useEffect(() => {
		async function fetchProductData() {
			const response = await axiosClientWithAuth.get(`/products/${id}`);
			setProduct(response.data);
		}
		if (id) {
			fetchProductData();
		}
	}, [id]);

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setProduct({ ...product, [name]: value });
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (id) {
			// Update existing product
			await axiosClientWithAuth.put(`/products/${id}`, product);
		} else {
			// Create a new product
			await axiosClientWithAuth.post('/products', product);
		}
		// Redirect to product list page or do something else after submission
		navigate('/products');
	};

	const formStyle = {
		fontFamily: 'Arial, sans-serif',
		// backgroundColor: '#f0f0f0',
		padding: '20px',
		height: '100vh',
		width: '100vw',
		display: 'flex',
		flexDirection: 'column',
		alignItems: 'center',
		justifyContent: 'center',
	};

	const headerStyle = {
		fontSize: '24px',
		marginBottom: '20px',
	};

	const labelStyle = {
		display: 'block',
		marginBottom: '10px',
	};

	const inputStyle = {
		width: '100%',
		padding: '8px',
		marginBottom: '10px',
		border: '1px solid #ddd',
		borderRadius: '4px',
	};

	const buttonStyle = {
		backgroundColor: '#007bff',
		color: 'white',
		padding: '10px 20px',
		border: 'none',
		borderRadius: '4px',
		cursor: 'pointer',
	};

	return (
		<div style={formStyle}>
			<h1 style={headerStyle}>
				{id ? 'Edit Product' : 'Create Product'}
			</h1>
			<form onSubmit={handleSubmit}>
				<label style={labelStyle}>
					Name:
					<input
						type='text'
						name='name'
						value={product.name}
						onChange={handleChange}
						style={inputStyle}
					/>
				</label>
				<label style={labelStyle}>
					Category:
					<input
						type='text'
						name='category'
						value={product.category}
						onChange={handleChange}
						style={inputStyle}
					/>
				</label>
				<label style={labelStyle}>
					Quantity:
					<input
						type='number'
						name='quantity'
						value={product.quantity}
						onChange={handleChange}
						style={inputStyle}
					/>
				</label>
				<label style={labelStyle}>
					Price:
					<input
						type='number'
						name='price'
						value={product.price}
						onChange={handleChange}
						style={inputStyle}
					/>
				</label>
				<button type='submit' style={buttonStyle}>
					{id ? 'Update' : 'Create'}
				</button>
			</form>
		</div>
	);
};

export default ProductForm;
