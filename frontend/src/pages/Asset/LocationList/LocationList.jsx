import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiSearch, FiEdit2, FiTrash2, FiMapPin, FiChevronDown, FiEye } from 'react-icons/fi';
import axios from '../../../utils/axios';
import { useAuth } from '../../../contexts/AuthContext';
import Pagination from '../../../components/Pagination/Pagination';
import ConfirmationModal from '../../../components/Modal/ConfirmationModal';
import Toast from '../../../components/Toast/Toast';
import LocationModal from './LocationModal';
import './LocationList.css';

const LocationList = () => {
    const { hasPermission } = useAuth();
    const navigate = useNavigate();
    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    // Modal states
    const [showModal, setShowModal] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState(null); // If null, it's Add mode. If set, Edit mode.

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [locationToDelete, setLocationToDelete] = useState(null);

    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    // Mobile expand state
    const [expandedIds, setExpandedIds] = useState([]);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const toggleMobileItem = (id) => {
        setExpandedIds(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const fetchLocations = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/asset/locations');
            if (response.data.success) {
                setLocations(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching locations:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLocations();
    }, []);

    // Filter
    const filteredLocations = locations.filter(loc =>
        loc.location_name.toLowerCase().includes(search.toLowerCase()) ||
        (loc.location_code && loc.location_code.toLowerCase().includes(search.toLowerCase())) ||
        (loc.city && loc.city.toLowerCase().includes(search.toLowerCase()))
    );

    // Pagination logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredLocations.slice(indexOfFirstItem, indexOfLastItem);
    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    const handleAddClick = () => {
        setSelectedLocation(null);
        setShowModal(true);
    };

    const handleEditClick = (location) => {
        setSelectedLocation(location);
        setShowModal(true);
    };

    // Placeholder for View Detail - for now maybe just edit or show in modal? 
    // CategoryList has view detail page. Let's redirect to a detail page if it exists or just keep it simple.
    // The plan mentioned View Detail, but let's stick to Edit for now or create a placeholder handleViewClick.
    const handleViewClick = (id) => {
        navigate(`/asset/locations/${id}`);
    };

    const handleDeleteClick = (location) => {
        setLocationToDelete(location);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        try {
            await axios.delete(`/asset/locations/${locationToDelete.id}`);
            setToastMessage('Location deleted successfully');
            setShowToast(true);
            fetchLocations();
        } catch (error) {
            console.error('Error deleting location:', error);
            // Optionally show error toast
        } finally {
            setShowDeleteModal(false);
            setLocationToDelete(null);
        }
    };

    const handleSuccess = () => {
        setToastMessage(selectedLocation ? 'Location updated successfully' : 'Location added successfully');
        setShowToast(true);
        fetchLocations();
    };

    return (
        <div className="location-list">
            <div className="page-header">
                <div>
                    <h1>Asset Locations</h1>
                    <p>Manage physical locations and sites</p>
                </div>
                {hasPermission('asset.locations.manage') && (
                    <button className="btn btn-primary" onClick={handleAddClick}>
                        <FiPlus /> Add Location
                    </button>
                )}
            </div>

            <div className="card">
                <div className="search-section">
                    <div className="input-with-icon">
                        <FiSearch />
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Search locations..."
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="loading-container">
                        <div className="loading-spinner" />
                        <p>Loading locations...</p>
                    </div>
                ) : filteredLocations.length === 0 ? (
                    <div className="empty-state">
                        <FiMapPin />
                        <h3>No locations found</h3>
                        <p>Try adjusting your search or add a new location.</p>
                    </div>
                ) : (
                    <>
                        {/* Desktop Table */}
                        <div className="desktop-table">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Code</th>
                                        <th>Location Name</th>
                                        <th>City</th>
                                        <th>Parent Location</th>
                                        <th>Assets</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentItems.map((loc) => (
                                        <tr key={loc.id}>
                                            <td><span className="badge badge-secondary">{loc.location_code}</span></td>
                                            <td>{loc.location_name}</td>
                                            <td>{loc.city || '-'}</td>
                                            <td>{loc.parent_location_name || '-'}</td>
                                            <td>{loc.asset_count} assets</td>
                                            <td>
                                                <div className="action-buttons">
                                                    {hasPermission('asset.locations.manage') && (
                                                        <>
                                                            <button
                                                                className="btn-icon"
                                                                title="View Details"
                                                                onClick={() => handleViewClick(loc.id)}
                                                            >
                                                                <FiEye />
                                                            </button>
                                                            <button
                                                                className="btn-icon"
                                                                title="Edit"
                                                                onClick={() => handleEditClick(loc)}
                                                            >
                                                                <FiEdit2 />
                                                            </button>
                                                            <button
                                                                className="btn-icon btn-danger"
                                                                title="Delete"
                                                                onClick={() => handleDeleteClick(loc)}
                                                            >
                                                                <FiTrash2 />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile List */}
                        <div className="mobile-list">
                            {currentItems.map((loc) => (
                                <div key={loc.id} className="mobile-list-item">
                                    <div className="mobile-list-main" onClick={() => toggleMobileItem(loc.id)}>
                                        <div className="mobile-location-icon">
                                            <FiMapPin />
                                        </div>
                                        <div className="mobile-location-info">
                                            <div className="location-primary-text">
                                                {loc.location_name}
                                                <span className="location-code-badge">{loc.location_code}</span>
                                            </div>
                                            <div className="location-secondary-text">
                                                {loc.asset_count} assets • {loc.city || 'No City'}
                                            </div>
                                        </div>
                                        <div className="mobile-expand-icon">
                                            <FiChevronDown className={expandedIds.includes(loc.id) ? 'rotated' : ''} />
                                        </div>
                                    </div>

                                    {expandedIds.includes(loc.id) && (
                                        <div className="mobile-list-details">
                                            <div className="detail-grid">
                                                <div className="detail-item">
                                                    <span className="label">Location Code</span>
                                                    <span className="value">{loc.location_code}</span>
                                                </div>
                                                <div className="detail-item">
                                                    <span className="label">Total Assets</span>
                                                    <span className="value">{loc.asset_count}</span>
                                                </div>
                                                <div className="detail-item">
                                                    <span className="label">City</span>
                                                    <span className="value">{loc.city || '-'}</span>
                                                </div>
                                                <div className="detail-item">
                                                    <span className="label">Parent Location</span>
                                                    <span className="value">{loc.parent_location_name || '-'}</span>
                                                </div>
                                                <div className="detail-item full-width">
                                                    <span className="label">Address</span>
                                                    <span className="value">{loc.address || '-'}</span>
                                                </div>
                                            </div>

                                            {hasPermission('asset.locations.manage') && (
                                                <div className="mobile-actions">
                                                    <button
                                                        className="action-btn view"
                                                        onClick={() => handleViewClick(loc.id)}
                                                    >
                                                        <FiEye /> <span>View</span>
                                                    </button>
                                                    <button
                                                        className="action-btn edit"
                                                        onClick={() => handleEditClick(loc)}
                                                    >
                                                        <FiEdit2 /> <span>Edit</span>
                                                    </button>
                                                    <button
                                                        className="action-btn delete"
                                                        onClick={() => handleDeleteClick(loc)}
                                                    >
                                                        <FiTrash2 /> <span>Delete</span>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        <Pagination
                            currentPage={currentPage}
                            totalItems={filteredLocations.length}
                            itemsPerPage={itemsPerPage}
                            onPageChange={paginate}
                            onItemsPerPageChange={setItemsPerPage}
                        />
                    </>
                )}
            </div>

            <LocationModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onSuccess={handleSuccess}
                location={selectedLocation}
                locations={locations}
            />

            <ConfirmationModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={confirmDelete}
                title="Delete Location"
                message={`Are you sure you want to delete "${locationToDelete?.location_name}"?`}
                confirmText="Delete"
                type="danger"
            />

            {showToast && (
                <Toast
                    message={toastMessage}
                    type="success"
                    onClose={() => setShowToast(false)}
                />
            )}
        </div>
    );
};

export default LocationList;
