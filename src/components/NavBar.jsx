import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { ShoppingCart, LogOut, Menu, X, LayoutDashboard } from 'lucide-react';

// Import your specific logo asset
import SparklePandaLogo from '../assets/sparkle_panda_logo-bg1.png';

function NavBar() {
    const { cartItems } = useCart();
    const { user, loading, logout } = useAuth();
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const cartItemCount = cartItems.reduce((total, item) => total + (item.quantity || 0), 0);

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    const getRoleLandingPath = (role) => {
        if (!role) return '/';
        switch (role) {
            case 'retailer': return '/admin/retailer';
            case 'wholesaler': return '/admin/wholesaler';
            case 'customer': return '/dashboard';
            default: return '/';
        }
    };

    const isAdmin = user && (user.role === 'retailer' || user.role === 'wholesaler');
    const landingPath = getRoleLandingPath(user?.role);

    const LinkItem = ({ to, children, onClick }) => (
        <Link
            to={to}
            onClick={onClick}
            className="text-sm font-medium text-slate-600 hover:text-green-600 transition-colors px-4 py-2 rounded-2xl hover:bg-green-100 flex items-center gap-2"
        >
            {children}
        </Link>
    );

    const renderNavLinks = (mobile = false) => {

        const MobWrapper = ({ children }) => {
            return (
                <div className='flex flex-col space-y-2'>
                    {children}
                </div>
            );
        }

        const NonMobWrapper = ({ children }) => {
            return (
                <React.Fragment>
                    {children}
                </React.Fragment>
            );
        }

        const Wrapper = mobile ? MobWrapper : NonMobWrapper;

        return (
            <Wrapper>
                {(!user || user.role === 'customer') && (
                    <>
                        <LinkItem to="/dashboard" onClick={() => mobile && setIsMobileMenuOpen(false)}>Products</LinkItem>
                        {user && (
                            <LinkItem to="/cart" onClick={() => mobile && setIsMobileMenuOpen(false)}>
                                <div className="flex items-center gap-2">
                                    {mobile && <ShoppingCart size={18} />}
                                    <span>Cart</span>
                                    {cartItemCount > 0 && (
                                        <span className="ml-1 bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                            {cartItemCount}
                                        </span>
                                    )}
                                </div>
                            </LinkItem>
                        )}
                        {user && <LinkItem to="/profile" onClick={() => mobile && setIsMobileMenuOpen(false)}>Profile</LinkItem>}
                    </>
                )}

                {isAdmin && (
                    <>
                        {/* NEW: Explicit Dashboard Link */}
                        <LinkItem to={landingPath} onClick={() => mobile && setIsMobileMenuOpen(false)}>
                            {mobile && <LayoutDashboard size={18} />}
                            Dashboard
                        </LinkItem>

                        {user.role === 'retailer' && (
                            <LinkItem to="/cart" onClick={() => mobile && setIsMobileMenuOpen(false)}>
                                <div className="flex items-center gap-2">
                                    {mobile && <ShoppingCart size={18} />}
                                    <span>Cart</span>
                                    {cartItemCount > 0 && (
                                        <span className="ml-1 bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                            {cartItemCount}
                                        </span>
                                    )}
                                </div>
                            </LinkItem>
                        )}
                        <LinkItem to="/profile" onClick={() => mobile && setIsMobileMenuOpen(false)}>Profile</LinkItem>
                    </>
                )}
            </Wrapper>
        );
    };

    return (
        <nav className="bg-white/80 backdrop-blur-md border-b border-green-100 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-20">

                    <div className="flex items-center">
                        <Link to={landingPath} className="flex items-center gap-1 group">
                            {/* Using your imported image logo */}
                            <img
                                src={SparklePandaLogo}
                                alt="The Grove Logo"
                                className="h-12 w-12"
                            />
                            {/* UPDATED: "Grove" text with GREEN gradient */}
                            <span className="text-2xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-500">
                                Grove
                            </span>
                        </Link>
                    </div>

                    <div className="hidden md:flex items-center space-x-2">
                        {renderNavLinks()}

                        {user ? (
                            <button
                                onClick={handleLogout}
                                className="ml-4 flex items-center gap-2 text-sm font-bold text-green-600 hover:text-white border-2 border-green-100 hover:bg-green-500 hover:border-green-500 px-5 py-2 rounded-2xl transition-all duration-300"
                            >
                                <LogOut size={18} />
                                Logout
                            </button>
                        ) : (
                            <Link
                                to="/login"
                                className="ml-4 bg-green-500 hover:bg-green-600 text-white px-6 py-2.5 rounded-2xl text-sm font-bold transition-all shadow-lg shadow-green-200 hover:shadow-green-300 hover:-translate-y-0.5"
                            >
                                Sign In
                            </Link>
                        )}
                    </div>

                    <div className="flex items-center md:hidden">
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="text-slate-500 hover:text-green-600 p-2"
                        >
                            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </div>

            {isMobileMenuOpen && (
                <div className="md:hidden bg-white border-b border-green-100 px-4 pt-2 pb-4 shadow-xl">
                    {renderNavLinks(true)}
                    {user ? (
                        <button
                            onClick={handleLogout}
                            className="w-full text-left mt-4 flex items-center gap-2 text-sm font-bold text-green-600 px-4 py-3 bg-green-50 rounded-xl"
                        >
                            <LogOut size={18} />
                            Logout
                        </button>
                    ) : (
                        <Link
                            to="/login"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="block w-full mt-4 text-center bg-green-500 text-white px-4 py-3 rounded-xl text-sm font-bold"
                        >
                            Sign In
                        </Link>
                    )}
                </div>
            )}
        </nav>
    );
}

export default NavBar;