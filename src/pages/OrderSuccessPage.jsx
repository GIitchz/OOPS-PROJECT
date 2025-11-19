import React from 'react';
import { Link } from 'react-router-dom';

function OrderSuccessPage() {
    return (
        <div style={{
            textAlign: 'center',
            padding: '4rem 1rem',
            backgroundColor: '#fff',
            maxWidth: '600px',
            margin: '2rem auto',
            borderRadius: '10px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
        }}>
            <h1 style={{ color: '#28a745' }}>Thank You For Your Order!</h1>
            <p style={{ fontSize: '1.2rem', color: '#555' }}>
                Your order has been placed.
            </p>
            <p>
                {/* build function to save order in database */}
            </p>
            <Link
                to="/dashboard"
                style={{
                    display: 'inline-block',
                    marginTop: '2rem',
                    padding: '0.75rem 1.5rem',
                    fontSize: '1.1rem',
                    color: '#fff',
                    backgroundColor: '#007bff',
                    borderRadius: '5px',
                    textDecoration: 'none'
                }}
            >
                Continue Shopping
            </Link>
        </div>
    );
}

export default OrderSuccessPage;