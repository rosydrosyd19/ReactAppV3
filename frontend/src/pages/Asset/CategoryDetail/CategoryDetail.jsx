import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../../../utils/axios';
import {
    FiArrowLeft,
    FiEdit2,
    FiTrash2,
    FiBox,
    FiDollarSign,
    FiGrid,
    FiSearch
} from 'react-icons/fi';
import './CategoryDetail.css';

const CategoryDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [category, setCategory] = useState(null);
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchCategoryData();
    }, [id]);

    const fetchCategoryData = async () => {
        try {
            setLoading(true);
            // Fetch category details
            const catRes = await axios.get(`/asset/categories/${id}`);
            if (!catRes.data.success) throw new Error('Failed to load category');
            setCategory(catRes.data.data);

            // Fetch assets in this category
            const assetsRes = await axios.get(`/asset/assets`, {
                params: { category_id: id }
            });
            if (assetsRes.data.success) {
                setAssets(assetsRes.data.data);
            }
        } catch (err) {
            console.error('Error fetching detail:', err);
            setError(err.message || 'Error loading data');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="loading-container">
            <div className="loading-spinner" />
        </div>
    );

    if (error || !category) return (
        <div className="error-container">
            <h3>Error</h3>
            <p>{error || 'Category not found'}</p>
            <button className="btn btn-primary" onClick={() => navigate('/asset/categories')}>
                <FiArrowLeft /> Back
            </button>
        </div>
    );

    // Calculate total value
    const totalValue = assets.reduce((sum, asset) => sum + (Number(asset.purchase_cost) || 0), 0);

    return (
        <div className="category-detail-container">
            {/* Header */}
            <div className="detail-header">
                <div className="header-left">
                    <button className="btn btn-outline" onClick={() => navigate('/asset/categories')}>
                        <FiArrowLeft /> Back
                    </button>
                    <div className="header-title" style={{ marginTop: '1rem' }}>
                        <h1>
                            <FiGrid className="text-primary" />
                            {category.category_name}
                            <span className="category-code-badge">{category.category_code}</span>
                        </h1>
                        <p>{category.description || 'No description provided'}</p>
                    </div>
                </div>

                {/* Actions - Can add edit/delete here later if needed */}
                <div className="header-actions">
                    {/* Placeholder for future actions */}
                </div>
            </div>

            {/* Stats Overview */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6' }}>
                        <FiBox />
                    </div>
                    <div className="stat-info">
                        <h3>Total Assets</h3>
                        <p>{assets.length}</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10B981' }}>
                        <FiDollarSign />
                    </div>
                    <div className="stat-info">
                        <h3>Total Value</h3>
                        <p>{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(totalValue)}</p>
                    </div>
                </div>
            </div>

            {/* Assets List Table */}
            <div className="content-section">
                <div className="section-header">
                    <h2>Assets in this Category</h2>
                    {/* Could add search filter here specifically for this table */}
                </div>
                <div className="assets-table-wrapper">
                    <table className="assets-table">
                        <thead>
                            <tr>
                                <th>Asset Tag</th>
                                <th>Name</th>
                                <th>Model</th>
                                <th>Status</th>
                                <th>Location</th>
                                <th>Assigned To</th>
                                <th>Cost</th>
                            </tr>
                        </thead>
                        <tbody>
                            {assets.length > 0 ? (
                                assets.map(asset => (
                                    <tr key={asset.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/asset/items/${asset.id}`)}>
                                        <td>
                                            <span className="asset-link">{asset.asset_tag}</span>
                                        </td>
                                        <td>{asset.asset_name}</td>
                                        <td>{asset.model || '-'}</td>
                                        <td>
                                            <span className={`status-badge ${asset.status}`}>
                                                {asset.status}
                                            </span>
                                        </td>
                                        <td>{asset.location_name || '-'}</td>
                                        <td>{asset.assigned_to_username || asset.assigned_to_asset_name || '-'}</td>
                                        <td>
                                            {asset.purchase_cost
                                                ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(asset.purchase_cost)
                                                : '-'}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                                        <FiBox style={{ fontSize: '2rem', marginBottom: '0.5rem', display: 'block', margin: '0 auto 0.5rem' }} />
                                        No assets found in this category
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default CategoryDetail;
