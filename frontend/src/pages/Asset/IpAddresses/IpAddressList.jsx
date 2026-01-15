import React, { useState, useEffect } from 'react';
import axios from '../../../utils/axios';
import { FiServer, FiChevronRight, FiGrid, FiList, FiArrowLeft } from 'react-icons/fi';
import SubnetList from './components/SubnetList';
import IpList from './components/IpList';
import './IpAddressList.css';

const IpAddressList = () => {
    const [routers, setRouters] = useState([]);
    const [selectedRouter, setSelectedRouter] = useState(null);
    const [selectedSubnet, setSelectedSubnet] = useState(null);
    const [loading, setLoading] = useState(false);

    const [showAll, setShowAll] = useState(false);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchRouters();
    }, []);

    const fetchRouters = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/asset/assets');
            if (response.data.success) {
                // Store all assets, filtering happens in render or separate state if needed
                // But for simplicity, let's keep all in state and filter on the fly
                setRouters(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching routers", error);
        } finally {
            setLoading(false);
        }
    };

    // Filter logic
    const filteredRouters = routers.filter(router => {
        // 1. Search filter
        if (search) {
            const searchLower = search.toLowerCase();
            return (
                router.asset_name?.toLowerCase().includes(searchLower) ||
                router.asset_tag?.toLowerCase().includes(searchLower)
            );
        }

        // 2. Type filter (only if no search term)
        if (showAll) return true;

        // Smart filter: Look for network keywords
        const isNetwork =
            router.category_name?.toLowerCase().includes('network') ||
            router.category_name?.toLowerCase().includes('router') ||
            router.asset_name?.toLowerCase().includes('router') ||
            router.asset_name?.toLowerCase().includes('switch') ||
            router.asset_name?.toLowerCase().includes('firewall') ||
            router.asset_name?.toLowerCase().includes('gateway');

        return isNetwork;
    });

    return (
        <div className="ip-management-container">
            <div className="page-header">
                <div>
                    <h1>IP Address Management</h1>
                    <p>Manage subnets and assignment of IP addresses to devices</p>
                </div>
            </div>

            <div className="ip-content-grid">
                {/* Router Selection Sidebar */}
                <div className="card router-sidebar">
                    <div className="card-header" style={{ padding: '15px', borderBottom: '1px solid var(--border-color)', marginBottom: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', margin: 0 }}>
                            <FiServer /> Network Devices
                        </h3>

                        {/* Search Input */}
                        <div style={{ position: 'relative' }}>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Search device..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                style={{ padding: '6px 10px', fontSize: '13px', width: '100%' }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                                className={`btn btn-xs ${!showAll && !search ? 'btn-primary' : 'btn-outline'}`}
                                onClick={() => { setShowAll(false); setSearch(''); }}
                                title="Show suggested network devices"
                            >
                                Suggested
                            </button>
                            <button
                                className={`btn btn-xs ${showAll && !search ? 'btn-primary' : 'btn-outline'}`}
                                onClick={() => { setShowAll(true); setSearch(''); }}
                                title="Show all assets"
                            >
                                All Assets
                            </button>
                        </div>
                    </div>
                    <div className="router-list">
                        {loading && <div className="p-4 text-center text-muted">Loading...</div>}
                        {!loading && filteredRouters.length === 0 && <div className="p-4 text-center text-muted">No devices found</div>}

                        {filteredRouters.map(router => (
                            <div
                                key={router.id}
                                className={`router-item ${selectedRouter?.id === router.id ? 'active' : ''}`}
                                onClick={() => {
                                    setSelectedRouter(router);
                                    setSelectedSubnet(null);
                                }}
                            >
                                <div>
                                    <div className="router-name">{router.asset_name}</div>
                                    <div className="router-tag">{router.asset_tag}</div>
                                </div>
                                {selectedRouter?.id === router.id && <FiChevronRight style={{ color: 'var(--primary-color)' }} />}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="main-content-area">
                    {!selectedRouter ? (
                        <div className="content-placeholder">
                            <FiServer size={64} style={{ marginBottom: '20px', opacity: 0.5 }} />
                            <h3>Select a Network Device</h3>
                            <p>Choose a router or switch from the list to manage its subnets.</p>
                        </div>
                    ) : (
                        <div className="fade-in">
                            <div className="breadcrumbs">
                                <span className={!selectedSubnet ? 'breadcrumb-active' : ''} onClick={() => setSelectedSubnet(null)} style={{ cursor: selectedSubnet ? 'pointer' : 'default' }}>
                                    {selectedRouter.asset_name}
                                </span>
                                {selectedSubnet && (
                                    <>
                                        <FiChevronRight />
                                        <span className="breadcrumb-active">{selectedSubnet.subnet_address}</span>
                                    </>
                                )}
                            </div>

                            {!selectedSubnet ? (
                                <SubnetList
                                    routerId={selectedRouter.id}
                                    onSelectSubnet={setSelectedSubnet}
                                />
                            ) : (
                                <div>
                                    <button
                                        className="btn btn-outline mb-0 mt-1"
                                        onClick={() => setSelectedSubnet(null)}
                                    >
                                        <FiArrowLeft /> Back to Subnets
                                    </button>
                                    <IpList subnet={selectedSubnet} />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default IpAddressList;
