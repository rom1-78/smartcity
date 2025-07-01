import React from "react";
import { MapPin, Menu, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { isLoggedIn, removeToken, getUserFromToken } from "../services/auth";

const Navbar: React.FC = () => {
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);
    const navigate = useNavigate();
    const logged = isLoggedIn();
    const user = getUserFromToken();

    const handleLogin = () => navigate("/auth?mode=login");
    const handleRegister = () => navigate("/auth?mode=register");
    const handleDashboard = () => navigate("/dashboard");
    const handleHome = () => navigate("/");
    const handleViewPublicData = () => navigate("/donnees-publiques");
    
    // NOUVELLES FONCTIONS DE NAVIGATION VERS LES ONGLETS
    const handleNavigateToTab = (tab: string) => {
        if (logged) {
            navigate(`/dashboard?tab=${tab}`);
        } else {
            navigate("/auth?mode=login");
        }
    };

    const handleLogout = () => {
        removeToken();
        navigate("/auth?mode=login");
    };

    return (
        <nav className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
                <div className="flex items-center cursor-pointer" onClick={handleHome}>
                    <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                        <MapPin className="h-5 w-5 text-white" />
                    </div>
                    <span className="ml-2 text-xl font-bold text-gray-900">TechCity</span>
                </div>
                <div className="hidden md:flex items-center space-x-4">
                    <button onClick={handleHome} className="text-indigo-600 px-3 py-2 text-sm font-medium">
                        Accueil
                    </button>
                    {logged && (
                        <button 
                            onClick={handleDashboard} 
                            className="text-gray-500 hover:text-gray-900 px-3 py-2 text-sm font-medium"
                        >
                            Dashboard
                        </button>
                    )}
                    <button 
                        onClick={() => handleNavigateToTab('map')} 
                        className="text-gray-500 hover:text-gray-900 px-3 py-2 text-sm font-medium"
                    >
                        Carte
                    </button>
                    <button 
                        onClick={() => handleNavigateToTab('analytics')} 
                        className="text-gray-500 hover:text-gray-900 px-3 py-2 text-sm font-medium"
                    >
                        Rapports
                    </button>
                    
                    <button className="text-gray-500 hover:text-gray-900 px-3 py-2 text-sm font-medium">
                        À propos
                    </button>
                </div>
                <div className="hidden md:flex items-center">
                    {logged ? (
                        <>
                            <span className="text-sm mr-4 text-gray-700 capitalize">
                                {user?.role} - {user?.first_name} {user?.last_name}
                            </span>
                            <button
                                onClick={handleLogout}
                                className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700"
                            >
                                Se déconnecter
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={handleLogin}
                                className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 mr-2"
                            >
                                Se connecter
                            </button>
                        </>
                    )}
                </div>
                {/* Mobile menu button */}
                <div className="md:hidden">
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="text-gray-500 hover:text-gray-900 focus:outline-none"
                    >
                        {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    </button>
                </div>
            </div>
            {isMenuOpen && (
                <div className="md:hidden bg-white border-t border-gray-200">
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                        <button onClick={handleHome} className="text-indigo-600 block px-3 py-2 text-base font-medium">
                            Accueil
                        </button>
                        <button onClick={handleViewPublicData} className="text-gray-500 hover:text-gray-900 block px-3 py-2 text-base font-medium">
                            Données
                        </button>
                        <button 
                            onClick={() => handleNavigateToTab('map')} 
                            className="text-gray-500 hover:text-gray-900 block px-3 py-2 text-base font-medium"
                        >
                            Carte
                        </button>
                        <button 
                            onClick={() => handleNavigateToTab('analytics')} 
                            className="text-gray-500 hover:text-gray-900 block px-3 py-2 text-base font-medium"
                        >
                            Rapports
                        </button>
                        <button className="text-gray-500 hover:text-gray-900 block px-3 py-2 text-base font-medium">
                            À propos
                        </button>
                        {logged ? (
                            <>
                                <button onClick={handleDashboard} className="w-full text-left bg-indigo-600 text-white block px-3 py-2 text-base font-medium rounded-lg mt-2">
                                    Dashboard
                                </button>
                                <button onClick={handleLogout} className="w-full text-left bg-red-600 text-white block px-3 py-2 text-base font-medium rounded-lg mt-2">
                                    Se déconnecter
                                </button>
                            </>
                        ) : (
                            <>
                                <button onClick={handleLogin} className="w-full text-left bg-indigo-600 text-white block px-3 py-2 text-base font-medium rounded-lg mt-2">
                                    Se connecter
                                </button>
                                <button onClick={handleRegister} className="w-full text-left bg-gray-200 text-indigo-600 block px-3 py-2 text-base font-medium rounded-lg mt-2">
                                    S'inscrire
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;