import React from 'react';
import { Link } from 'react-router-dom';

function HomePage() {
    const pageStyle = {
        height: '100vh',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        textAlign: 'center',
        paddingLeft: '50px',
        paddingRight: '50px'
    };

    return (
        <div style={pageStyle}>
            <h1 style={{ color: '#000000ff' }}>
                Welcome to Live MART
            </h1>
            <p style={{ fontSize: '18px', color: '#000000ff' }}>
                Your one-stop online delivery system.
            </p>
            <Link to="/register" style={{ fontSize: '20px', color: '#00008B' }}>
                Go to Registration Page
            </Link>
        </div>
    );
}

export default HomePage;