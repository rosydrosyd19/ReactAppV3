import React, { useState, useEffect } from 'react';
import { FiPlus, FiSearch, FiEdit2, FiTrash2, FiTruck, FiChevronDown, FiPhone, FiMail } from 'react-icons/fi';
import axios from '../../../utils/axios';
import { useAuth } from '../../../contexts/AuthContext';
import Pagination from '../../../components/Pagination/Pagination';
import ConfirmationModal from '../../../components/Modal/ConfirmationModal';
import Toast from '../../../components/Toast/Toast';
import SupplierModal from './SupplierModal';
import './SupplierList.css';

const SupplierList = () => {
    const { hasPermission } = useAuth();
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    // Modal states
    const [showModal, setShowModal] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState(null);

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [supplierToDelete, setSupplierToDelete] = useState(null);

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

    const fetchSuppliers = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/asset/suppliers');
            if (response.data.success) {
                setSuppliers(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching suppliers:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSuppliers();
    }, []);

    // Filter
    const filteredSuppliers = suppliers.filter(supplier =>
        supplier.supplier_name.toLowerCase().includes(search.toLowerCase()) ||
        (supplier.contact_person && supplier.contact_person.toLowerCase().includes(search.toLowerCase())) ||
        (supplier.email && supplier.email.toLowerCase().includes(search.toLowerCase()))
    );

    // Pagination logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredSuppliers.slice(indexOfFirstItem, indexOfLastItem);
    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    const handleAddClick = () => {
        setSelectedSupplier(null);
        setShowModal(true);
    };

    const handleEditClick = (supplier) => {
        setSelectedSupplier(supplier);
        setShowModal(true);
    };

    const handleDeleteClick = (supplier) => {
        setSupplierToDelete(supplier);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        try {
            await axios.delete(`/asset/suppliers/${supplierToDelete.id}`);
            setToastMessage('Supplier deleted successfully');
            setShowToast(true);
            fetchSuppliers();
        } catch (error) {
            console.error('Error deleting supplier:', error);
            // Optionally show error toast
        } finally {
            setShowDeleteModal(false);
            setSupplierToDelete(null);
        }
    };

    const handleSuccess = () => {
        setToastMessage(selectedSupplier ? 'Supplier updated successfully' : 'Supplier added successfully');
        setShowToast(true);
        fetchSuppliers();
    };

    return (
        <div className="supplier-list">
            <div className="page-header">
                <div>
                    <h1>Asset Suppliers</h1>
                    <p>Manage external suppliers and vendors</p>
                </div>
                {hasPermission('asset.suppliers.manage') && (
                    <button className="btn btn-primary" onClick={handleAddClick}>
                        <FiPlus /> Add Supplier
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
                            placeholder="Search suppliers..."
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="loading-container">
                        <div className="loading-spinner" />
                        <p>Loading suppliers...</p>
                    </div>
                ) : filteredSuppliers.length === 0 ? (
                    <div className="empty-state">
                        <FiTruck />
                        <h3>No suppliers found</h3>
                        <p>Try adjusting your search or add a new supplier.</p>
                    </div>
                ) : (
                    <>
                        {/* Desktop Table */}
                        <div className="desktop-table">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Supplier Name</th>
                                        <th>Contact Person</th>
                                        <th>Email</th>
                                        <th>Phone</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentItems.map((supplier) => (
                                        <tr key={supplier.id}>
                                            <td><strong>{supplier.supplier_name}</strong></td>
                                            <td>{supplier.contact_person || '-'}</td>
                                            <td>{supplier.email || '-'}</td>
                                            <td>{supplier.phone || '-'}</td>
                                            <td>
                                                <div className="action-buttons">
                                                    {hasPermission('asset.suppliers.manage') && (
                                                        <>
                                                            <button
                                                                className="btn-icon"
                                                                title="Edit"
                                                                onClick={() => handleEditClick(supplier)}
                                                            >
                                                                <FiEdit2 />
                                                            </button>
                                                            <button
                                                                className="btn-icon btn-danger"
                                                                title="Delete"
                                                                onClick={() => handleDeleteClick(supplier)}
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
                            {currentItems.map((supplier) => (
                                <div key={supplier.id} className="mobile-list-item">
                                    <div className="mobile-list-main" onClick={() => toggleMobileItem(supplier.id)}>
                                        <div className="mobile-supplier-icon">
                                            <FiTruck />
                                        </div>
                                        <div className="mobile-supplier-info">
                                            <div className="supplier-primary-text">
                                                {supplier.supplier_name}
                                            </div>
                                            <div className="supplier-secondary-text">
                                                {supplier.contact_person || 'No Contact Person'}
                                            </div>
                                        </div>
                                        <div className="mobile-expand-icon">
                                            <FiChevronDown className={expandedIds.includes(supplier.id) ? 'rotated' : ''} />
                                        </div>
                                    </div>

                                    {expandedIds.includes(supplier.id) && (
                                        <div className="mobile-list-details">
                                            <div className="detail-grid">
                                                <div className="detail-item">
                                                    <span className="label">Email</span>
                                                    <span className="value">{supplier.email || '-'}</span>
                                                </div>
                                                <div className="detail-item">
                                                    <span className="label">Phone</span>
                                                    <span className="value">{supplier.phone || '-'}</span>
                                                </div>
                                                <div className="detail-item full-width">
                                                    <span className="label">Address</span>
                                                    <span className="value">{supplier.address || '-'}</span>
                                                </div>
                                                <div className="detail-item full-width">
                                                    <span className="label">Website</span>
                                                    <span className="value">
                                                        {supplier.website ? (
                                                            <a href={supplier.website} target="_blank" rel="noopener noreferrer">
                                                                {supplier.website}
                                                            </a>
                                                        ) : '-'}
                                                    </span>
                                                </div>
                                            </div>

                                            {hasPermission('asset.suppliers.manage') && (
                                                <div className="mobile-actions">
                                                    <button
                                                        className="action-btn edit"
                                                        onClick={() => handleEditClick(supplier)}
                                                    >
                                                        <FiEdit2 /> <span>Edit</span>
                                                    </button>
                                                    <button
                                                        className="action-btn delete"
                                                        onClick={() => handleDeleteClick(supplier)}
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
                            totalItems={filteredSuppliers.length}
                            itemsPerPage={itemsPerPage}
                            onPageChange={paginate}
                            onItemsPerPageChange={setItemsPerPage}
                        />
                    </>
                )}
            </div>

            <SupplierModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onSuccess={handleSuccess}
                supplier={selectedSupplier}
            />

            <ConfirmationModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={confirmDelete}
                title="Delete Supplier"
                message={`Are you sure you want to delete "${supplierToDelete?.supplier_name}"?`}
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

export default SupplierList;
